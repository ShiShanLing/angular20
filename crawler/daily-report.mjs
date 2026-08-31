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
 *   node crawler/daily-report.mjs --email-only # 跳过分析，用已有结果发邮件+入库
 */

import { readFileSync, writeFileSync, existsSync, statSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';
import nodemailer from 'nodemailer';
import { mergeSectors, marketIndexFromSectors, sentimentLevel, heatSectors, MIN_POSTS_FOR_HEAT } from './sector-utils.mjs';
import { isInAnalysisWindow, getBjToday } from './time-window.mjs';
import { analyzePostSentiment } from './guba-analyze.mjs';
import { aggregateFromKeywordReport, bearFearPct } from './sentiment-calibrate.mjs';
import {
  getMarketFundFlow,
  getIndustryFundFlow,
  getConceptFundFlow,
  getMarketSnapshot,
} from './eastmoney-market.mjs';

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
const emailOnly = args.includes('--email-only');

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
      timeout: 9000000, // 150分钟：3批 × 13分钟 × 最多3次，外加抓取
      cwd: PROJECT_ROOT,
      maxBuffer: 20 * 1024 * 1024,
    });

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n分析完成，耗时 ${elapsed} 秒\n`);
    if (output) console.log(output.slice(-2000));
    return output;
  } catch (err) {
    const partial = err.stdout ? String(err.stdout) : '';
    if (partial) console.log(partial.slice(-3000));
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

/** 话题词 → 分类（用于热门话题饼图） */
const TOPIC_CATEGORY_MAP = {
  '科技': ['科技', 'AI', '人工智能', '芯片', '半导体', '互联网', '机器人', '无人驾驶', '科创板', '低空经济'],
  '金融': ['银行', '证券', '保险', '券商', '非银'],
  '消费': ['白酒', '酿酒', '消费'],
  '医药医疗': ['医药', '医药生物', '医药ETF', '医疗', '医疗器械', '医疗服务', '医疗ETF', '中药', '生物制品', '化学制药'],
  '新能源': ['新能源', '光伏', '锂电', '电力', '煤炭'],
  '军工有色': ['军工', '稀土', '有色', '钢铁'],
  '地产': ['地产', '房地产'],
  '大盘指数': ['上证指数', '大盘', '指数', '创业板', '北证', '沪深300', '中证500'],
  '资金': ['主力', '庄家', '量化', '外资', '北向', '融资', '基金', '散户', '游资', '国家队', '汇金', '证金'],
  '政策宏观': ['降息', '降准', '加息', 'LPR', 'MLF', '逆回购', '国常会', '政治局'],
  '情绪操作': ['加仓', '减仓', '满仓', '空仓', '抄底', '割肉', '恐慌', '贪婪', '观望', '涨停', '跌停', '放量', '缩量'],
};

const TOPIC_PIE_COLORS = [
  '#2563eb', '#16a34a', '#dc2626', '#d97706', '#7c3aed',
  '#0891b2', '#db2777', '#65a30d', '#ea580c', '#4f46e5', '#64748b',
];

/** 将热门话题词按分类汇总 */
function aggregateTopicCategories(hotTopics) {
  const termToCat = new Map();
  for (const [cat, terms] of Object.entries(TOPIC_CATEGORY_MAP)) {
    for (const t of terms) termToCat.set(t.toLowerCase(), cat);
  }

  const counts = {};
  let total = 0;
  for (const item of hotTopics || []) {
    const term = String(item.term || '');
    const count = Number(item.count) || 0;
    if (!count) continue;
    const cat = termToCat.get(term.toLowerCase()) || termToCat.get(term) || '其他';
    counts[cat] = (counts[cat] || 0) + count;
    total += count;
  }

  const slices = Object.entries(counts)
    .map(([name, count]) => ({
      name,
      count,
      pct: total > 0 ? Math.round((count / total) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.count - a.count);

  return { total, slices };
}

/** 生成话题分类饼图 SVG（邮件内嵌） */
function buildTopicPieSvg(slices, size = 200) {
  if (!slices.length) return '';
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 4;
  const sum = slices.reduce((s, x) => s + x.count, 0) || 1;

  let angle = -Math.PI / 2;
  const paths = [];
  
  //
  for (let i = 0; i < slices.length; i++) {
    const slice = slices[i];
    const frac = slice.count / sum;
    const sweep = frac * Math.PI * 2;
    const x1 = cx + r * Math.cos(angle);
    const y1 = cy + r * Math.sin(angle);
    angle += sweep;
    
    const x2 = cx + r * Math.cos(angle);
    const y2 = cy + r * Math.sin(angle);
    const large = sweep > Math.PI ? 1 : 0;
    const color = TOPIC_PIE_COLORS[i % TOPIC_PIE_COLORS.length];

    if (frac >= 0.999) {
      // 整圆
      paths.push(
        `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`
      );
    } else if (frac > 0.001) {
      paths.push(
        `<path d="M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z" fill="${color}"/>`
      );
    }
  }

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="display:block;margin:0 auto;">${paths.join('')}</svg>`;
}


const SENTIMENT_DISPLAY = {
  bullish: { label: '看多', color: '#059669', bg: '#ecfdf5' },
  bearish: { label: '看空', color: '#ea580c', bg: '#fff7ed' },
  fear: { label: '恐慌', color: '#dc2626', bg: '#fef2f2' },
  greed: { label: '贪婪', color: '#ca8a04', bg: '#fefce8' },
  neutral: { label: '中性', color: '#6b7280', bg: '#f9fafb' },
};

function guessPostSentiment(title, content, marketDirection = '未知') {
  const s = analyzePostSentiment({ title, content }, { marketDirection });
  const d = SENTIMENT_DISPLAY[s.label] || SENTIMENT_DISPLAY.neutral;
  return { label: d.label, color: d.color, bg: d.bg };
}

// 根据 barCode + postId 构建股吧帖子链接
function numericIndex(v) {
  if (v == null) return null;
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (typeof v === 'object' && v.index != null) {
    const n = Number(v.index);
    return Number.isFinite(n) ? n : null;
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeSentimentBlock(block) {
  if (!block) return null;
  const marketIndex = numericIndex(block.marketIndex);
  if (marketIndex == null) return null;
  const dist = block.distribution && typeof block.distribution === 'object' ? block.distribution : {};
  const totalPosts = Number(block.totalPosts) || 0;
  return {
    marketIndex,
    level: block.level || null,
    totalPosts,
    distribution: dist,
    bearFearPct: block.bearFearPct ?? bearFearPct(dist, totalPosts),
  };
}

function resolveSentimentBlocks(aiData, kwData) {
  const kwFromFile = kwData
    ? normalizeSentimentBlock({
        marketIndex: kwData.marketIndex?.index ?? kwData.marketIndex,
        level: kwData.marketIndex?.level,
        ...aggregateFromKeywordReport(kwData),
      })
    : null;

  const kw = normalizeSentimentBlock(aiData?.keywordSentiment) || kwFromFile;

  // AI 只采独立字段，禁止回退到顶层/关键词计数
  let ai = null;
  if (aiData?.sentimentSource !== 'keyword') {
    ai = normalizeSentimentBlock(aiData?.aiSentiment) || normalizeSentimentBlock(aiData?.aiRaw);
  }

  return { ai, kw };
}

function renderSentimentPanel(title, icon, s, indexColor, levelEmojiFn) {
  if (!s || s.marketIndex == null) return '';
  const mi = s.marketIndex;
  const level = s.level || sentimentLevel(mi).level;
  const d = s.distribution || {};
  const t = s.totalPosts || 1;
  const bf = s.bearFearPct ?? bearFearPct(d, t);

  return `
<div style="flex:1;min-width:280px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:12px;">
  <div style="font-size:13px;font-weight:600;color:#475569;margin-bottom:10px;">${icon} ${title}</div>
  <div style="display:flex;gap:12px;">
    <div style="flex:0 0 88px;text-align:center;">
      <div style="font-size:36px;font-weight:bold;color:${indexColor(mi)};">${mi}</div>
      <div style="font-size:11px;color:#94a3b8;">/ 100</div>
      <div style="margin-top:4px;font-size:13px;font-weight:600;">${levelEmojiFn(mi)} ${level}</div>
      <div style="margin-top:4px;font-size:11px;color:#64748b;">看空+恐慌 ${bf}%</div>
    </div>
    <div style="flex:1;font-size:12px;line-height:1.9;color:#374151;">
      <div style="display:flex;justify-content:space-between;"><span style="color:#22c55e;">看多</span><span>${d.bullish || 0} (${((d.bullish || 0) / t * 100).toFixed(1)}%)</span></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#eab308;">贪婪</span><span>${d.greed || 0} (${((d.greed || 0) / t * 100).toFixed(1)}%)</span></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#6b7280;">中性</span><span>${d.neutral || 0} (${((d.neutral || 0) / t * 100).toFixed(1)}%)</span></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#ea580c;">看空</span><span>${d.bearish || 0} (${((d.bearish || 0) / t * 100).toFixed(1)}%)</span></div>
      <div style="display:flex;justify-content:space-between;"><span style="color:#ef4444;">恐慌</span><span>${d.fear || 0} (${((d.fear || 0) / t * 100).toFixed(1)}%)</span></div>
      <div style="font-size:10px;color:#94a3b8;margin-top:4px;">${t} 条帖子</div>
    </div>
  </div>
</div>`;
}

function isFreshResultFile(filePath, data, dateStr) {
  if (!existsSync(filePath)) return false;
  if (data?.date === dateStr) return true;
  if (data?.generatedAt) {
    try {
      return getBjToday(new Date(data.generatedAt)) === dateStr;
    } catch {}
  }
  try {
    return getBjToday(statSync(filePath).mtime) === dateStr;
  } catch {
    return false;
  }
}

function buildPostUrl(barCode, postId) {
  if (!barCode || !postId) return '';
  // barCode 形如 "zssh000001"，URL 需要去掉 "zs" 前缀
  const code = barCode.startsWith('zs') ? barCode.substring(2) : barCode;
  return `https://guba.eastmoney.com/news,${code},${postId}.html`;
}

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
          if (isInAnalysisWindow(p.publishTime, { dateStr }) && !seen.has(p.postId)) {
            seen.add(p.postId);
            allPosts.push({ title: p.title, clicks: p.clicks || 0, comments: p.comments || 0, barName: p.barName || bar.barName, barCode: p.barCode || '', postId: p.postId, content: p.content || '', publishTime: p.publishTime });
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
          if (!isInAnalysisWindow(p.publishTime, { dateStr })) continue;
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
      enriched.topicCategories = aggregateTopicCategories(kw.hotTopics || []);
    } catch {}
  }

  // 5. 资金流向（东财估算：大盘 + 行业/概念主力净流入）
  try {
    const market = getMarketFundFlow();
    const industry = getIndustryFundFlow(8);
    const concept = getConceptFundFlow(8);
    enriched.fundFlow = { market, industry, concept };
    writeFileSync(join(DATA_DIR, 'fund_flow.json'), JSON.stringify({
      date: dateStr,
      generatedAt: new Date().toISOString(),
      ...enriched.fundFlow,
    }, null, 2), 'utf-8');
  } catch (err) {
    enriched.fundFlow = { market: { available: false, reason: err.message }, industry: null, concept: null };
  }

  // 6. 行情快照（指数 + 涨跌家数，与 moveReason 同源接口）
  try {
    const snapshot = getMarketSnapshot();
    enriched.marketSnapshot = snapshot;
    writeFileSync(join(DATA_DIR, 'market_snapshot.json'), JSON.stringify({
      date: dateStr,
      generatedAt: new Date().toISOString(),
      ...snapshot,
    }, null, 2), 'utf-8');
  } catch (err) {
    enriched.marketSnapshot = { indices: [], breadth: null, direction: '未知', error: err.message };
  }

  return enriched;
}

function getActionSuggestion(aiIndex) {
  if (aiIndex < 20) return { label: '极度谨慎', color: '#dc2626', emoji: '🚨', desc: '市场极度恐慌，建议观望为主，等待企稳信号。历史极端恐慌常预示阶段底部，但可能仍有惯性下杀。' };
  if (aiIndex < 30) return { label: '谨慎观望', color: '#ea580c', emoji: '⚠️', desc: '恐慌情绪浓厚，建议控制仓位，不盲目抄底。关注政策面和资金面变化。' };
  if (aiIndex < 40) return { label: '轻仓试探', color: '#d97706', emoji: '👀', desc: '情绪偏悲观，可少量布局被错杀的优质标的，但需严格止损。' };
  if (aiIndex < 50) return { label: '偏谨慎', color: '#ca8a04', emoji: '👀', desc: '略偏恐慌，仓位不宜过重，等待更明确方向。' };
  if (aiIndex < 60) return { label: '正常操作', color: '#0891b2', emoji: '✅', desc: '市场情绪中性，按个人策略正常操作，关注板块轮动机会。' };
  if (aiIndex < 70) return { label: '略偏积极', color: '#059669', emoji: '📈', desc: '略偏贪婪，可按计划参与，注意节奏。' };
  if (aiIndex < 80) return { label: '积极乐观', color: '#059669', emoji: '📈', desc: '市场偏贪婪，可适当加仓，但注意追高风险。' };
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
    mainNetYi: enriched.fundFlow?.market?.mainNetYi ?? null,
    topInflow: (enriched.fundFlow?.industry?.inflowTop || []).slice(0, 3).map(b => b.name),
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
    try {
      const parsed = JSON.parse(readFileSync(aiJsonFile, 'utf-8'));
      if (isFreshResultFile(aiJsonFile, parsed, dateStr)) {
        aiData = parsed;
      } else {
        console.warn(`⚠️ 忽略过期 AI 结果: ${aiJsonFile}`);
      }
    } catch {}
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

  const { ai: aiSentiment, kw: kwSentiment } = resolveSentimentBlocks(aiData, kwData);

  // 操作建议（优先关键词指数，更可审计）
  const primaryMi = kwSentiment?.marketIndex ?? aiSentiment?.marketIndex ?? aiData?.marketIndex;
  const suggestion = primaryMi != null ? getActionSuggestion(primaryMi) : null;

  const indexColor = (val) => val < 30 ? '#22c55e' : val < 50 ? '#eab308' : val < 70 ? '#f97316' : '#ef4444';
  const levelEmoji = (val) => val < 30 ? '🟢' : val < 50 ? '🟡' : val < 70 ? '🟠' : '🔴';

  let html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head>
<body style="font-family:-apple-system,'Microsoft YaHei',sans-serif;max-width:700px;margin:0 auto;padding:20px;background:#f5f5f5;">
<div style="background:linear-gradient(135deg,#1e3a5f,#2563eb);color:white;padding:24px;border-radius:12px 12px 0 0;">
  <h1 style="margin:0;font-size:22px;">📊 市场情绪日报</h1>
  <p style="margin:8px 0 0;opacity:0.85;">${dateStr} · ${tradingInfo.reason}</p>
</div>
<div style="background:white;padding:24px;border-radius:0 0 12px 12px;box-shadow:0 2px 8px rgba(0,0,0,0.1);">
`;

  // === 0. 行情概览（实际涨跌，与股吧情绪分开） ===
  const ms = enriched.marketSnapshot || {};
  const msIndices = ms.indices || aiData?.moveReason?.indices || [];
  const msBreadth = ms.breadth || aiData?.moveReason?.breadth || null;
  const marketDir = ms.direction || aiData?.moveReason?.marketDirection || aiData?.moveReason?.direction || '未知';
  if (msIndices.length > 0) {
    const dirColor = marketDir === '涨' ? '#16a34a' : marketDir === '跌' ? '#dc2626' : '#6b7280';
    const fmtPct = (v) => (v == null ? '-' : `${v > 0 ? '+' : ''}${v}%`);
    html += `
<h2 style="color:#1e3a5f;border-bottom:2px solid #e5e7eb;padding-bottom:8px;">📈 今日行情概览</h2>
<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;margin:12px 0;">
  <div style="font-size:14px;margin-bottom:10px;">
    综合方向：<strong style="color:${dirColor};font-size:18px;">${marketDir}</strong>
    ${msBreadth?.upCount != null ? `<span style="color:#64748b;font-size:12px;margin-left:10px;">涨${msBreadth.upCount} / 跌${msBreadth.downCount}${msBreadth.limitUp?.count != null ? ` · 涨停${msBreadth.limitUp.count}` : ''}${msBreadth.limitDown?.count != null ? ` · 跌停${msBreadth.limitDown.count}` : ''}</span>` : ''}
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:8px;font-size:12px;">`;
    for (const idx of msIndices.slice(0, 4)) {
      const c = (idx.pct ?? 0) > 0 ? '#dc2626' : (idx.pct ?? 0) < 0 ? '#16a34a' : '#6b7280';
      html += `<span style="background:white;border:1px solid #e2e8f0;border-radius:6px;padding:6px 10px;"><strong>${idx.name}</strong> ${idx.price ?? '-'} <span style="color:${c};font-weight:600;">${fmtPct(idx.pct)}</span></span>`;
    }
    html += `</div></div>`;
  }

  // === 1. 股吧情绪分析（AI + 关键词并排） ===
  if (aiSentiment || kwSentiment) {
    html += `
<h2 style="color:#1e3a5f;border-bottom:2px solid #e5e7eb;padding-bottom:8px;">📊 股吧情绪分析</h2>
<p style="font-size:12px;color:#64748b;margin:8px 0 12px;">基于股吧帖子多空分布，反映散户情绪，不等于实际涨跌。AI 与关键词两套指数<strong>均保留</strong>，便于对照。</p>
<div style="display:flex;flex-wrap:wrap;gap:12px;margin:12px 0;">`;

    html += renderSentimentPanel('AI 分析', '🤖', aiSentiment, indexColor, levelEmoji);
    html += renderSentimentPanel('关键词分析', '🔤', kwSentiment, indexColor, levelEmoji);

    if (!aiSentiment) {
      html += `</div>
<div style="font-size:12px;color:#92400e;background:#fffbeb;border:1px solid #fcd34d;border-radius:6px;padding:8px 12px;margin-bottom:12px;">
  本次没有独立的 Qoder 情绪计数，因此不展示 AI 面板（不会用关键词结果冒充 AI）。
</div>`;
    } else if (aiSentiment && kwSentiment) {
      const diff = Math.abs((aiSentiment.marketIndex ?? 0) - (kwSentiment.marketIndex ?? 0));
      html += `</div>
<div style="font-size:12px;color:#64748b;background:#f8fafc;border-radius:6px;padding:8px 12px;margin-bottom:12px;">
  两套指数差 <strong>${diff}°</strong> · AI ${aiSentiment.marketIndex}° vs 关键词 ${kwSentiment.marketIndex}°
</div>`;
    } else {
      html += `</div>`;
    }

    // 情绪与行情背离提示（以关键词指数为主）
    const mi = kwSentiment?.marketIndex ?? aiSentiment?.marketIndex;
    const d = kwSentiment?.distribution ?? aiSentiment?.distribution ?? {};
    const t = kwSentiment?.totalPosts ?? aiSentiment?.totalPosts ?? 1;
    if (mi != null) {
      const bearFearPctVal = ((d.bearish || 0) + (d.fear || 0)) / t * 100;
      if (marketDir === '涨' && mi < 35) {
        html += `
<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px;margin:12px 0;font-size:13px;color:#92400e;line-height:1.6;">
  ⚡ <strong>情绪背离</strong>：今日行情<strong>${marketDir}</strong>，但股吧看空+恐慌占比 ${bearFearPctVal.toFixed(1)}%（关键词指数 ${mi}）。常见于「指数涨了、散户仍亏/仍悲观」的结构性行情。
</div>`;
      } else if (marketDir === '跌' && mi > 65) {
        html += `
<div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;padding:12px;margin:12px 0;font-size:13px;color:#92400e;line-height:1.6;">
  ⚡ <strong>情绪背离</strong>：今日行情<strong>${marketDir}</strong>，但股吧情绪偏乐观（关键词指数 ${mi}），注意追高风险。
</div>`;
      }
    }
  }

  if (suggestion) {
    html += `
<div style="background:${suggestion.color}11;border:1px solid ${suggestion.color}44;border-radius:8px;padding:14px;margin:12px 0;">
  <span style="font-size:18px;">${suggestion.emoji}</span>
  <strong style="color:${suggestion.color};font-size:15px;"> ${suggestion.label}</strong>
  <span style="font-size:11px;color:#94a3b8;margin-left:6px;">（基于关键词情绪指数，非行情预测）</span>
  <p style="margin:8px 0 0;font-size:13px;color:#374151;line-height:1.6;">${suggestion.desc}</p>
</div>`;
  }

  if (aiData) {
    const mr = aiData.moveReason || { direction: '未知', reason: '未知', points: [], sources: [] };
    const mrDir = marketDir !== '未知' ? marketDir : (mr.marketDirection || mr.direction || '未知');
    const dirColor = mrDir === '涨' ? '#16a34a' : mrDir === '跌' ? '#dc2626' : '#6b7280';
    const mrIndices = mr.indices || msIndices;
    const indexSummary = mrIndices.length
      ? mrIndices.map(i => `${i.name} ${i.pct != null ? (i.pct > 0 ? '+' : '') + i.pct + '%' : ''}`).join(' · ')
      : '';
    html += `
<h2 style="color:#1e3a5f;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-top:24px;">📌 今天涨跌原因</h2>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin:12px 0;">
  <div style="font-size:13px;margin-bottom:8px;">
    方向：<strong style="color:${dirColor};">${mrDir || '未知'}</strong>
    ${indexSummary ? `<span style="color:#64748b;margin-left:8px;font-size:12px;">${indexSummary}</span>` : ''}
  </div>
  <div style="font-size:14px;color:#1e293b;line-height:1.7;">${mr.reason || '未知'}</div>`;
    if (Array.isArray(mr.points) && mr.points.length > 0 && mr.reason !== '未知') {
      html += `<ul style="margin:10px 0 0;padding-left:18px;font-size:13px;color:#475569;line-height:1.7;">`;
      for (const p of mr.points.slice(0, 5)) {
        html += `<li>${p}</li>`;
      }
      html += `</ul>`;
    }
    if (Array.isArray(mr.sources) && mr.sources.length > 0) {
      html += `<div style="margin-top:10px;font-size:12px;color:#64748b;">参考新闻：`;
      html += mr.sources.map(s => `「${s}」`).join(' ');
      html += `</div>`;
    }
    html += `</div>`;
  }

  // === 1b. 资金流向（收盘口径更准，配合 15:00 定时） ===
  if (enriched.fundFlow) {
    const ff = enriched.fundFlow;
    const m = ff.market || {};
    const mainColor = (m.mainNetYi ?? 0) > 0 ? '#dc2626' : (m.mainNetYi ?? 0) < 0 ? '#16a34a' : '#6b7280';
    const fmtYi = (v) => (v == null ? '未知' : `${v > 0 ? '+' : ''}${v}亿`);
    html += `
<h2 style="color:#1e3a5f;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-top:24px;">💰 今日资金流向</h2>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin:12px 0;">`;
    if (m.available) {
      html += `
  <div style="font-size:14px;margin-bottom:10px;">
    沪深主力净流入：<strong style="color:${mainColor};font-size:18px;">${fmtYi(m.mainNetYi)}</strong>
    <span style="color:#94a3b8;font-size:12px;margin-left:8px;">${m.direction || ''} · ${m.time || ''}</span>
  </div>
  <div style="display:flex;flex-wrap:wrap;gap:10px;font-size:12px;color:#475569;margin-bottom:8px;">
    <span>超大单 ${fmtYi(m.superNetYi)}</span>
    <span>大单 ${fmtYi(m.bigNetYi)}</span>
    <span>中单 ${fmtYi(m.midNetYi)}</span>
    <span>小单 ${fmtYi(m.smallNetYi)}</span>
  </div>`;
    } else {
      html += `<div style="font-size:13px;color:#6b7280;">大盘资金流向：${m.reason || '未知'}</div>`;
    }
    html += `<p style="font-size:11px;color:#94a3b8;margin:0 0 12px;">数据来源：东方财富估算（非交易所官方），主力≈超大单+大单</p>`;

    const renderFlowTable = (title, side, rows) => {
      if (!rows || !rows.length) return '';
      const isIn = side === 'in';
      let block = `<div style="flex:1;min-width:240px;"><div style="font-size:13px;font-weight:600;color:${isIn ? '#dc2626' : '#16a34a'};margin-bottom:6px;">${title}</div>`;
      block += `<table style="width:100%;border-collapse:collapse;font-size:12px;">`;
      block += `<tr style="background:#f1f5f9;"><th style="padding:4px;text-align:left;">板块</th><th>涨跌</th><th>主力净流入</th></tr>`;
      for (const b of rows.slice(0, 8)) {
        const pct = b.pct == null ? '-' : `${b.pct > 0 ? '+' : ''}${b.pct}%`;
        const net = fmtYi(b.mainNetYi);
        const nc = (b.mainNetYi ?? 0) > 0 ? '#dc2626' : '#16a34a';
        block += `<tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:4px;">${(b.name || '').substring(0, 10)}</td><td style="text-align:center;">${pct}</td><td style="text-align:right;font-weight:600;color:${nc};">${net}</td></tr>`;
      }
      block += `</table></div>`;
      return block;
    };

    html += `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:8px;">`;
    html += renderFlowTable('行业流入 Top', 'in', ff.industry?.inflowTop);
    html += renderFlowTable('行业流出 Top', 'out', ff.industry?.outflowTop);
    html += `</div>`;
    html += `<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:12px;">`;
    html += renderFlowTable('概念流入 Top', 'in', ff.concept?.inflowTop);
    html += renderFlowTable('概念流出 Top', 'out', ff.concept?.outflowTop);
    html += `</div></div>`;
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

  // === 5. 板块分化（帖子数 < 5 的板块热度不参与排名） ===
  if (aiData && aiData.sectors && Object.keys(aiData.sectors).length > 0) {
    const ranked = heatSectors(aiData.sectors).sort((a, b) => a[1].temperature - b[1].temperature);
    const skipped = Object.entries(aiData.sectors).filter(([, s]) => (s.posts || 0) < MIN_POSTS_FOR_HEAT);
    const coldest = ranked.slice(0, 3);
    const hottest = ranked.slice(-3).reverse();

    html += `<h2 style="color:#1e3a5f;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-top:24px;">🌡️ 板块分化</h2>`;
    if (ranked.length === 0) {
      html += `<p style="font-size:13px;color:#6b7280;">有效样本板块不足（需至少 ${MIN_POSTS_FOR_HEAT} 条帖子）</p>`;
    } else {
    html += `<div style="display:flex;gap:12px;margin:12px 0;">`;

    // 最乐观
    html += `<div style="flex:1;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px;">`;
    html += `<div style="font-size:13px;font-weight:600;color:#16a34a;margin-bottom:8px;">🟢 最乐观</div>`;
    for (const [name, s] of hottest) {
      html += `<div style="font-size:12px;padding:3px 0;display:flex;justify-content:space-between;"><span>${name.substring(0, 8)}</span><span style="color:#eab308;font-weight:bold;">${s.temperature}°</span></div>`;
    }
    html += `</div>`;

    // 最恐慌
    html += `<div style="flex:1;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:12px;">`;
    html += `<div style="font-size:13px;font-weight:600;color:#dc2626;margin-bottom:8px;">🔴 最恐慌</div>`;
    for (const [name, s] of coldest) {
      html += `<div style="font-size:12px;padding:3px 0;display:flex;justify-content:space-between;"><span>${name.substring(0, 8)}</span><span style="color:#22c55e;font-weight:bold;">${s.temperature}°</span></div>`;
    }
    html += `</div></div>`;

    // 完整板块表（仅 ≥5 帖）
    html += `<table style="width:100%;border-collapse:collapse;font-size:12px;margin-top:8px;">`;
    html += `<tr style="background:#f1f5f9;"><th style="padding:6px;text-align:left;">板块</th><th>温度</th><th>帖子</th><th>看空</th><th>恐慌</th><th>中性</th><th>看多</th></tr>`;
    for (const [name, s] of [...ranked].sort((a, b) => b[1].posts - a[1].posts).slice(0, 10)) {
      const tc = s.temperature < 30 ? '#22c55e' : s.temperature < 50 ? '#eab308' : '#ef4444';
      html += `<tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:5px 6px;">${name}</td><td style="text-align:center;font-weight:bold;color:${tc};">${s.temperature}°</td><td style="text-align:center;">${s.posts}</td><td style="text-align:center;">${s.bearish}</td><td style="text-align:center;">${s.fear}</td><td style="text-align:center;">${s.neutral}</td><td style="text-align:center;">${s.bullish}</td></tr>`;
    }
    html += `</table>`;
    if (skipped.length > 0) {
      html += `<p style="font-size:11px;color:#94a3b8;margin:8px 0 0;">已排除样本不足板块（&lt;${MIN_POSTS_FOR_HEAT}帖）：${skipped.map(([n, s]) => `${n}(${s.posts})`).join('、')}</p>`;
    }
    }
  }

  // === 6. 热门话题词 + 分类占比饼图 ===
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

    const cats = enriched.topicCategories || aggregateTopicCategories(enriched.hotTopics);
    if (cats.slices && cats.slices.length > 0) {
      const topSlices = cats.slices.slice(0, 8);
      html += `<div style="margin:16px 0;padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;">`;
      html += `<div style="font-size:13px;font-weight:600;color:#334155;margin-bottom:10px;">话题分类占比（按提及次数，合计 ${cats.total}）</div>`;
      html += `<div style="display:flex;gap:16px;align-items:center;flex-wrap:wrap;">`;
      html += `<div style="flex:0 0 200px;">${buildTopicPieSvg(topSlices, 180)}</div>`;
      html += `<div style="flex:1;min-width:180px;font-size:12px;line-height:1.9;">`;
      for (let i = 0; i < topSlices.length; i++) {
        const s = topSlices[i];
        const color = TOPIC_PIE_COLORS[i % TOPIC_PIE_COLORS.length];
        html += `<div style="display:flex;align-items:center;gap:8px;">`;
        html += `<span style="display:inline-block;width:10px;height:10px;border-radius:2px;background:${color};"></span>`;
        html += `<span style="flex:1;color:#334155;">${s.name}</span>`;
        html += `<span style="color:#64748b;">${s.count}次</span>`;
        html += `<span style="width:48px;text-align:right;font-weight:600;color:#1e293b;">${s.pct}%</span>`;
        html += `</div>`;
      }
      html += `</div></div></div>`;
    }
  }

  // === 7. 热门帖子 Top 10（带链接+AI情绪标注） ===
  if (enriched.topPosts && enriched.topPosts.length > 0) {
    html += `<h2 style="color:#1e3a5f;border-bottom:2px solid #e5e7eb;padding-bottom:8px;margin-top:24px;">🏆 热门帖子 Top 10</h2>`;
    html += `<table style="width:100%;border-collapse:collapse;font-size:12px;">`;
    html += `<tr style="background:#f1f5f9;"><th style="padding:6px;text-align:left;">帖子</th><th>情绪</th><th>板块</th><th>点击</th><th>评论</th></tr>`;
    for (let i = 0; i < enriched.topPosts.length; i++) {
      const p = enriched.topPosts[i];
      const title = (p.title || '').substring(0, 40) + (p.title?.length > 40 ? '...' : '');
      const sentiment = guessPostSentiment(p.title, p.content, marketDir);
      const url = buildPostUrl(p.barCode, p.postId);
      const titleHtml = url
        ? `<a href="${url}" target="_blank" style="color:#1e40af;text-decoration:none;border-bottom:1px dashed #93c5fd;" title="点击打开原文">${title}</a>`
        : title;
      html += `<tr style="border-bottom:1px solid #f3f4f6;">
        <td style="padding:5px 6px;"><span style="color:#2563eb;font-weight:bold;">${i + 1}.</span> ${titleHtml}</td>
        <td style="text-align:center;"><span style="background:${sentiment.bg};color:${sentiment.color};padding:2px 6px;border-radius:10px;font-size:11px;font-weight:600;">${sentiment.label}</span></td>
        <td style="text-align:center;font-size:11px;color:#6b7280;">${(p.barName || '').substring(0, 4)}</td>
        <td style="text-align:center;font-weight:bold;">${p.clicks}</td>
        <td style="text-align:center;">${p.comments}</td>
      </tr>`;
    }
    html += `</table>`;
    html += `<div style="font-size:11px;color:#9ca3af;margin-top:4px;">💡 点击帖子标题可跳转原文查看详情</div>`;
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
      subject: subject || `📊 市场情绪日报 ${dateStr}`,
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
  console.log('║  📬 市场情绪日报 · 定时任务              ║');
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

  // 运行分析（--email-only 跳过，复用已有 qoder_ai_result.json）
  let output = '';
  if (emailOnly) {
    console.log('⏭  --email-only：跳过抓取/分析，使用已有结果发邮件\n');
  } else {
    output = runAnalysis();
  }

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
  let kwIndex = '?';
  const aiJsonFile = join(DATA_DIR, 'qoder_ai_result.json');
  if (existsSync(aiJsonFile)) {
    try {
      const d = JSON.parse(readFileSync(aiJsonFile, 'utf-8'));
      if (isFreshResultFile(aiJsonFile, d, dateStr)) {
        const { ai, kw } = resolveSentimentBlocks(d, null);
        aiIndex = ai?.marketIndex ?? '?';
        kwIndex = kw?.marketIndex ?? '?';
      }
    } catch {}
  }

  const subject = `📊 市场情绪日报 ${dateStr} · AI${aiIndex}° 关键词${kwIndex}°`;
  await sendEmail(html, subject);

  // 推送到 API 入库
  await pushToApi(dateStr, html);

  console.log(`\n💾 HTML报告: ${htmlFile}`);
  console.log('✅ 任务完成');
}

/**
 * 推送分析结果到 NestJS API
 */
async function pushToApi(dateStr, htmlContent) {
  if (!existsSync(EMAIL_CONFIG_FILE)) return;
  const config = JSON.parse(readFileSync(EMAIL_CONFIG_FILE, 'utf-8'));
  if (!config.api?.baseUrl) return;

  console.log('\n📡 推送数据到 API...');
  try {
    // 1. 登录获取 token
    const loginResp = await fetch(`${config.api.baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: config.api.username, password: config.api.password }),
    });
    if (!loginResp.ok) {
      console.error(`❌ API 登录失败: ${loginResp.status}`);
      return;
    }
    const { access_token } = await loginResp.json();

    // 2. 读取分析数据
    let aiData = {};
    const aiFile = join(DATA_DIR, 'qoder_ai_result.json');
    if (existsSync(aiFile)) {
      try {
        const parsed = JSON.parse(readFileSync(aiFile, 'utf-8'));
        if (isFreshResultFile(aiFile, parsed, dateStr)) {
          aiData = parsed;
        }
      } catch {}
    }

    let kwData = {};
    const kwFile = join(DATA_DIR, 'guba_analysis.json');
    if (existsSync(kwFile)) {
      try { kwData = JSON.parse(readFileSync(kwFile, 'utf-8')); } catch {}
    }

    const dist = aiData.aiSentiment?.distribution || aiData.distribution || {};
    const total = aiData.aiSentiment?.totalPosts || aiData.totalPosts || 0;

    // 3. 构建请求体
    const body = {
      date: dateStr,
      aiIndex: aiData.aiSentiment?.marketIndex ?? (aiData.sentimentSource === 'keyword' ? null : aiData.marketIndex) ?? null,
      kwIndex: aiData.keywordSentiment?.marketIndex ?? kwData.marketIndex?.index ?? null,
      totalPosts: total,
      bullish: dist.bullish || 0,
      bearish: dist.bearish || 0,
      fear: dist.fear || 0,
      greed: dist.greed || 0,
      neutral: dist.neutral || 0,
      bearFearPct: total ? parseFloat(((dist.bearish + dist.fear) / total * 100).toFixed(1)) : 0,
      panicTotal: enriched_panicTotal(),
      sectors: aiData.sectors || null,
      htmlContent,
    };

    // 4. POST 入库
    const resp = await fetch(`${config.api.baseUrl}/market-reports`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`,
      },
      body: JSON.stringify(body),
    });

    if (resp.ok) {
      console.log(`✅ API 入库成功: ${dateStr}`);
    } else {
      console.error(`❌ API 入库失败: ${resp.status} ${await resp.text()}`);
    }
  } catch (err) {
    console.error(`❌ API 推送异常: ${err.message}`);
  }
}

/** 读取恐慌词总数（从已计算的 enriched 数据） */
function enriched_panicTotal() {
  const today = new Date();
  const dateStr = new Date(today.getTime() + 8 * 60 * 60 * 1000).toISOString().substring(0, 10);
  if (!existsSync(POSTS_FILE)) return 0;
  try {
    const data = JSON.parse(readFileSync(POSTS_FILE, 'utf-8'));
    let total = 0;
    for (const bar of data.bars) {
      for (const p of bar.posts) {
        if (!isInAnalysisWindow(p.publishTime, { dateStr })) continue;
        const text = (p.title || '') + (p.content || '');
        for (const word of PANIC_WORDS) {
          if (text.includes(word)) total++;
        }
      }
    }
    return total;
  } catch { return 0; }
}

main().catch(err => {
  console.error('错误:', err);
  process.exit(1);
});
