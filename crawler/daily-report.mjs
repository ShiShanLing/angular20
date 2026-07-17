#!/usr/bin/env node
/**
 * 每日定时任务：交易日分析 + 发邮件
 *
 * 功能：
 *   1. 判断今天是否为A股交易日
 *   2. 如果是，运行完整分析（抓取+关键词+AI）
 *   3. 将结果通过邮件发送
 *
 * 用法:
 *   node crawler/daily-report.mjs              # 正常运行
 *   node crawler/daily-report.mjs --force      # 强制运行（跳过交易日检查）
 *   node crawler/daily-report.mjs --test       # 仅测试邮件发送
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import nodemailer from 'nodemailer';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const DATA_DIR = join(__dirname, 'data');
const EMAIL_CONFIG_FILE = join(__dirname, 'email-config.json');
const HOLIDAYS_FILE = join(__dirname, 'holidays.json');
const ANALYSIS_SCRIPT = join(__dirname, 'run-analysis.mjs');

const args = process.argv.slice(2);
const forceRun = args.includes('--force');
const testMode = args.includes('--test');

// ============================================================
// 交易日判断
// ============================================================

// 2025/2026 A股法定假日（每年初更新，也可从holidays.json动态加载）
const DEFAULT_HOLIDAYS = {
  "2025": [
    // 元旦
    "2025-01-01",
    // 春节
    "2025-01-28", "2025-01-29", "2025-01-30", "2025-01-31",
    "2025-02-01", "2025-02-02", "2025-02-03", "2025-02-04",
    // 清明
    "2025-04-04", "2025-04-05", "2025-04-06",
    // 劳动节
    "2025-05-01", "2025-05-02", "2025-05-03", "2025-05-04", "2025-05-05",
    // 端午
    "2025-05-31", "2025-06-01", "2025-06-02",
    // 中秋+国庆
    "2025-10-01", "2025-10-02", "2025-10-03", "2025-10-04",
    "2025-10-05", "2025-10-06", "2025-10-07", "2025-10-08",
  ],
  "2026": [
    // 元旦
    "2026-01-01", "2026-01-02", "2026-01-03",
    // 春节
    "2026-02-16", "2026-02-17", "2026-02-18", "2026-02-19",
    "2026-02-20", "2026-02-21", "2026-02-22",
    // 清明
    "2026-04-04", "2026-04-05", "2026-04-06",
    // 劳动节
    "2026-05-01", "2026-05-02", "2026-05-03", "2026-05-04", "2026-05-05",
    // 端午
    "2026-06-19", "2026-06-20", "2026-06-21",
    // 中秋
    "2026-09-25", "2026-09-26", "2026-09-27",
    // 国庆
    "2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04",
    "2026-10-05", "2026-10-06", "2026-10-07", "2026-10-08",
  ]
};

function isTradingDay(date = new Date()) {
  // 使用东八区时间
  const now = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  const dateStr = now.toISOString().substring(0, 10);
  const dayOfWeek = now.getUTCDay(); // 0=Sunday, 6=Saturday

  // 周末不交易
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    return { trading: false, reason: '周末休市' };
  }

  // 加载假日列表
  let holidays = DEFAULT_HOLIDAYS;
  if (existsSync(HOLIDAYS_FILE)) {
    try {
      holidays = JSON.parse(readFileSync(HOLIDAYS_FILE, 'utf-8'));
    } catch {}
  }

  // 合并所有年份的假日
  const allHolidays = new Set();
  for (const year of Object.values(holidays)) {
    if (Array.isArray(year)) {
      year.forEach(d => allHolidays.add(d));
    }
  }

  // 检查法定假日
  if (allHolidays.has(dateStr)) {
    return { trading: false, reason: `法定假日 (${dateStr})` };
  }

  return { trading: true, reason: '交易日' };
}

// ============================================================
// 运行分析
// ============================================================

function runAnalysis() {
  console.log(`[${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}] 开始每日分析...\n`);

  const startTime = Date.now();
  let output = '';

  try {
    // 设置环境变量
    const home = process.env.HOME || '/root';
    process.env.PATH = `${home}/.local/bin:${home}/.qoder/bin/qodercli:${process.env.PATH}`;

    output = execSync(`node ${ANALYSIS_SCRIPT} --pages=5 2>&1`, {
      encoding: 'utf-8',
      timeout: 900000, // 15分钟超时
      cwd: PROJECT_ROOT,
      maxBuffer: 20 * 1024 * 1024,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n分析完成，耗时 ${elapsed} 秒\n`);
    return output;
  } catch (err) {
    if (err.killed) {
      output += '\n\n❌ 分析超时（>15分钟）';
    } else {
      output += `\n\n❌ 分析出错: ${err.message?.substring(0, 500)}`;
    }
    return output;
  }
}

// ============================================================
// 生成HTML邮件
// ============================================================

function buildHtmlEmail(analysisOutput, tradingInfo) {
  const today = new Date();
  const dateStr = new Date(today.getTime() + 8 * 60 * 60 * 1000).toISOString().substring(0, 10);

  // 从AI结果文件中读取结构化数据
  let aiData = null;
  const aiJsonFile = join(DATA_DIR, 'qoder_ai_result.json');
  if (existsSync(aiJsonFile)) {
    try { aiData = JSON.parse(readFileSync(aiJsonFile, 'utf-8')); } catch {}
  }

  // 从关键词结果中读取
  let kwData = null;
  const kwFile = join(DATA_DIR, 'guba_analysis.json');
  if (existsSync(kwFile)) {
    try { kwData = JSON.parse(readFileSync(kwFile, 'utf-8')); } catch {}
  }

  // 构建HTML
  const indexColor = (val) => val < 30 ? '#22c55e' : val < 50 ? '#eab308' : val < 70 ? '#f97316' : '#ef4444';
  const levelEmoji = (val) => val < 30 ? '🟢' : val < 50 ? '🟡' : val < 70 ? '🟠' : '🔴';

  let html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, 'Microsoft YaHei', sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background: #f5f5f5;">

<div style="background: linear-gradient(135deg, #1e3a5f, #2563eb); color: white; padding: 24px; border-radius: 12px 12px 0 0;">
  <h1 style="margin: 0; font-size: 22px;">📊 A股市场情绪日报</h1>
  <p style="margin: 8px 0 0; opacity: 0.85;">${dateStr} · ${tradingInfo.reason}</p>
</div>

<div style="background: white; padding: 24px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
`;

  // AI 指数
  if (aiData) {
    const mi = aiData.marketIndex;
    const level = mi < 20 ? '极度恐慌' : mi < 30 ? '恐慌' : mi < 40 ? '偏恐慌' : mi < 50 ? '略偏恐慌' : mi < 60 ? '中性' : mi < 70 ? '偏贪婪' : '贪婪';
    const d = aiData.distribution;
    const t = aiData.totalPosts;

    html += `
  <h2 style="color: #1e3a5f; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px;">🤖 AI 情绪分析</h2>
  <div style="display: flex; gap: 16px; margin: 16px 0;">
    <div style="flex: 1; background: #f8fafc; border-radius: 8px; padding: 16px; text-align: center;">
      <div style="font-size: 36px; font-weight: bold; color: ${indexColor(mi)};">${mi}</div>
      <div style="color: #6b7280; font-size: 14px;">市场指数 / 100</div>
      <div style="margin-top: 4px; font-size: 14px; font-weight: 500;">${levelEmoji(mi)} ${level}</div>
    </div>
    <div style="flex: 1; background: #f8fafc; border-radius: 8px; padding: 16px;">
      <div style="font-size: 14px; color: #6b7280; margin-bottom: 8px;">情绪分布（${t}条帖子）</div>
      <div style="font-size: 13px; line-height: 2;">
        <span style="color: #ef4444;">看空 ${d.bearish} (${(d.bearish/t*100).toFixed(1)}%)</span><br>
        <span style="color: #f97316;">恐慌 ${d.fear} (${(d.fear/t*100).toFixed(1)}%)</span><br>
        <span style="color: #6b7280;">中性 ${d.neutral} (${(d.neutral/t*100).toFixed(1)}%)</span><br>
        <span style="color: #22c55e;">看多 ${d.bullish} (${(d.bullish/t*100).toFixed(1)}%)</span><br>
        <span style="color: #eab308;">贪婪 ${d.greed} (${(d.greed/t*100).toFixed(1)}%)</span>
      </div>
    </div>
  </div>
`;

    // 板块温度
    if (aiData.sectors && Object.keys(aiData.sectors).length > 0) {
      html += `<h3 style="color: #374151; margin-top: 20px;">🌡️ 板块情绪</h3><table style="width: 100%; border-collapse: collapse; font-size: 13px;">`;
      html += `<tr style="background: #f1f5f9;"><th style="padding: 8px; text-align: left;">板块</th><th>温度</th><th>帖子</th><th>看空</th><th>恐慌</th><th>中性</th><th>看多</th></tr>`;

      const sorted = Object.entries(aiData.sectors).sort((a, b) => b[1].posts - a[1].posts).slice(0, 8);
      for (const [name, s] of sorted) {
        const tempColor = s.temperature < 30 ? '#22c55e' : s.temperature < 50 ? '#eab308' : '#ef4444';
        html += `<tr style="border-bottom: 1px solid #e5e7eb;">
          <td style="padding: 6px 8px;">${name}</td>
          <td style="text-align: center; font-weight: bold; color: ${tempColor};">${s.temperature}°</td>
          <td style="text-align: center;">${s.posts}</td>
          <td style="text-align: center;">${s.bearish}</td>
          <td style="text-align: center;">${s.fear}</td>
          <td style="text-align: center;">${s.neutral}</td>
          <td style="text-align: center;">${s.bullish}</td>
        </tr>`;
      }
      html += `</table>`;
    }

    // 关键发现
    if (aiData.signals && aiData.signals.length > 0) {
      html += `<h3 style="color: #374151; margin-top: 20px;">🔍 关键发现</h3><ul style="font-size: 13px; line-height: 1.8;">`;
      for (const s of aiData.signals.slice(0, 5)) {
        html += `<li>${s}</li>`;
      }
      html += `</ul>`;
    }
  }

  // 关键词分析
  if (kwData && kwData.marketIndex) {
    const kwMi = kwData.marketIndex.index;
    html += `
  <h2 style="color: #1e3a5f; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; margin-top: 24px;">🔤 关键词分析</h2>
  <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 12px 0;">
    <span style="font-size: 14px; color: #6b7280;">关键词指数：</span>
    <span style="font-size: 24px; font-weight: bold; color: ${indexColor(kwMi)};">${kwMi}</span>
    <span style="font-size: 14px; color: #6b7280;"> / 100 · ${kwData.marketIndex.level}</span>
  </div>
`;

    if (aiData) {
      const aiMi = aiData.marketIndex;
      const diff = aiMi - kwMi;
      html += `
  <div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 12px; margin: 12px 0; font-size: 13px;">
    <strong>📌 对比差异：</strong>AI指数 ${aiMi}° vs 关键词 ${kwMi}°（差 ${diff > 0 ? '+' : ''}${diff}°）<br>
    AI分析识别了讽刺、反语等隐藏情绪，关键词方案 ${kwData.marketIndex.totalPosts} 条帖子中 ${(kwData.marketIndex.totalPosts * 0.63).toFixed(0)} 条归为中性。
  </div>
`;
    }
  }

  html += `
  <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #9ca3af; text-align: center;">
    ⚠️ 本报告仅供情绪参考，不构成投资建议<br>
    由 Qoder AI 自动生成 · ${dateStr}
  </div>
</div>
</body>
</html>`;

  return html;
}

// ============================================================
// 发送邮件
// ============================================================

async function sendEmail(htmlContent, subject) {
  if (!existsSync(EMAIL_CONFIG_FILE)) {
    console.error('❌ 邮箱配置文件不存在: ' + EMAIL_CONFIG_FILE);
    return false;
  }

  const config = JSON.parse(readFileSync(EMAIL_CONFIG_FILE, 'utf-8'));

  const transporter = nodemailer.createTransport(config.smtp);

  const today = new Date();
  const dateStr = new Date(today.getTime() + 8 * 60 * 60 * 1000).toISOString().substring(0, 10);

  try {
    const info = await transporter.sendMail({
      from: config.from,
      to: config.to,
      subject: subject || `📊 A股情绪日报 ${dateStr}`,
      html: htmlContent,
    });

    console.log(`✅ 邮件发送成功: ${info.messageId}`);
    return true;
  } catch (err) {
    console.error(`❌ 邮件发送失败: ${err.message}`);
    return false;
  }
}

// ============================================================
// 主流程
// ============================================================

async function main() {
  console.log('╔══════════════════════════════════════════╗');
  console.log('║  📬 A股情绪日报 · 定时任务              ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // 交易日检查
  const tradingInfo = isTradingDay();
  console.log(`📅 ${tradingInfo.reason}`);

  if (!tradingInfo.trading && !forceRun) {
    console.log('⏭  非交易日，跳过');
    return;
  }

  if (testMode) {
    console.log('🧪 测试模式：仅发送邮件...\n');
    const testHtml = `<h1>测试邮件</h1><p>如果你收到这封邮件，说明SMTP配置正确。</p><p>时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}</p>`;
    await sendEmail(testHtml, '🧪 情绪日报测试邮件');
    return;
  }

  // 运行分析
  const output = runAnalysis();

  // 生成HTML邮件
  console.log('📝 生成邮件内容...');
  const html = buildHtmlEmail(output, tradingInfo);

  // 保存HTML（调试用）
  const htmlFile = join(DATA_DIR, 'daily_report.html');
  writeFileSync(htmlFile, html, 'utf-8');

  // 发送邮件
  console.log('📤 发送邮件...\n');
  const today = new Date();
  const dateStr = new Date(today.getTime() + 8 * 60 * 60 * 1000).toISOString().substring(0, 10);

  let aiIndex = '?';
  const aiJsonFile = join(DATA_DIR, 'qoder_ai_result.json');
  if (existsSync(aiJsonFile)) {
    try {
      const d = JSON.parse(readFileSync(aiJsonFile, 'utf-8'));
      aiIndex = d.marketIndex;
    } catch {}
  }

  const subject = `📊 A股情绪日报 ${dateStr} · AI指数${aiIndex}°`;
  await sendEmail(html, subject);

  console.log(`\n💾 HTML报告: ${htmlFile}`);
  console.log('✅ 任务完成');
}

main().catch(err => {
  console.error('错误:', err);
  process.exit(1);
});
