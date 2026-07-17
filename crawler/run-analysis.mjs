#!/usr/bin/env node
/**
 * 市场情绪一键分析脚本
 *
 * 功能: 实时抓取 → 关键词分析 → 提取数据给Qoder分析 → 输出完整报告
 *
 * 用法:
 *   node crawler/run-analysis.mjs                    # 默认抓取5页
 *   node crawler/run-analysis.mjs --pages=10         # 抓更多页
 *   node crawler/run-analysis.mjs --json             # 输出JSON格式
 *   node crawler/run-analysis.mjs --days=3           # 分析最近N天
 *
 * 输出:
 *   1. 终端直接显示关键词分析报告
 *   2. 生成 crawler/data/qoder_input.txt（帖子清单，发给Qoder做AI分析）
 *   3. 把 qoder_input.txt 的内容粘贴给Qoder即可获得AI分析结果
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const DATA_FILE = join(DATA_DIR, 'guba_posts.json');
const KW_REPORT_FILE = join(DATA_DIR, 'guba_analysis.json');
const QODER_INPUT_FILE = join(DATA_DIR, 'qoder_input.txt');

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// Step 1: 抓取数据
// ============================================================

function crawlData(pages) {
  console.log('📡 Step 1/3: 抓取最新数据...\n');
  const configPath = join(__dirname, 'guba_targets.json');
  const gubaScript = join(__dirname, 'guba.mjs');
  execSync(`node ${gubaScript} --config ${configPath} --today --pages=${pages}`, { stdio: 'inherit' });
}

// ============================================================
// Step 2: 关键词分析
// ============================================================

function runKeywordAnalysis(days) {
  console.log('\n🔤 Step 2/3: 关键词情绪分析...\n');
  const analyzeScript = join(__dirname, 'guba-analyze.mjs');
  const kwOutput = execSync(`node ${analyzeScript} --json --days=${days}`, { encoding: 'utf-8' });
  return JSON.parse(kwOutput);
}

// ============================================================
// Step 3: 生成Qoder分析输入
// ============================================================

function generateQoderInput(days) {
  console.log('🧠 Step 3/3: 生成Qoder分析数据...\n');

  if (!existsSync(DATA_FILE)) {
    console.error('无数据文件');
    return;
  }

  const data = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().substring(0, 10);

  // 收集所有帖子
  const allPosts = [];
  const seen = new Set();
  for (const bar of data.bars) {
    for (const p of bar.posts) {
      if (p.publishTime && p.publishTime.substring(0, 10) >= cutoffStr && !seen.has(p.postId)) {
        seen.add(p.postId);
        allPosts.push({ ...p, barName: bar.barName, barCode: bar.code });
      }
    }
  }

  // 按点击数排序
  allPosts.sort((a, b) => (b.clicks || 0) - (a.clicks || 0));

  // 生成Qoder输入文件
  const lines = [];
  lines.push(`# 股吧帖子数据 - 请对以下帖子进行AI情绪分析`);
  lines.push(`# 日期: ${cutoffStr} ~ ${new Date().toISOString().substring(0, 10)}`);
  lines.push(`# 总帖子数: ${allPosts.length}`);
  lines.push(`# 要求: 对每条帖子判断情绪(看多/看空/恐慌/贪婪/中性)，给出置信度和得分(-1~+1)`);
  lines.push(`# 注意识别讽刺、反语、混合情绪`);
  lines.push(`# 最终给出: 全局情绪分布比例、各板块情绪对比、市场综合指数`);
  lines.push('');

  // 按板块分组输出
  const byBar = {};
  for (const p of allPosts) {
    if (!byBar[p.barCode]) byBar[p.barCode] = { name: p.barName, posts: [] };
    byBar[p.barCode].posts.push(p);
  }

  for (const [code, bar] of Object.entries(byBar)) {
    lines.push(`## ${bar.name} (${code}) - ${bar.posts.length}条`);
    lines.push('');

    // 输出全部帖子（高点击完整显示，低点击紧凑显示）
    for (let i = 0; i < bar.posts.length; i++) {
      const p = bar.posts[i];
      const text = p.content && p.content !== p.title
        ? `${p.title} | ${p.content.substring(0, 80)}`
        : p.title;
      lines.push(`${i + 1}. [${p.clicks || 0}点击/${p.comments || 0}评] ${text.substring(0, 120)}`);
    }
    lines.push('');
  }

  const content = lines.join('\n');

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(QODER_INPUT_FILE, content, 'utf-8');

  console.log(`  ✓ 已生成 ${allPosts.length} 条帖子清单`);
  console.log(`  ✓ 文件: ${QODER_INPUT_FILE}`);
  console.log(`  ✓ 大小: ${(content.length / 1024).toFixed(1)} KB`);

  return allPosts;
}

// ============================================================
// 打印关键词分析报告
// ============================================================

function printKeywordReport(kwResult) {
  const mi = kwResult.marketIndex;

  console.log('\n' + '='.repeat(55));
  console.log('  📊 关键词分析报告');
  console.log('='.repeat(55));

  console.log(`\n  市场情绪指数: ${mi.index}/100  ${mi.emoji || ''}`);
  console.log(`  等级: ${mi.level}`);
  console.log(`  帖子数: ${mi.totalPosts}  点击: ${mi.totalClicks}`);

  console.log('\n  板块:');
  for (const b of kwResult.bars) {
    if (b.postCount === 0) continue;
    const d = b.distribution;
    console.log(`    ${b.name}: ${b.temperature}° | 多${d.bullish} 贪${d.greed} 中${d.neutral} 空${d.bearish} 恐${d.fear}`);
  }

  // 全局分布
  const dist = { bullish: 0, bearish: 0, fear: 0, greed: 0, neutral: 0 };
  let total = 0;
  for (const b of kwResult.bars) {
    if (!b.distribution) continue;
    for (const [k, v] of Object.entries(b.distribution)) dist[k] += v;
    total += b.postCount;
  }

  console.log('\n  全局分布:');
  console.log(`    看多: ${dist.bullish} (${(dist.bullish / total * 100).toFixed(1)}%)`);
  console.log(`    贪婪: ${dist.greed} (${(dist.greed / total * 100).toFixed(1)}%)`);
  console.log(`    中性: ${dist.neutral} (${(dist.neutral / total * 100).toFixed(1)}%)`);
  console.log(`    看空: ${dist.bearish} (${(dist.bearish / total * 100).toFixed(1)}%)`);
  console.log(`    恐慌: ${dist.fear} (${(dist.fear / total * 100).toFixed(1)}%)`);

  console.log('\n  热门话题:');
  for (let i = 0; i < Math.min(10, kwResult.hotTopics.length); i++) {
    const t = kwResult.hotTopics[i];
    console.log(`    ${i + 1}. ${t.term} (${t.count}次)`);
  }
}

// ============================================================
// 主流程
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const outputJson = args.includes('--json');
  const daysArg = args.find(a => a.startsWith('--days='));
  const days = daysArg ? parseInt(daysArg.split('=')[1]) : 1;
  const pagesArg = args.find(a => a.startsWith('--pages='));
  const pages = pagesArg ? pagesArg.split('=')[1] : '5';

  const startTime = Date.now();

  console.log('╔══════════════════════════════════════════╗');
  console.log('║  🏦 市场情绪一键分析 v1.0                ║');
  console.log('║  实时抓取 → 关键词分析 → Qoder AI分析    ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // Step 1: 抓取
  crawlData(pages);

  // Step 2: 关键词分析
  const kwResult = runKeywordAnalysis(days);

  // Step 3: 生成Qoder输入
  const allPosts = generateQoderInput(days);

  // 输出报告
  if (outputJson) {
    console.log(JSON.stringify(kwResult, null, 2));
  } else {
    printKeywordReport(kwResult);
  }

  // 耗时
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('\n' + '─'.repeat(55));
  console.log('📋 Qoder AI 分析说明:');
  console.log('─'.repeat(55));
  console.log(`  帖子清单已保存到: ${QODER_INPUT_FILE}`);
  console.log(`  共 ${allPosts.length} 条帖子，按点击数排序`);
  console.log('');
  console.log('  获取AI分析结果的方法:');
  console.log('  1. 打开 Qoder 对话');
  console.log(`  2. 把 ${QODER_INPUT_FILE} 的内容发给Qoder`);
  console.log('  3. Qoder会逐条分析情绪并给出完整报告');
  console.log('');
  console.log('  或者直接在Qoder中说:');
  console.log('  "读取 crawler/data/qoder_input.txt 并分析情绪"');
  console.log('─'.repeat(55));

  console.log(`\n⏱ 总耗时: ${elapsed}秒`);
  console.log(`💾 数据存储: ${DATA_DIR}/`);
}

main().catch(err => {
  console.error('错误:', err);
  process.exit(1);
});
