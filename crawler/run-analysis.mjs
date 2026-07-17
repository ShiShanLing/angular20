#!/usr/bin/env node
/**
 * 市场情绪一键分析脚本
 *
 * 功能: 实时抓取 → 关键词分析 → Qoder AI分析 → 完整报告
 *
 * 用法:
 *   node crawler/run-analysis.mjs                    # 默认全流程（抓取+关键词+AI分析）
 *   node crawler/run-analysis.mjs --no-ai            # 仅关键词分析（跳过AI）
 *   node crawler/run-analysis.mjs --pages=10         # 抓更多页
 *   node crawler/run-analysis.mjs --json             # 输出JSON格式
 *   node crawler/run-analysis.mjs --days=3           # 分析最近N天
 *
 * 前提:
 *   1. 安装 Qoder CLI: curl -fsSL https://qoder.com/install | bash
 *   2. 登录: qodercli login  (或设置 QODER_PERSONAL_ACCESS_TOKEN)
 *   3. PAT 获取: https://qoder.com/account/integrations
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawnSync } from 'child_process';

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

  const skipAi = args.includes('--no-ai');

  const startTime = Date.now();

  console.log('╔══════════════════════════════════════════╗');
  console.log('║  🏦 市场情绪一键分析 v2.0                ║');
  console.log('║  实时抓取 → 关键词分析 → Qoder AI分析    ║');
  console.log('╚══════════════════════════════════════════╝\n');

  // Step 1: 抓取
  crawlData(pages);

  // Step 2: 关键词分析
  const kwResult = runKeywordAnalysis(days);

  // Step 3: 生成Qoder输入
  const allPosts = generateQoderInput(days);

  // 输出关键词报告
  if (outputJson) {
    console.log(JSON.stringify(kwResult, null, 2));
  } else {
    printKeywordReport(kwResult);
  }

  // Step 4: Qoder AI 分析
  if (skipAi) {
    console.log('\n  ⏭ 跳过 AI 分析（--no-ai）');
    console.log(`  💡 帖子清单已保存: ${QODER_INPUT_FILE}`);
  } else {
    const aiResult = runQoderAnalysis();
    if (aiResult) {
      // AI分析结果已经在 qodercli 输出中打印
    } else {
      console.log('\n  ⚠️  AI 分析失败，帖子清单已保存:');
      console.log(`     ${QODER_INPUT_FILE}`);
      console.log('     可以手动发给Qoder分析');
    }
  }

  // 耗时
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`\n⏱ 总耗时: ${elapsed}秒`);
  console.log(`💾 数据存储: ${DATA_DIR}/`);
}

// ============================================================
// Step 4: Qoder AI 分析（通过 qodercli -p 非交互模式）
// ============================================================

const SYSTEM_PROMPT = `你是中国A股市场情绪分析专家。请对提供的股吧帖子数据进行完整的AI情绪分析。

分析要求：
1. 对每条帖子判断情绪类别：看多(bullish)、看空(bearish)、恐慌(fear)、贪婪(greed)、中性(neutral)
2. 注意识别讽刺、反语、混合情绪（如"相信牛市"实为绝望）
3. 高点击帖子权重更高

输出格式：
## Qoder AI 情绪分析报告

### 全局情绪分布
| 情绪 | 数量 | 占比 |
|------|------|------|
| 看多 | X | X% |
...

### 各板块情绪
（列出每个板块的温度0~100和情绪分布）

### 市场情绪指数
给出0~100的综合指数：<30恐慌，30~50偏恐慌，50~70中性，>70贪婪

### 关键发现
列出3~5条最重要的情绪特征和信号

### 对比关键词分析
如果提供了关键词分析结果，对比说明两种方法的差异`;

function runQoderAnalysis() {
  console.log('\n🤖 Step 4/4: Qoder AI 情绪分析...\n');

  // 检查 qodercli 是否可用
  const whichResult = spawnSync('which', ['qodercli'], { encoding: 'utf-8' });
  if (whichResult.status !== 0) {
    // 尝试常见路径
    const commonPaths = [
      join(process.env.HOME || '', '.local', 'bin', 'qodercli'),
      join(process.env.HOME || '', '.qoder', 'bin', 'qodercli', 'qodercli'),
    ];
    let found = '';
    for (const p of commonPaths) {
      if (existsSync(p)) { found = p; break; }
    }
    if (!found) {
      console.error('  ❌ qodercli 未安装');
      console.error('  安装: curl -fsSL https://qoder.com/install | bash');
      console.error('  登录: qodercli login');
      return null;
    }
    process.env.PATH = `${dirname(found)}:${process.env.PATH}`;
  }

  if (!existsSync(QODER_INPUT_FILE)) {
    console.error('  ❌ 帖子清单文件不存在');
    return null;
  }

  const postContent = readFileSync(QODER_INPUT_FILE, 'utf-8');

  // 构造 prompt：让 qodercli 读取附件并分析
  const prompt = `请阅读附件中的股吧帖子数据，对全部帖子进行AI情绪分析。\n\n附件路径: ${QODER_INPUT_FILE}\n\n请按照系统提示的格式输出完整分析报告。`;

  console.log('  📤 发送数据给 Qoder CLI...');
  console.log('  ⏳ 分析中（可能需要1~3分钟）...\n');
  console.log('─'.repeat(55));

  // 调用 qodercli -p（非交互模式，打印结果后退出）
  const result = spawnSync('qodercli', [
    '-p',                              // 非交互模式
    '--permission-mode', 'bypass_permissions',  // 跳过权限确认
    '--system-prompt', SYSTEM_PROMPT,   // 设置系统提示
    '--attachment', QODER_INPUT_FILE,   // 附加帖子文件
    '--max-output-tokens', '8000',      // 限制输出长度
    prompt,                             // 用户提示
  ], {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: 300000,  // 5分钟超时
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.error) {
    if (result.error.code === 'ETIMEDOUT') {
      console.error('\n  ⏰ AI 分析超时（>5分钟）');
    } else {
      console.error(`\n  ❌ qodercli 执行错误: ${result.error.message}`);
    }
    return null;
  }

  // 输出 AI 分析结果
  if (result.stdout) {
    console.log(result.stdout);
    // 保存AI结果
    const aiResultFile = join(DATA_DIR, 'qoder_ai_result.txt');
    writeFileSync(aiResultFile, result.stdout, 'utf-8');
    return result.stdout;
  }

  if (result.stderr) {
    // 可能是认证错误
    if (result.stderr.includes('auth') || result.stderr.includes('login') || result.stderr.includes('token')) {
      console.error('\n  ❌ Qoder CLI 未登录');
      console.error('  请登录: qodercli login');
      console.error('  或设置: export QODER_PERSONAL_ACCESS_TOKEN=<你的PAT>');
      console.error('  PAT 获取: https://qoder.com/account/integrations');
    } else {
      console.error(`  ❌ qodercli 错误: ${result.stderr.substring(0, 500)}`);
    }
    return null;
  }

  return null;
}

main().catch(err => {
  console.error('错误:', err);
  process.exit(1);
});
