#!/usr/bin/env node
/**
 * 拉取项目监控的指数 / 板块 / ETF 当前涨跌，写入文件。
 * 标准输出只打印文件路径。
 *
 *   node crawler/fetch-indices.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { INDEX_SPECS, toSecid, getQuotesBySecids } from './eastmoney-market.mjs';
import { getBjToday } from './time-window.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const TARGETS_FILE = join(__dirname, 'guba_targets.json');
const OUT_DIR = join(__dirname, 'data');
const OUT_FILE = join(OUT_DIR, 'indices_snapshot.html');

const COLOR_UP = '#ff4d4f';
const COLOR_DOWN = '#52c41a';
const COLOR_FLAT = '#8c8c8c';

const PINNED_SECIDS = ['1.000001', '0.399001', '0.399006', '1.000688'];
const PINNED_NAMES = {
  '1.000001': '上证',
  '0.399001': '深证',
  '0.399006': '创业板',
  '1.000688': '科创板',
};

function classifyTarget(code, secid) {
  const c = String(code || '');
  if (/^BK/i.test(c) || String(secid).startsWith('90.')) return 'board';
  if (/^of/i.test(c)) return 'etf';
  return 'index';
}

function loadProjectTargets() {
  const seen = new Set();
  const specs = [];

  for (const spec of INDEX_SPECS) {
    if (seen.has(spec.secid)) continue;
    seen.add(spec.secid);
    specs.push({
      name: spec.name,
      code: spec.secid,
      secid: spec.secid,
      type: 'index',
    });
  }

  if (!existsSync(TARGETS_FILE)) return specs;

  const targets = JSON.parse(readFileSync(TARGETS_FILE, 'utf8'));
  const labels = targets.labels || {};
  for (const code of targets.codes || []) {
    const secid = toSecid(code);
    if (!secid || seen.has(secid)) continue;
    seen.add(secid);
    const rawLabel = String(labels[code] || code);
    const name = rawLabel.replace(/\([^)]*\)\s*$/, '').trim() || rawLabel;
    specs.push({
      name,
      code,
      secid,
      type: classifyTarget(code, secid),
    });
  }

  return specs;
}

function beijingNowIso() {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(new Date());
  const get = (type) => parts.find(p => p.type === type)?.value;
  const ms = String(new Date().getMilliseconds()).padStart(3, '0');
  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}.${ms}+08:00`;
}

function absPct(pct) {
  if (pct == null || !Number.isFinite(pct)) return null;
  return Math.abs(pct).toFixed(2);
}

function moveLabel(pct) {
  const n = absPct(pct);
  if (n == null) return { kind: 'flat', text: '未知' };
  if (pct > 0.05) return { kind: 'up', text: `涨 ${n}%` };
  if (pct < -0.05) return { kind: 'down', text: `跌 ${n}%` };
  return { kind: 'flat', text: `平 ${n}%` };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function quoteRow(item, extraCls = '') {
  const move = moveLabel(item.pct);
  const color = move.kind === 'up' ? COLOR_UP : move.kind === 'down' ? COLOR_DOWN : COLOR_FLAT;
  return {
    cls: extraCls ? `item ${extraCls}` : 'item',
    color,
    html: `${escapeHtml(item.name)}: ${escapeHtml(move.text)}`,
  };
}

function pctValue(item) {
  const n = Number(item?.pct);
  return Number.isFinite(n) ? n : -Infinity;
}

function sortByPct(items) {
  return [...items].sort((a, b) => pctValue(b) - pctValue(a));
}

function splitPinned(quotes) {
  const used = new Set();
  const pinned = [];
  for (const secid of PINNED_SECIDS) {
    const item = quotes.find(q => q.secid === secid);
    if (!item) continue;
    pinned.push({ ...item, name: PINNED_NAMES[secid] || item.name });
    used.add(secid);
  }
  return {
    pinned: sortByPct(pinned),
    rest: sortByPct(quotes.filter(q => !used.has(q.secid))),
  };
}

function formatFetchTime(iso) {
  const m = iso.match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2}:\d{2})/);
  if (!m) return iso;
  return `${m[1]} ${m[2]}`;
}

function buildHtml(quotes) {
  const generatedAt = beijingNowIso().replace(/\.\d+\+08:00$/, '+08:00');
  const fetchTime = formatFetchTime(generatedAt);
  const { pinned, rest } = splitPinned(quotes);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="generated-at" content="${escapeHtml(generatedAt)}">
  <title>指数涨跌 ${escapeHtml(fetchTime)}</title>
  <style>
    body {
      margin: 0;
      padding: 22px 28px 40px;
      font: 14px/1.7 -apple-system, BlinkMacSystemFont, "PingFang SC", "Noto Sans SC", sans-serif;
      background: #111;
      color: #eee;
    }
    h1 { font-size: 16px; font-weight: 650; margin: 0 0 4px; }
    .time { color: #888; font-size: 11px; margin-bottom: 16px; }
    .item { font-size: 14px; font-weight: 700; }
    .item.pin { font-size: 16px; }
    .rest { margin-top: 14px; }
  </style>
</head>
<body>
  <h1>指数涨跌</h1>
  <div class="time">获取时间：${escapeHtml(fetchTime)}</div>
  ${pinned.map(item => {
    const row = quoteRow(item, 'pin');
    return `<div class="${row.cls}" style="color:${row.color}">${row.html}</div>`;
  }).join('\n')}
  <div class="rest">
  ${rest.map(item => {
    const row = quoteRow(item);
    return `<div class="${row.cls}" style="color:${row.color}">${row.html}</div>`;
  }).join('\n')}
  </div>
</body>
</html>
`;
}

function writeSnapshot() {
  const specs = loadProjectTargets();
  const quotes = getQuotesBySecids(specs).map((item, i) => ({
    ...item,
    name: specs[i]?.name || item.name,
  }));

  mkdirSync(OUT_DIR, { recursive: true });
  writeFileSync(OUT_FILE, buildHtml(quotes), 'utf8');
  return OUT_FILE;
}

const outFile = writeSnapshot();
process.stdout.write(`${outFile}\n`);
