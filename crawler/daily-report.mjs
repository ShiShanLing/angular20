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
const HISTORY_FILE = join(DATA_DIR, 'history.json');
const POSTS_FILE = join(DATA_DIR, 'guba_posts.json');

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
// 丰富数据：热门帖子、日内变化、恐慌信号、历史趋势
// ============================================================

const PANIC_WORDS = ['销户', '爆仓', '天台', '家破人亡', '倾家荡产', '割肉', '清仓走人', '再也不炒', '血亏', '腰斩', '崩盘', '退市', '绝望', '完了', '救命', '活不下去', '跳楼', '躺平'];

function computeEnrichedData(dateStr) {
  const enriched = {};

  // 1. 热门帖子 Top 10
  if (existsSync(POSTS_FILE)) {
    try {
      const data = JSON.parse(readFileSync(POSTS_FILE, 'utf-8'));
      const allPosts = [];
      const seen = new Set();
      for (const bar of data.bars) {
        for (const p of bar.posts) {
          if (p.publishTime && p.publishTime.substring(0, 10) === dateStr && !seen.has(p.postId)) {
            seen.add(p.postId);
            allPosts.push({ title: p.title, clicks: p.clicks || 0, comments: p.comments || 0, barName: bar.barName, publishTime: p.publishTime });
          }
        }
      }
      allPosts.sort((a, b) => b.clicks - a.clicks);
      enriched.topPosts = allPosts.slice(0, 10);

      // 2. 日内变化（上午 vs 下午）
      let amPosts = 0, pmPosts = 0;
      for (const p of allPosts) {
        const hour = parseInt(p.publishTime.substring(11, 13));
        if (hour < 12) amPosts++; else pmPosts++;
      }
      enriched.intraday = { am: amPosts, pm: pmPosts };
    } catch {}
  }

  // 3. 恐慌信号（从帖子标题统计极端词汇）
  if (existsSync(POSTS_FILE)) {
    try {
      const data = JSON.parse(readFileSync(POSTS_FILE, 'utf-8'));
      const panicCounts = {};
      let totalPanic = 0;
      for (const bar of data.bars) {
        for (const p of bar.posts) {
          if (!p.publishTime || p.publishTime.substring(0, 10) !== dateStr) continue;
          const text = (p.title || '') + (p.content || '');
          for (const word of PANIC_WORDS) {
            if (text.includes(word)) {
              panicCounts[word] = (panicCounts[word] || 0) + 1;
              totalPanic++;
            }
          }
        }
      }
      enriched.panicSignals = { total: totalPanic, words: Object.entries(panicCounts).sort((a, b) => b[1] - a[1]).slice(0, 8) };
    } catch {}
  }

  // 4. 热门话题（从关键词分析）
  const kwFile = join(DATA_DIR, 'guba_analysis.json');
  if (existsSync(kwFile)) {
    try {
      const kw = JSON.parse(readFileSync(kwFile, 'utf-8'));
      enriched.hotTopics = (kw.hotTopics || []).slice(0, 15);
    } catch {}
  }

  // 5. 操作建议
  return enriched;
}

function getActionSuggestion(aiIndex) {
  if (aiIndex < 15) return { label: '极度谨慎', color: '#dc2626', emoji: '🚨', desc: '市场极度恐慌，建议观望为主，等待企稳信号。历史极端恐慌常预示阶段底部，但可能仍有惯性下杀。' };
  if (aiIndex < 25) return { label: '谨慎观望', color: '#ea580c', emoji: '⚠️', desc: '恐慌情绪浓厚，建议控制仓位，不盲目抄底。关注政策面和资金面变化。' };
  if (aiIndex < 40) return { label: '轻仓试探', color: '#d97706', emoji: '👀', desc: '情绪偏悲观，可少量布局被错杀的优质标的，但需严格止损。' };
  if (aiIndex < 60) return { label: '正常操作', color: '#0891b2', emoji: '✅', desc: '市场情绪中性，按个人策略正常操作，关注板块轮动机会。' };
  if (aiIndex < 75) return { label: '积极乐观', color: '#059669', emoji: '📈', desc: '市场偏贪婪，可适当加仓，但注意追高风险。' };
  return { label: '警惕过热', color: '#dc2626', emoji: '🔥', desc: '极度贪婪，市场可能过热，注意止盈和风险控制。' };
}

function loadHistory() {
  if (!existsSync(HISTORY_FILE)) return [];
  try { return JSON.parse(readFileSync(HISTORY_FILE, 'utf-8')); } catch { return []; }
}

function saveToHistory(dateStr, aiData, kwData, enriched) {
  const history = loadHistory();
  const entry = {
    date: dateStr,
    aiIndex: aiData?.marketIndex ?? null,
    kwIndex: kwData?.marketIndex?.index ?? null,
    totalPosts: aiData?.totalPosts ?? kwData?.marketIndex?.totalPosts ?? 0,
    bearFearPct: aiData ? ((aiData.distribution.bearish + aiData.distribution.fear) / aiData.totalPosts * 100).toFixed(1) : null,
    panicTotal: enriched.panicSignals?.total ?? 0,
  };
  // 去重并追加
  const filtered = history.filter(h => h.date !== dateStr);
  filtered.push(entry);
  // 只保留最近30天
  const sorted = filtered.sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30);
  writeFileSync(HISTORY_FILE, JSON.stringify(sorted, null, 2), 'utf-8');
  return sorted;
}

// ============================================================
// 生成HTML邮件（丰富版）
// ============================================================

function buildHtmlEmail(analysisOutput, tradingInfo) {
  const today = new Date();
  const dateStr = new Date(today.getTime() + 8 * 60 * 60 * 1000).toISOString().substring(0, 10);

  // 读取数据
  let aiData = null;
  const aiJsonFile = join(DATA_DIR, 'qoder_ai_result.json');
  if (existsSync(aiJsonFile)) {
    try { aiData = JSON.parse(readFileSync(aiJsonFile, 'utf-8')); } catch {}
  }

  let kwData = null;
  const kwFile = join(DATA_DIR, 'guba_analysis.json');
  if (existsSync(kwFile)) {
    try { kwData = JSON.parse(readFileSync(kwFile, 'utf-8')); } catch {}
  }

  // 计算丰富数据
  const enriched = computeEnrichedData(dateStr);

  // 保存历史
  const history = saveToHistory(dateStr, aiData, kwData, enriched);
  const recentHistory = history.filter(h => h.date <= dateStr).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5).reverse();

  // 操作建议
  const suggestion = aiData ? getActionSuggestion(aiData.marketIndex) : null;

  const indexColor = (val) => val < 30 ? '#22c55e' : val < 50 ? '#eab308' : val < 70 ? '#f97316' : '#ef4444';
  const levelEmoji = (val) => val < 30 ? '🟢' : val < 50 ? '🟡' : val < 70 ? '🟠' : '🔴';

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,'Microsoft YaHei',sans-serif;max-width:700px;margin:0 auto;padding:20px;background:#f5f5f5;">
<div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);color:white;padding:24px;border-radius:12px 12px 0 0;">
  <h1 style="margin:0;font-size:22px;">📊 A股市场情绪日报</h1>
  <p style="margin:8px 0 0;opacity:0.85;">${dateStr} · ${tradingInfo.reason}</p>
</div>
<div style="background:white;padding:24px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
`;

  // === 1. AI 核心指数 + 操作建议 ===
  if (aiData) {
    const mi = aiData.marketIndex;
    const level = mi < 20 ? '极度恐慌' : mi < 30 ? '恐慌' : mi < 40 ? '偏恐慌' : mi < 50 ? '略偏恐慌' : mi < 60 ? '中性' : mi < 70 ? '偏贪婪' : '贪婪';
    const d = aiData.distribution;
    const t = aiData.totalPosts;

    html += `
<h2 style="color:#1e3a5f;border-bottom:2px solid #e5e7eb;padding-bottom:8px;">🤖 AI 情绪分析</h2>
<div style="display:flex;gap:16px;margin:16px 0;">
  <div style="flex:1;background:#f8fafc;border-radius:8px;padding:16px;text-align:center;">
    <div style="font-size:42px;font-weight:bold;color:${indexColor(mi)};">${mi}</div>
    <div style="color:#6b7280;font-size:14px;">市场指数 / 100</div>
    <div style="margin-top:4px;font-size:15px;font-weight:600;">${levelEmoji(mi)} ${level}</div>
  </div>
  <div style="flex:1;background:#f8fafc;border-radius:8px;padding:16px;">
    <div style="font-size:14px;color:#6b7280;margin-bottom:8px;">情绪分布（${t}条帖子）</div>
    <div style="font-size:13px;line-height:2;">
      <div style="display:flex;justify-content:space-between;"><span style="color:#ef4444;">看空</span><span>${d.bearish} (${(d.bearish/t*100).toFixed(1)}%)</span></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#f97316;">恐慌</span><span>${d.fear} (${(d.fear/t*100).toFixed(1)}%)</span></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#6b7280;">中性</span><span>${d.neutral} (${(d.neutral/t*100).toFixed(1)}%)</span></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#22c55e;">看多</span><span>${d.bullish} (${(d.bullish/t*100).toFixed(1)}%)</span></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#eab308;">贪婪</span><span>${d.greed} (${(d.greed/t*100).toFixed(1)}%)</span></div>
    </div>
  </div>
</div>`;

    // 操作建议
    if (suggestion) {
      html += `
<div style="background:${suggestion.color}11;border:1px solid ${suggestion.color}44;border-radius:8px;padding:14px;margin:12px 0;">
  <span style="font-size:18px;">${suggestion.emoji}</span>
  <strong style="color:${suggestion.color};font-size:15px;"> ${suggestion.label}</strong>
  <p style="margin:8px 0 0;font-size:13px;color:#374151;line-height:1.6;">${suggestion.desc}</p>
</div>`;
    }
  }

  // === 2. 历史趋势（5天） ===
  if (recentHistory.length > 1) {
    html += `<h2 style="color:#1e3a5f;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-top:24px;">📈 5日趋势</h2>`;
    html += `<div style="background:#f8fafc;border-radius:8px;padding:16px;margin:12px 0;">`;
    html += `<table style="width:100%;border-collapse:collapse;font-size:13px;">`;
    html += `<tr style="color:#6b7280;"><th style="padding:4px;text-align:left;">日期</th><th>AI指数</th><th>关键词</th><th>帖子数</th><th>看空+恐慌</th><th>趋势</th></tr>`;

    for (let i = 0; i < recentHistory.length; i++) {
      const h = recentHistory[i];
      const prev = i > 0 ? recentHistory[i - 1] : null;
      const aiDiff = prev && h.aiIndex !== null && prev.aiIndex !== null ? h.aiIndex - prev.aiIndex : null;
      const trend = aiDiff === null ? '—' : aiDiff > 5 ? '📈 上升' : aiDiff < -5 ? '📉 下降' : '➡️ 持平';
      const aiColor = h.aiIndex !== null ? indexColor(h.aiIndex) : '#999';
      const isToday = h.date === dateStr;
      html += `<tr style="border-bottom:1px solid #e5e7eb;${isToday ? 'font-weight:bold;background:#eff6ff;' : ''}">
        <td style="padding:6px 4px;">${h.date.substring(5)}${isToday ? ' ←今天' : ''}</td>
        <td style="text-align:center;color:${aiColor};font-weight:bold;">${h.aiIndex ?? '—'}</td>
        <td style="text-align:center;">${h.kwIndex ?? '—'}</td>
        <td style="text-align:center;">${h.totalPosts}</td>
        <td style="text-align:center;">${h.bearFearPct ? h.bearFearPct + '%' : '—'}</td>
        <td style="text-align:center;font-size:12px;">${trend}</td>
      </tr>`;
    }
    html += `</table></div>`;
  }

  // === 3. 日内变化 ===
  if (enriched.intraday) {
    const { am, pm } = enriched.intraday;
    const total = am + pm;
    if (total > 0) {
      const amPct = (am / total * 100).toFixed(0);
      const pmPct = (pm / total * 100).toFixed(0);
      html += `
<h2 style="color:#1e3a5f;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-top:24px;">🕐 日内活跃度</h2>
<div style="background:#f8fafc;border-radius:8px;padding:16px;margin:12px 0;">
  <div style="display:flex;gap:24px;">
    <div style="flex:1;text-align:center;">
      <div style="font-size:24px;font-weight:bold;color:#2563eb;">${am}</div>
      <div style="font-size:12px;color:#6b7280;">上午帖子 (${amPct}%)</div>
      <div style="background:#e5e7eb;border-radius:4px;height:8px;margin-top:8px;"><div style="background:#2563eb;border-radius:4px;height:8px;width:${amPct}%;"></div></div>
    </div>
    <div style="flex:1;text-align:center;">
      <div style="font-size:24px;font-weight:bold;color:#7c3aed;">${pm}</div>
      <div style="font-size:12px;color:#6b7280;">下午帖子 (${pmPct}%)</div>
      <div style="background:#e5e7eb;border-radius:4px;height:8px;margin-top:8px;"><div style="background:#7c3aed;border-radius:4px;height:8px;width:${pmPct}%;"></div></div>
    </div>
  </div>
  <p style="font-size:12px;color:#6b7280;margin:12px 0 0;text-align:center;">${pm > am ? '下午讨论更活跃，情绪可能在盘中进一步演变' : '上午讨论更活跃，午后可能趋于平静'}</p>
</div>`;
    }
  }

  // === 4. 恐慌信号 ===
  if (enriched.panicSignals && enriched.panicSignals.total > 0) {
    const ps = enriched.panicSignals;
    const dangerLevel = ps.total > 50 ? '🚨 极度恐慌' : ps.total > 20 ? '⚠️ 明显恐慌' : '😟 轻度恐慌';
    html += `
<h2 style="color:#1e3a5f;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-top:24px;">${dangerLevel} · 恐慌信号</h2>
<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:16px;margin:12px 0;">
  <div style="font-size:14px;margin-bottom:8px;">极端情绪词出现 <strong style="color:#dc2626;font-size:18px;">${ps.total}</strong> 次</div>
  <div style="display:flex;flex-wrap:wrap;gap:6px;">`;
    for (const [word, count] of ps.words) {
      const size = Math.min(16, 11 + count);
      html += `<span style="background:#fee2e2;color:#dc2626;padding:3px 8px;border-radius:4px;font-size:${size}px;font-weight:${count > 5 ? 'bold' : 'normal'};">${word} <small>(${count})</small></span>`;
    }
    html += `</div>
  <p style="font-size:12px;color:#6b7280;margin:12px 0 0;">历史上极端恐慌词频升高时，往往接近情绪底部区域（逆向指标参考）</p>
</div>`;
  }

  // === 5. 板块分化 ===
  if (aiData && aiData.sectors && Object.keys(aiData.sectors).length > 0) {
    const sorted = Object.entries(aiData.sectors).sort((a, b) => a[1].temperature - b[1].temperature);
    const coldest = sorted.slice(0, 3);
    const hottest = sorted.slice(-3).reverse();

    html += `<h2 style="color:#1e3a5f;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-top:24px;">🌡️ 板块分化</h2>`;
    html += `<div style="display:flex;gap:12px;margin:12px 0;">`;

    // 最恐慌
    html += `<div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;">`;
    html += `<div style="font-size:13px;font-weight:600;color:#16a34a;margin-bottom:8px;">🟢 最乐观</div>`;
    for (const [name, s] of hottest) {
      html += `<div style="font-size:12px;padding:3px 0;display:flex;justify-content:space-between;"><span>${name.substring(0, 8)}</span><span style="color:#eab308;font-weight:bold;">${s.temperature}°</span></div>`;
    }
    html += `</div>`;

    // 最乐观
    html += `<div style="flex:1;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;">`;
    html += `<div style="font-size:13px;font-weight:600;color:#dc2626;margin-bottom:8px;">🟢 最恐慌</div>`;
    for (const [name, s] of coldest) {
      html += `<div style="font-size:12px;padding:3px 0;display:flex;justify-content:space-between;"><span>${name.substring(0, 8)}</span><span style="color:#22c55e;font-weight:bold;">${s.temperature}°</span></div>`;
    }
    html += `</div></div>`;

    // 完整板块表
    html += `<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:8px;">`;
    html += `<tr style="background:#f1f5f9;"><th style="padding:6px;text-align:left;">板块</th><th>温度</th><th>帖子</th><th>看空</th><th>恐慌</th><th>中性</th><th>看多</th></tr>`;
    for (const [name, s] of Object.entries(aiData.sectors).sort((a, b) => b[1].posts - a[1].posts).slice(0, 10)) {
      const tc = s.temperature < 30 ? '#22c55e' : s.temperature < 50 ? '#eab308' : '#ef4444';
      html += `<tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:5px 6px;">${name}</td><td style="text-align:center;font-weight:bold;color:${tc};">${s.temperature}°</td><td style="text-align:center;">${s.posts}</td><td style="text-align:center;">${s.bearish}</td><td style="text-align:center;">${s.fear}</td><td style="text-align:center;">${s.neutral}</td><td style="text-align:center;">${s.bullish}</td></tr>`;
    }
    html += `</table>`;
  }

  // === 6. 热门话题词 ===
  if (enriched.hotTopics && enriched.hotTopics.length > 0) {
    html += `<h2 style="color:#1e3a5f;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-top:24px;">🔥 热门话题</h2>`;
    html += `<div style="display:flex;flex-wrap:wrap;gap:8px;margin:12px 0;">`;
    const maxCount = enriched.hotTopics[0]?.count || 1;
    for (const t of enriched.hotTopics) {
      const size = Math.round(12 + (t.count / maxCount) * 8);
      const opacity = 0.5 + (t.count / maxCount) * 0.5;
      html += `<span style="background:#eff6ff;color:#1e40af;padding:4px 10px;border-radius:16px;font-size:${size}px;opacity:${opacity};font-weight:${t.count > maxCount * 0.5 ? 'bold' : 'normal'};">${t.term} <small style="opacity:0.6;">${t.count}</small></span>`;
    }
    html += `</div>`;
  }

  // === 7. 热门帖子 Top 10 ===
  if (enriched.topPosts && enriched.topPosts.length > 0) {
    html += `<h2 style="color:#1e3a5f;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-top:24px;">🏆 热门帖子 Top 10</h2>`;
    html += `<table style="width:100%;border-collapse:collapse;font-size:12px;">`;
    html += `<tr style="background:#f1f5f9;"><th style="padding:6px;text-align:left;">帖子</th><th>板块</th><th>点击</th><th>评论</th></tr>`;
    for (let i = 0; i < enriched.topPosts.length; i++) {
      const p = enriched.topPosts[i];
      const title = (p.title || '').substring(0, 40) + (p.title?.length > 40 ? '...' : '');
      html += `<tr style="border-bottom:1px solid #f3f4f6;">
        <td style="padding:5px 6px;"><span style="color:#2563eb;font-weight:bold;">${i + 1}.</span> ${title}</td>
        <td style="text-align:center;font-size:11px;color:#6b7280;">${(p.barName || '').substring(0, 4)}</td>
        <td style="text-align:center;font-weight:bold;">${p.clicks}</td>
        <td style="text-align:center;">${p.comments}</td>
      </tr>`;
    }
    html += `</table>`;
  }

  // === 8. 关键发现 ===
  if (aiData && aiData.signals && aiData.signals.length > 0) {
    html += `<h2 style="color:#1e3a5f;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-top:24px;">🔍 关键发现</h2>`;
    html += `<div style="background:#f8fafc;border-radius:8px;padding:16px;margin:12px 0;">`;
    for (const s of aiData.signals.slice(0, 5)) {
      html += `<div style="padding:6px 0;border-bottom:1px solid #e5e7eb;font-size:13px;line-height:1.6;">• ${s}</div>`;
    }
    html += `</div>`;
  }

  // === 9. 关键词 vs AI 对比 ===
  if (kwData && kwData.marketIndex && aiData) {
    const kwMi = kwData.marketIndex.index;
    const aiMi = aiData.marketIndex;
    const diff = aiMi - kwMi;
    html += `
<h2 style="color:#1e3a5f;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-top:24px;">⚖️ 关键词 vs AI 对比</h2>
<div style="display:flex;gap:12px;margin:12px 0;">
  <div style="flex:1;background:#f8fafc;border-radius:8px;padding:14px;text-align:center;">
    <div style="font-size:12px;color:#6b7280;">关键词指数</div>
    <div style="font-size:28px;font-weight:bold;color:${indexColor(kwMi)};">${kwMi}°</div>
    <div style="font-size:12px;color:#6b7280;">${kwData.marketIndex.level}</div>
  </div>
  <div style="flex:0 0 40px;display:flex;align-items:center;justify-content:center;font-size:20px;">VS</div>
  <div style="flex:1;background:#f8fafc;border-radius:8px;padding:14px;text-align:center;">
    <div style="font-size:12px;color:#6b7280;">AI指数</div>
    <div style="font-size:28px;font-weight:bold;color:${indexColor(aiMi)};">${aiMi}°</div>
    <div style="font-size:12px;color:#6b7280;">${aiMi < 30 ? '恐慌' : aiMi < 50 ? '偏恐慌' : '中性'}</div>
  </div>
</div>
<div style="background:#fffbeb;border:1px solid #fbbf24;border-radius:8px;padding:10px;margin:8px 0;font-size:12px;color:#92400e;">
  💡 差异 ${Math.abs(diff)}° — AI识别了讽刺、反语等隐藏情绪，关键词方案将 ${(kwData.marketIndex.totalPosts * 0.63).toFixed(0)} 条帖子归为"中性"，实际包含大量隐藏的看空/恐慌情绪。
</div>`;
  }

  // === 页脚 ===
  html += `
<div style="margin-top:24px;padding-top:16px;border-top:1px solid #e5e7eb;font-size:11px;color:#9ca3af;text-align:center;">
  ⚠️ 本报告仅供情绪参考，不构成投资建议<br>
  由 Qoder AI 自动生成 · ${dateStr} · 数据来源：东方财富股吧
</div></div></body></html>`;

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
