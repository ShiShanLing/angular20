#!/usr/bin/env node
/**
 * 导出当日股吧帖子 + 关键词情绪标注，便于人工核对 AI 汇总是否偏差
 *
 * 用法:
 *   node crawler/export-posts-review.mjs
 *   node crawler/export-posts-review.mjs --date=2026-08-17
 *
 * 输出:
 *   crawler/data/posts_review.html   可筛选浏览
 *   crawler/data/posts_review.csv    Excel 打开
 *   crawler/data/posts_review.json   结构化明细
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { analyzePostSentiment } from './guba-analyze.mjs';
import { getMarketSnapshot } from './eastmoney-market.mjs';
import { isInAnalysisWindow, getBjToday, analysisWindowLabel } from './time-window.mjs';
import { canonicalSectorFromBar } from './sector-utils.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const POSTS_FILE = join(DATA_DIR, 'guba_posts.json');
const AI_FILE = join(DATA_DIR, 'qoder_ai_result.json');

const args = process.argv.slice(2);
const dateArg = args.find(a => a.startsWith('--date='));
const dateStr = dateArg ? dateArg.split('=')[1] : getBjToday();

const LABEL_ZH = {
  bullish: '看多',
  bearish: '看空',
  fear: '恐慌',
  greed: '贪婪',
  neutral: '中性',
};

const LABEL_COLOR = {
  bullish: '#16a34a',
  bearish: '#ea580c',
  fear: '#dc2626',
  greed: '#ca8a04',
  neutral: '#6b7280',
};

function buildPostUrl(barCode, postId) {
  if (!barCode || !postId) return '';
  const code = barCode.startsWith('zs') ? barCode.substring(2) : barCode;
  return `https://guba.eastmoney.com/news,${code},${postId}.html`;
}

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeCsv(s) {
  const v = String(s || '').replace(/"/g, '""');
  return `"${v}"`;
}

function loadPosts() {
  if (!existsSync(POSTS_FILE)) {
    console.error(`❌ 找不到 ${POSTS_FILE}`);
    process.exit(1);
  }
  const data = JSON.parse(readFileSync(POSTS_FILE, 'utf-8'));
  const rows = [];
  const seen = new Set();
  for (const bar of data.bars || []) {
    const sector = canonicalSectorFromBar(bar) || bar.barName || '';
    for (const p of bar.posts || []) {
      if (!isInAnalysisWindow(p.publishTime, { dateStr })) continue;
      if (seen.has(p.postId)) continue;
      seen.add(p.postId);
      rows.push({
        postId: p.postId,
        title: p.title || '',
        content: p.content || '',
        barName: p.barName || bar.barName || '',
        barCode: p.barCode || bar.barCode || '',
        sector,
        publishTime: p.publishTime || '',
        clicks: p.clicks || 0,
        comments: p.comments || 0,
      });
    }
  }
  return rows;
}

function summarize(rows) {
  const dist = { bullish: 0, bearish: 0, fear: 0, greed: 0, neutral: 0 };
  for (const r of rows) dist[r.keywordLabel] = (dist[r.keywordLabel] || 0) + 1;

  const bySector = {};
  for (const r of rows) {
    const s = r.sector || r.barName || '未知';
    if (!bySector[s]) bySector[s] = { total: 0, bullish: 0, bearish: 0, fear: 0, greed: 0, neutral: 0 };
    bySector[s].total++;
    bySector[s][r.keywordLabel]++;
  }

  return { dist, bySector };
}

function buildHtml(meta, rows, summary, aiData) {
  const t = rows.length || 1;
  const d = summary.dist;
  const aiDist = aiData?.distribution || null;
  const aiIndex = aiData?.marketIndex ?? null;

  let aiCompare = '';
  if (aiDist) {
    aiCompare = `
<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;margin:16px 0;font-size:13px;line-height:1.7;">
  <strong>AI 汇总（Qoder 批次统计，无逐条标签）</strong>：指数 ${aiIndex ?? '-'} / 100<br>
  看多 ${aiDist.bullish} · 看空 ${aiDist.bearish} · 恐慌 ${aiDist.fear} · 贪婪 ${aiDist.greed} · 中性 ${aiDist.neutral}<br>
  看空+恐慌 ${((aiDist.bearish + aiDist.fear) / (aiData.totalPosts || 1) * 100).toFixed(1)}%
</div>`;
  }

  const rowsHtml = rows.map((r, i) => {
    const color = LABEL_COLOR[r.keywordLabel] || '#6b7280';
    const words = [
      ...(r.matchedWords.bullish || []),
      ...(r.matchedWords.bearish || []),
      ...(r.matchedWords.fear || []),
      ...(r.matchedWords.greed || []),
      ...(r.matchedWords.complaint || []),
    ].slice(0, 8).join('、') || '-';
    const preview = escapeHtml((r.title + (r.content && r.content !== r.title ? ' | ' + r.content : '')).substring(0, 160));
    return `<tr class="row" data-label="${r.keywordLabel}" data-sector="${escapeHtml(r.sector)}">
  <td>${i + 1}</td>
  <td><span style="color:${color};font-weight:600;">${LABEL_ZH[r.keywordLabel]}</span></td>
  <td>${escapeHtml(r.sector)}</td>
  <td style="text-align:right;">${r.clicks}</td>
  <td style="text-align:right;">${r.comments}</td>
  <td style="white-space:nowrap;font-size:12px;color:#64748b;">${escapeHtml(r.publishTime?.substring(11, 16) || '')}</td>
  <td style="font-size:12px;color:#64748b;">${escapeHtml(words)}</td>
  <td><a href="${escapeHtml(r.url)}" target="_blank" rel="noopener">${preview}</a></td>
</tr>`;
  }).join('\n');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>股吧帖子复核 ${dateStr}</title>
<style>
body{font-family:-apple-system,'Microsoft YaHei',sans-serif;max-width:1200px;margin:0 auto;padding:20px;background:#f8fafc;color:#1e293b;}
h1{font-size:20px;margin:0 0 8px;}
.meta{color:#64748b;font-size:13px;margin-bottom:12px;}
.toolbar{display:flex;flex-wrap:wrap;gap:8px;margin:12px 0 16px;}
.toolbar button,.toolbar select{padding:6px 10px;border:1px solid #cbd5e1;border-radius:6px;background:white;cursor:pointer;font-size:13px;}
table{width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);}
th,td{padding:8px 10px;border-bottom:1px solid #f1f5f9;text-align:left;vertical-align:top;}
th{background:#f1f5f9;font-size:12px;color:#475569;position:sticky;top:0;}
tr:hover td{background:#fafafa;}
.stats{display:flex;flex-wrap:wrap;gap:10px;margin:12px 0;}
.stat{background:white;border:1px solid #e2e8f0;border-radius:8px;padding:10px 14px;font-size:13px;}
</style></head><body>
<h1>📋 股吧帖子复核 · ${dateStr}</h1>
<div class="meta">时间窗 ${analysisWindowLabel({ dateStr })} · 共 ${rows.length} 条 · 按关键词规则逐条标注（AI 只做批次汇总，此处供人工核对）</div>
<div class="stats">
  <div class="stat">关键词：看多 ${d.bullish} (${(d.bullish/t*100).toFixed(1)}%)</div>
  <div class="stat">看空 ${d.bearish} (${(d.bearish/t*100).toFixed(1)}%)</div>
  <div class="stat">恐慌 ${d.fear} (${(d.fear/t*100).toFixed(1)}%)</div>
  <div class="stat">贪婪 ${d.greed} (${(d.greed/t*100).toFixed(1)}%)</div>
  <div class="stat">中性 ${d.neutral} (${(d.neutral/t*100).toFixed(1)}%)</div>
  <div class="stat">看空+恐慌 ${((d.bearish+d.fear)/t*100).toFixed(1)}%</div>
</div>
${aiCompare}
<div class="toolbar">
  <label>情绪 <select id="filterLabel"><option value="">全部</option>
    <option value="bullish">看多</option><option value="bearish">看空</option><option value="fear">恐慌</option>
    <option value="greed">贪婪</option><option value="neutral">中性</option></select></label>
  <label>板块 <select id="filterSector"><option value="">全部</option>${[...new Set(rows.map(r => r.sector))].sort().map(s => `<option value="${escapeHtml(s)}">${escapeHtml(s)}</option>`).join('')}</select></label>
  <button type="button" id="sortClicks">按点击量排序</button>
  <button type="button" id="sortTime">按时间排序</button>
</div>
<table id="postsTable"><thead><tr>
  <th>#</th><th>关键词情绪</th><th>板块</th><th>点击</th><th>评论</th><th>时间</th><th>命中词</th><th>标题 / 摘要</th>
</tr></thead><tbody>${rowsHtml}</tbody></table>
<script>
const table=document.getElementById('postsTable').querySelector('tbody');
const allRows=[...table.querySelectorAll('tr')];
function applyFilter(){
  const label=document.getElementById('filterLabel').value;
  const sector=document.getElementById('filterSector').value;
  allRows.forEach(r=>{
    const ok=(!label||r.dataset.label===label)&&(!sector||r.dataset.sector===sector);
    r.style.display=ok?'':'none';
  });
}
document.getElementById('filterLabel').onchange=applyFilter;
document.getElementById('filterSector').onchange=applyFilter;
document.getElementById('sortClicks').onclick=()=>{
  allRows.sort((a,b)=>Number(b.children[3].textContent)-Number(a.children[3].textContent));
  allRows.forEach(r=>table.appendChild(r));
};
document.getElementById('sortTime').onclick=()=>{
  allRows.sort((a,b)=>a.children[5].textContent.localeCompare(b.children[5].textContent));
  allRows.forEach(r=>table.appendChild(r));
};
</script>
</body></html>`;
}

function main() {
  let marketDirection = '未知';
  try { marketDirection = getMarketSnapshot().direction || '未知'; } catch { /* ignore */ }

  const rawPosts = loadPosts();
  rawPosts.sort((a, b) => b.clicks - a.clicks);

  const rows = rawPosts.map(p => {
    const s = analyzePostSentiment(p, { marketDirection });
    return {
      ...p,
      url: buildPostUrl(p.barCode, p.postId),
      keywordLabel: s.label,
      keywordScore: s.score,
      weightedScore: s.weightedScore,
      matchedWords: {
        bullish: s.bullishWords,
        bearish: s.bearishWords,
        fear: s.fearWords,
        greed: s.greedWords,
        complaint: s.complaintWords || [],
      },
    };
  });

  const summary = summarize(rows);
  let aiData = null;
  if (existsSync(AI_FILE)) {
    try { aiData = JSON.parse(readFileSync(AI_FILE, 'utf-8')); } catch { /* ignore */ }
  }

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  const htmlPath = join(DATA_DIR, 'posts_review.html');
  const csvPath = join(DATA_DIR, 'posts_review.csv');
  const jsonPath = join(DATA_DIR, 'posts_review.json');

  writeFileSync(htmlPath, buildHtml({ dateStr }, rows, summary, aiData), 'utf-8');

  const csvHeader = ['postId', 'keywordLabel', 'sector', 'barName', 'clicks', 'comments', 'publishTime', 'matchedWords', 'title', 'content', 'url'];
  const csvLines = [csvHeader.join(',')];
  for (const r of rows) {
    const words = [
      ...(r.matchedWords.bullish || []),
      ...(r.matchedWords.bearish || []),
      ...(r.matchedWords.fear || []),
      ...(r.matchedWords.greed || []),
    ].join('|');
    csvLines.push([
      r.postId, LABEL_ZH[r.keywordLabel], r.sector, r.barName,
      r.clicks, r.comments, r.publishTime, words,
      escapeCsv(r.title), escapeCsv(r.content), escapeCsv(r.url),
    ].join(','));
  }
  writeFileSync(csvPath, '\ufeff' + csvLines.join('\n'), 'utf-8');

  writeFileSync(jsonPath, JSON.stringify({
    date: dateStr,
    window: analysisWindowLabel({ dateStr }),
    marketDirection,
    generatedAt: new Date().toISOString(),
    totalPosts: rows.length,
    keywordDistribution: summary.dist,
    keywordBearFearPct: Math.round((summary.dist.bearish + summary.dist.fear) / (rows.length || 1) * 1000) / 10,
    aiSummary: aiData ? {
      marketIndex: aiData.marketIndex,
      totalPosts: aiData.totalPosts,
      distribution: aiData.distribution,
    } : null,
    bySector: summary.bySector,
    posts: rows.map(r => ({
      postId: r.postId,
      keywordLabel: r.keywordLabel,
      keywordScore: r.keywordScore,
      sector: r.sector,
      barName: r.barName,
      clicks: r.clicks,
      comments: r.comments,
      publishTime: r.publishTime,
      matchedWords: r.matchedWords,
      title: r.title,
      content: r.content?.substring(0, 300),
      url: r.url,
    })),
  }, null, 2), 'utf-8');

  const d = summary.dist;
  const t = rows.length || 1;
  console.log(`\n📋 帖子复核导出 · ${dateStr}`);
  console.log(`   行情语境: ${marketDirection}`);
  console.log(`   共 ${rows.length} 条（${analysisWindowLabel({ dateStr })}）`);
  console.log(`   关键词：看多 ${d.bullish} 看空 ${d.bearish} 恐慌 ${d.fear} 贪婪 ${d.greed} 中性 ${d.neutral}`);
  console.log(`   关键词看空+恐慌：${((d.bearish + d.fear) / t * 100).toFixed(1)}%`);
  if (aiData?.distribution) {
    const ad = aiData.distribution;
    const at = aiData.totalPosts || 1;
    console.log(`   AI汇总：指数 ${aiData.marketIndex} | 看空+恐慌 ${((ad.bearish + ad.fear) / at * 100).toFixed(1)}%`);
  }
  console.log(`\n💾 ${htmlPath}`);
  console.log(`💾 ${csvPath}`);
  console.log(`💾 ${jsonPath}\n`);
}

main();
