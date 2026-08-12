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
 *   node crawler/run-analysis.mjs --days=3           # 最近N天，每天仅 09:00–15:00
 *
 * 默认时间窗: 东八区当天 09:00–15:00（对齐 15:00 日报）
 *
 * 前提:
 *   1. 安装 Qoder CLI: curl -fsSL https://qoder.com/install | bash
 *   2. 登录: qodercli login  (或设置 QODER_PERSONAL_ACCESS_TOKEN)
 *   3. PAT 获取: https://qoder.com/account/integrations
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync, spawnSync } from 'child_process';
import { mergeSectors, marketIndexFromSectors, sentimentLevel } from './sector-utils.mjs';
import { isInAnalysisWindow, analysisWindowLabel } from './time-window.mjs';
import { httpGetText, getTodayNews } from './eastmoney-market.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const DATA_FILE = join(DATA_DIR, 'guba_posts.json');
const KW_REPORT_FILE = join(DATA_DIR, 'guba_analysis.json');
const QODER_INPUT_FILE = join(DATA_DIR, 'qoder_input.txt');
const AI_BATCH_SIZE = 500;  // 每批AI分析帖子数（减小避免超时）
const AI_BATCH_TIMEOUT = 480000;  // 每批超时8分钟
const AI_BATCH_DELAY = 15000;  // 批次间延迟15秒（防限流）
const AI_MAX_RETRIES = 2;  // 每批最多重试次数
const MAX_POST_TEXT_LEN = 180;  // 帖子文本最大长度（提高以保留反讽/语境）

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
  const windowLabel = analysisWindowLabel({ days });

  // 收集所有帖子（当天/最近N天，仅 09:00–15:00）
  const allPosts = [];
  const seen = new Set();
  for (const bar of data.bars) {
    for (const p of bar.posts) {
      if (isInAnalysisWindow(p.publishTime, { days }) && !seen.has(p.postId)) {
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
  lines.push(`# 时间窗: ${windowLabel}`);
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

  console.log(`  ✓ 全量清单: ${allPosts.length} 条 (${(content.length / 1024).toFixed(1)} KB)`);
  console.log(`  ✓ AI将分批分析（每批${AI_BATCH_SIZE}条）`);

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
    const aiResult = runBatchedAIAnalysis(days);
    if (!aiResult) {
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
// Step 4: Qoder AI 分批分析 + 汇总
// ============================================================

const BATCH_SYSTEM_PROMPT = '你是中国A股市场情绪分析专家。对提供的帖子进行分析。\n\n' +
  '规则：\n' +
  '1. 判断每条帖子情绪: bullish(看多)/bearish(看空)/fear(恐慌)/greed(贪婪)/neutral(中性)\n' +
  '2. 识别讽刺反语（如"相信牛市即便倾家荡产"=恐慌，"老乡别走"=讽刺看空）\n' +
  '3. 高点击帖子对情绪判断权重更高，但仍须如实计入 distribution 计数\n' +
  '4. 板块名必须严格使用以下固定名称，禁止自创名称或加后缀（如Ⅱ、2等）：\n' +
  '   上证指数、创业板指、证券、银行、酿酒、白酒、新能源、互联网、\n' +
  '   半导体ETF、科技ETF、电力、芯片、半导体\n' +
  '5. temperature 与 marketIndex 必须用计数公式计算，禁止凭感觉编造：\n' +
  '   score = (bullish + greed - bearish - fear) / max(posts, 1)\n' +
  '   temperature = clamp(round(50 + score * 50), 0, 100)\n' +
  '   marketIndex 用各板块 temperature 按 posts 加权平均\n\n' +
  '严格按以下JSON格式输出，不要加其他内容：\n\n' +
  '```json\n' +
  '{\n' +
  '  "posts": <帖子总数>,\n' +
  '  "distribution": {\n' +
  '    "bullish": <数量>,\n' +
  '    "bearish": <数量>,\n' +
  '    "fear": <数量>,\n' +
  '    "greed": <数量>,\n' +
  '    "neutral": <数量>\n' +
  '  },\n' +
  '  "sectors": {\n' +
  '    "<板块名>": {\n' +
  '      "posts": <数量>,\n' +
  '      "bullish": 0, "bearish": 0, "fear": 0, "greed": 0, "neutral": 0,\n' +
  '      "temperature": <按公式计算的0-100>,\n' +
  '      "topSignal": "<最典型帖子描述>"\n' +
  '    }\n' +
  '  },\n' +
  '  "marketIndex": <按公式计算的0-100综合指数>,\n' +
  '  "keySignals": ["<关键发现1>", "<关键发现2>", "<关键发现3>"]\n' +
  '}\n' +
  '```';

const AGGREGATE_SYSTEM_PROMPT = `你是中国A股市场情绪分析专家。请根据以下分批AI分析结果，汇总生成最终分析报告。

要求：
1. 将各批次的分布数据加总，计算全局情绪分布比例
2. 将同板块的数据加权合并（按帖子数加权）
3. 综合所有批次的市场指数（加权平均）
4. 从所有批次的关键发现中提取最重要的5条
5. 输出完整报告

输出格式：
## 🤖 Qoder AI 情绪分析报告

### 全局情绪分布
| 情绪 | 数量 | 占比 |
|------|------|------|
| 看多 | X | X% |
...

### 各板块情绪
| 板块 | 帖子数 | 温度 | 看多 | 看空 | 恐慌 | 贪婪 | 中性 |
...

### 市场情绪指数
给出0~100的综合指数和等级

### 关键发现
3~5条最重要的情绪特征`;

// 确保 qodercli 可用
function ensureQoderCli() {
  const whichResult = spawnSync('which', ['qodercli'], { encoding: 'utf-8' });
  if (whichResult.status !== 0) {
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
      return false;
    }
    process.env.PATH = `${dirname(found)}:${process.env.PATH}`;
  }
  return true;
}

// 调用 qodercli 单次分析
// 模型档位参考（Credit）：lite=免费, efficient≈0.3x, auto≈1.0x, Kimi-K3≈0.8x
// 可用环境变量 QODER_MODEL 覆盖，例如：QODER_MODEL=lite
const QODER_MODEL = process.env.QODER_MODEL || 'Kimi-K3';

function callQoderCli(inputFile, systemPrompt, timeout = AI_BATCH_TIMEOUT) {
  const prompt = `请阅读附件数据并分析。\n\n附件路径: ${inputFile}`;
  const result = spawnSync('qodercli', [
    '-p',
    '-m', QODER_MODEL,
    '--permission-mode', 'bypass_permissions',
    '--system-prompt', systemPrompt,
    '--attachment', inputFile,
    '--max-output-tokens', '4000',
    prompt,
  ], {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout,
    maxBuffer: 10 * 1024 * 1024,
  });

  if (result.error) {
    if (result.error.code === 'ETIMEDOUT') return { error: 'timeout' };
    return { error: result.error.message };
  }
  if (result.stdout) return { output: result.stdout };
  if (result.stderr) {
    if (/auth|login|token/i.test(result.stderr)) return { error: 'auth' };
    return { error: result.stderr.substring(0, 500) };
  }
  return { error: 'empty response' };
}

const MOVE_REASON_SYSTEM_PROMPT = `你是中国A股市场分析助手。根据「今日财经新闻」为主、「股吧热门帖」为辅，判断今天大盘涨跌的主要原因。

规则：
1. 优先依据【今日财经新闻】中的政策、资金、外围、板块、业绩、宏观等新闻归纳原因
2. 股吧帖子仅作情绪佐证；若新闻与帖子矛盾，以新闻为准
3. 若新闻里找不到可信的涨跌原因，reason 必须填「未知」，不要编造
4. direction 只能是：涨、跌、震荡、未知（可结合指数涨跌幅判断）
5. sources 填写你实际引用的新闻标题（最多3条）；若原因未知则 sources=[] 
6. 不要投资建议；只输出 JSON

输出格式：
\`\`\`json
{
  "direction": "涨|跌|震荡|未知",
  "reason": "一句话原因，或未知",
  "points": ["补充要点1", "补充要点2"],
  "sources": ["引用的新闻标题1", "引用的新闻标题2"]
}
\`\`\``;

/** 上证/创业板指当日涨跌快照 */
function fetchIndexSnapshot() {
  const specs = [
    { name: '上证指数', secid: '1.000001' },
    { name: '创业板指', secid: '0.399006' },
  ];
  const out = [];
  for (const s of specs) {
    const raw = httpGetText(
      `https://push2.eastmoney.com/api/qt/stock/get?secid=${s.secid}&fields=f43,f58,f169,f170,f60`
    );
    try {
      const data = JSON.parse(raw)?.data;
      if (!data) continue;
      const pct = typeof data.f170 === 'number' ? data.f170 / 100 : null;
      const chg = typeof data.f169 === 'number' ? data.f169 / 100 : null;
      const price = typeof data.f43 === 'number' ? data.f43 / 100 : null;
      out.push({
        name: data.f58 || s.name,
        price,
        change: chg,
        pct,
        direction: pct == null ? '未知' : pct > 0.05 ? '涨' : pct < -0.05 ? '跌' : '震荡',
      });
    } catch { /* ignore */ }
  }
  return out;
}

/** 分析今天涨跌原因（优先新闻；找不到则 reason=未知） */
function analyzeMoveReason(agg, allPosts) {
  console.log('\n  📌 分析今天涨跌原因（优先参考新闻）...\n');

  const news = getTodayNews(30);
  const indices = fetchIndexSnapshot();
  console.log(`  新闻 ${news.length} 条，指数快照 ${indices.length} 个`);

  const topPosts = (allPosts || []).slice(0, 25);
  const sectorLines = Object.entries(agg.sectors || {})
    .sort((a, b) => b[1].posts - a[1].posts)
    .slice(0, 8)
    .map(([name, s]) => `${name}: ${s.temperature}° 多${s.bullish} 空${s.bearish} 恐${s.fear} (${s.posts}帖)`);

  const lines = [
    '# 今日涨跌原因分析材料',
    '',
    '## 指数涨跌（权威参考）',
    ...(indices.length
      ? indices.map(i => `${i.name}: ${i.price ?? '-'}  涨跌 ${i.change ?? '-'}  涨跌幅 ${i.pct ?? '-'}%  方向=${i.direction}`)
      : ['（未获取到指数数据）']),
    '',
    `市场情绪指数: ${agg.marketIndex}/100`,
    `帖子数: ${agg.totalPosts}`,
    `分布: 多${agg.distribution?.bullish || 0} 贪${agg.distribution?.greed || 0} 中${agg.distribution?.neutral || 0} 空${agg.distribution?.bearish || 0} 恐${agg.distribution?.fear || 0}`,
    '',
    '## 今日财经新闻（优先依据，请主要引用此处）',
  ];

  if (news.length === 0) {
    lines.push('（未抓到新闻；若仅靠股吧无法判断原因，请输出未知）');
  } else {
    news.forEach((n, i) => {
      const dig = n.digest && n.digest !== n.title ? ` | ${n.digest.substring(0, 80)}` : '';
      lines.push(`${i + 1}. [${n.channel}|${n.time || ''}] ${n.title}${dig}`);
    });
  }

  lines.push('', '## 板块温度', ...sectorLines);
  lines.push('', '## 关键发现', ...(agg.signals || []).slice(0, 6).map((s, i) => `${i + 1}. ${s}`));
  lines.push('', '## 热门帖子（辅助，按点击）');
  topPosts.forEach((p, i) => {
    const text = ((p.title || '') + (p.content ? ` | ${p.content}` : '')).substring(0, 100);
    lines.push(`${i + 1}. [${p.barName}|${p.clicks}击] ${text}`);
  });

  const inputFile = join(DATA_DIR, 'ai_move_reason_input.txt');
  writeFileSync(inputFile, lines.join('\n'), 'utf-8');
  writeFileSync(join(DATA_DIR, 'today_news.json'), JSON.stringify({ indices, news }, null, 2), 'utf-8');

  const fallback = { direction: '未知', reason: '未知', points: [], sources: [], indices, newsCount: news.length };
  const result = callQoderCli(inputFile, MOVE_REASON_SYSTEM_PROMPT, 180000);

  if (result.error || !result.output) {
    console.log(`  ⚠️ 涨跌原因分析失败: ${result.error || 'empty'}，记为未知`);
    return fallback;
  }

  const parsed = extractJson(result.output);
  if (!parsed) {
    console.log('  ⚠️ 涨跌原因输出非JSON，记为未知');
    return fallback;
  }

  // 若有指数方向且模型写未知，可用指数方向补全 direction
  let direction = ['涨', '跌', '震荡', '未知'].includes(parsed.direction)
    ? parsed.direction
    : '未知';
  if (direction === '未知' && indices[0]?.direction && indices[0].direction !== '未知') {
    direction = indices[0].direction;
  }

  let reason = String(parsed.reason || '').trim() || '未知';
  if (!reason || /找不到|无法判断|没有明确|无明确|不清楚/.test(reason)) {
    reason = '未知';
  }
  // 无新闻且原因不是未知时更谨慎：若模型瞎编，无 sources 则降为未知
  const sources = Array.isArray(parsed.sources)
    ? parsed.sources.map(s => String(s).trim()).filter(Boolean).slice(0, 3)
    : [];
  if (reason !== '未知' && news.length > 0 && sources.length === 0) {
    // 允许无 sources，但鼓励有；不强制降级
  }
  if (reason !== '未知' && news.length === 0) {
    // 没有新闻时，仅当材料里有明确事件才保留；否则未知
    // 保守：无新闻一律未知（用户要求尽量参考新闻）
    reason = '未知';
    direction = indices[0]?.direction || '未知';
  }

  const points = Array.isArray(parsed.points)
    ? parsed.points.map(p => String(p).trim()).filter(Boolean).slice(0, 5)
    : [];

  console.log(`  ✓ 涨跌方向: ${direction} | 原因: ${reason}`);
  return { direction, reason, points, sources, indices, newsCount: news.length };
}

// 从 guba_posts.json 读取帖子（默认当天 09:00–15:00）
function loadPosts(days) {
  if (!existsSync(DATA_FILE)) return null;
  const data = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));

  const allPosts = [];
  const seen = new Set();
  for (const bar of data.bars) {
    for (const p of bar.posts) {
      if (isInAnalysisWindow(p.publishTime, { days }) && !seen.has(p.postId)) {
        seen.add(p.postId);
        allPosts.push({
          postId: p.postId,
          title: p.title,
          content: p.content || '',
          clicks: p.clicks || 0,
          comments: p.comments || 0,
          barName: bar.barName,
          barCode: bar.code,
          publishTime: p.publishTime,
        });
      }
    }
  }

  // 按点击数排序（高点击优先）
  allPosts.sort((a, b) => b.clicks - a.clicks);
  return allPosts;
}

// 生成批次输入文件
function generateBatchFile(batchPosts, batchIndex, totalBatches, totalPosts) {
  const lines = [];
  lines.push(`# 批次 ${batchIndex + 1}/${totalBatches} (总计 ${totalPosts} 条帖子中的第 ${(batchIndex * AI_BATCH_SIZE) + 1}-${Math.min((batchIndex + 1) * AI_BATCH_SIZE, totalPosts)} 条)`);
  lines.push('');

  // 按板块分组
  const byBar = {};
  for (const p of batchPosts) {
    if (!byBar[p.barCode]) byBar[p.barCode] = { name: p.barName, posts: [] };
    byBar[p.barCode].posts.push(p);
  }

  for (const [code, bar] of Object.entries(byBar)) {
    lines.push(`## ${bar.name} (${code}) - ${bar.posts.length}条`);
    lines.push('');
    for (let i = 0; i < bar.posts.length; i++) {
      const p = bar.posts[i];
      // 截断：优先标题，标题不够再补内容
      let text = p.title || '';
      if (text.length < MAX_POST_TEXT_LEN && p.content && p.content !== p.title) {
        text += ' | ' + p.content;
      }
      text = text.substring(0, MAX_POST_TEXT_LEN);
      lines.push(`${i + 1}. [${p.clicks}击/${p.comments}评] ${text}`);
    }
    lines.push('');
  }

  const filePath = join(DATA_DIR, `ai_batch_${batchIndex}.txt`);
  writeFileSync(filePath, lines.join('\n'), 'utf-8');
  return filePath;
}

// 从AI输出中提取JSON
function extractJson(text) {
  // 尝试匹配 ```json ... ```
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[1].trim()); } catch { /* fall through */ }
  }
  // 尝试直接匹配 {...}
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch { /* fall through */ }
  }
  return null;
}

// 汇总所有批次结果并生成最终报告
// 温度/市场指数一律按情绪计数本地重算，忽略模型自报数值
function aggregateBatchResults(batchResults, kwResult) {
  const totalDist = { bullish: 0, bearish: 0, fear: 0, greed: 0, neutral: 0 };
  const rawSectors = {};
  const allSignals = [];
  let totalPosts = 0;

  for (const r of batchResults) {
    if (!r) continue;
    const posts = r.posts || 0;
    totalPosts += posts;

    if (r.distribution) {
      for (const [k, v] of Object.entries(r.distribution)) {
        if (Object.prototype.hasOwnProperty.call(totalDist, k)) totalDist[k] += v;
      }
    }

    if (r.sectors) {
      for (const [rawName, data] of Object.entries(r.sectors)) {
        rawSectors[rawName] = rawSectors[rawName]
          ? mergeSectorEntry(rawSectors[rawName], data)
          : { ...data };
      }
    }

    if (r.keySignals) {
      allSignals.push(...r.keySignals);
    }
  }

  const sectors = mergeSectors(rawSectors);
  const marketIndex = marketIndexFromSectors(sectors, totalDist, totalPosts);

  return { totalPosts, marketIndex, distribution: totalDist, sectors, signals: allSignals };
}

/** 合并同一批次内的重复板块条目（只累加计数，温度由 mergeSectors 重算） */
function mergeSectorEntry(a, b) {
  return {
    posts: (a.posts || 0) + (b.posts || 0),
    bullish: (a.bullish || 0) + (b.bullish || 0),
    bearish: (a.bearish || 0) + (b.bearish || 0),
    fear: (a.fear || 0) + (b.fear || 0),
    greed: (a.greed || 0) + (b.greed || 0),
    neutral: (a.neutral || 0) + (b.neutral || 0),
    topSignal: a.topSignal || b.topSignal,
    signals: [...(a.signals || []), ...(b.signals || []), a.topSignal, b.topSignal].filter(Boolean),
  };
}

// 打印汇总报告
function printAggregatedReport(agg, kwResult) {
  const mi = agg.marketIndex;
  const level = sentimentLevel(mi).level;
  const emoji = mi < 30 ? '🟢🟢' : mi < 40 ? '🟢' : mi < 60 ? '🟡' : mi < 70 ? '🟠' : '🔴🔴';
  const d = agg.distribution;
  const t = agg.totalPosts || 1;

  console.log('\n' + '='.repeat(55));
  console.log('  🤖 Qoder AI 情绪分析报告（分批汇总）');
  console.log('='.repeat(55));

  console.log(`\n  市场情绪指数: ${mi}/100  ${emoji}`);
  console.log(`  等级: ${level}`);
  console.log(`  分析帖子数: ${t}`);

  if (agg.moveReason) {
    console.log(`\n  今天涨跌原因: [${agg.moveReason.direction}] ${agg.moveReason.reason}`);
    for (const p of agg.moveReason.points || []) {
      console.log(`    · ${p}`);
    }
    for (const s of agg.moveReason.sources || []) {
      console.log(`    📰 ${s}`);
    }
  }

  console.log('\n  全局情绪分布:');
  console.log(`    看多: ${d.bullish} (${(d.bullish / t * 100).toFixed(1)}%)`);
  console.log(`    贪婪: ${d.greed} (${(d.greed / t * 100).toFixed(1)}%)`);
  console.log(`    中性: ${d.neutral} (${(d.neutral / t * 100).toFixed(1)}%)`);
  console.log(`    看空: ${d.bearish} (${(d.bearish / t * 100).toFixed(1)}%)`);
  console.log(`    恐慌: ${d.fear} (${(d.fear / t * 100).toFixed(1)}%)`);

  console.log('\n  各板块情绪:');
  const sortedSectors = Object.entries(agg.sectors).sort((a, b) => b[1].posts - a[1].posts);
  for (const [name, s] of sortedSectors) {
    if (s.posts === 0) continue;
    const sLevel = s.temperature < 30 ? '恐慌' : s.temperature < 50 ? '偏空' : s.temperature < 70 ? '中性' : '偏多';
    console.log(`    ${name}: ${s.temperature}° ${sLevel} | 多${s.bullish} 贪${s.greed} 中${s.neutral} 空${s.bearish} 恐${s.fear} (${s.posts}帖)`);
  }

  // 关键词 vs AI 对比
  if (kwResult && kwResult.marketIndex) {
    const kwMi = kwResult.marketIndex.index;
    const diff = mi - kwMi;
    console.log('\n  关键词 vs AI 对比:');
    console.log(`    关键词指数: ${kwMi}°  |  AI指数: ${mi}°  |  差异: ${diff > 0 ? '+' : ''}${diff}°`);

    const kwDist = { bullish: 0, bearish: 0, fear: 0, greed: 0, neutral: 0 };
    let kwTotal = 0;
    for (const b of kwResult.bars) {
      if (!b.distribution) continue;
      for (const [k, v] of Object.entries(b.distribution)) kwDist[k] += v;
      kwTotal += b.postCount;
    }
    console.log(`    关键词看空: ${((kwDist.bearish + kwDist.fear) / kwTotal * 100).toFixed(1)}%  |  AI看空: ${((d.bearish + d.fear) / t * 100).toFixed(1)}%`);
    console.log(`    关键词中性: ${(kwDist.neutral / kwTotal * 100).toFixed(1)}%  |  AI中性: ${(d.neutral / t * 100).toFixed(1)}%`);
  }

  // 关键发现
  if (agg.signals.length > 0) {
    console.log('\n  关键发现:');
    const uniqueSignals = [...new Set(agg.signals)].slice(0, 5);
    uniqueSignals.forEach((s, i) => console.log(`    ${i + 1}. ${s}`));
  }

  console.log('\n' + '='.repeat(55));
}

// 主函数：分批AI分析
function runBatchedAIAnalysis(days) {
  console.log('\n🤖 Step 4/4: Qoder AI 情绪分析（分批模式）...\n');
  console.log(`  模型: ${QODER_MODEL}${process.env.QODER_MODEL ? ' (来自环境变量)' : ' (默认 Kimi-K3)'}\n`);

  if (!ensureQoderCli()) return null;

  // 读取帖子
  const allPosts = loadPosts(days);
  if (!allPosts || allPosts.length === 0) {
    console.error('  ❌ 无帖子数据');
    return null;
  }

  console.log(`  ⏱ 时间窗: ${analysisWindowLabel({ days })}`);

  // 分批
  const batches = [];
  for (let i = 0; i < allPosts.length; i += AI_BATCH_SIZE) {
    batches.push(allPosts.slice(i, i + AI_BATCH_SIZE));
  }

  console.log(`  📊 总帖子: ${allPosts.length}，分 ${batches.length} 批（每批${AI_BATCH_SIZE}条）\n`);

  // 逐批分析
  const batchResults = [];
  const batchStartTime = Date.now();

  for (let i = 0; i < batches.length; i++) {
    const batchNum = `[${i + 1}/${batches.length}]`;
    console.log(`  ${batchNum} 生成批次文件（${batches[i].length}条）...`);
    const batchFile = generateBatchFile(batches[i], i, batches.length, allPosts.length);

    // 重试循环
    let parsed = null;
    for (let retry = 0; retry <= AI_MAX_RETRIES; retry++) {
      if (retry > 0) {
        console.log(`  ${batchNum} 🔄 第${retry}次重试...`);
        execSync(`sleep ${AI_BATCH_DELAY / 1000}`);
      }

      console.log(`  ${batchNum} AI 分析中...`);
      const result = callQoderCli(batchFile, BATCH_SYSTEM_PROMPT, AI_BATCH_TIMEOUT);

      if (result.error) {
        if (result.error === 'auth') {
          console.error('  ❌ Qoder CLI 未登录');
          console.error('  请登录: qodercli login');
          console.error('  或设置: export QODER_PERSONAL_ACCESS_TOKEN=<PAT>');
          try { unlinkSync(batchFile); } catch {}
          return null;
        }
        if (result.error === 'timeout') {
          console.log(`  ${batchNum} ⏰ 超时${retry < AI_MAX_RETRIES ? '，将重试' : '，跳过'}`);
        } else {
          console.log(`  ${batchNum} ❌ 错误: ${result.error}${retry < AI_MAX_RETRIES ? '，将重试' : ''}`);
        }
        continue;  // 重试
      }

      // 解析JSON
      parsed = extractJson(result.output);
      if (parsed) {
        const mi = parsed.marketIndex || '?';
        console.log(`  ${batchNum} ✅ 完成 (指数: ${mi})`);
        break;  // 成功，跳出重试循环
      } else {
        console.log(`  ${batchNum} ⚠️ 输出非JSON${retry < AI_MAX_RETRIES ? '，将重试' : '，保存原始结果'}`);
        if (retry === AI_MAX_RETRIES) {
          const rawFile = join(DATA_DIR, `ai_batch_${i}_raw.txt`);
          writeFileSync(rawFile, result.output, 'utf-8');
        }
      }
    }

    // 清理临时文件
    try { unlinkSync(batchFile); } catch {}

    batchResults.push(parsed);

    // 批次间延迟（防限流）
    if (i < batches.length - 1) {
      console.log(`  ⏳ 等待${AI_BATCH_DELAY / 1000}秒...`);
      execSync(`sleep ${AI_BATCH_DELAY / 1000}`);
    }
  }

  const batchElapsed = ((Date.now() - batchStartTime) / 1000).toFixed(1);
  const successCount = batchResults.filter(r => r !== null).length;
  console.log(`\n  ✅ 批次完成: ${successCount}/${batches.length} (耗时 ${batchElapsed}s)`);

  if (successCount === 0) {
    console.error('  ❌ 所有批次均失败');
    return null;
  }

  // 读取关键词结果用于对比
  let kwResult = null;
  if (existsSync(KW_REPORT_FILE)) {
    try { kwResult = JSON.parse(readFileSync(KW_REPORT_FILE, 'utf-8')); } catch {}
  }

  // 汇总
  console.log('\n  📊 汇总分析结果...\n');

  // 如果所有批次都有JSON结果，程序化汇总
  const allParsed = batchResults.every(r => r !== null);
  if (allParsed) {
    const agg = aggregateBatchResults(batchResults, kwResult);
    const moveReason = analyzeMoveReason(agg, allPosts);
    agg.moveReason = moveReason;
    printAggregatedReport(agg, kwResult);

    // 保存汇总结果
    const aggFile = join(DATA_DIR, 'qoder_ai_result.json');
    writeFileSync(aggFile, JSON.stringify(agg, null, 2), 'utf-8');
    return agg;
  }

  // 部分批次失败，用qodercli做汇总
  console.log('  部分批次无结构化结果，使用AI汇总...\n');
  const aggInputFile = join(DATA_DIR, 'ai_aggregate_input.txt');
  const aggLines = ['# 分批AI分析结果汇总', ''];
  for (let i = 0; i < batchResults.length; i++) {
    aggLines.push(`## 批次 ${i + 1}/${batchResults.length}`);
    if (batchResults[i]) {
      aggLines.push(`\`\`\`json\n${JSON.stringify(batchResults[i], null, 2)}\n\`\`\``);
    } else {
      // 读取原始输出
      const rawFile = join(DATA_DIR, `ai_batch_${i}_raw.txt`);
      if (existsSync(rawFile)) {
        aggLines.push('原始输出（非JSON格式）：');
        aggLines.push(readFileSync(rawFile, 'utf-8').substring(0, 2000));
      } else {
        aggLines.push('（此批次失败，无数据）');
      }
    }
    aggLines.push('');
  }

  writeFileSync(aggInputFile, aggLines.join('\n'), 'utf-8');
  const result = callQoderCli(aggInputFile, AGGREGATE_SYSTEM_PROMPT, 300000);

  if (result.output) {
    console.log(result.output);
    const aiResultFile = join(DATA_DIR, 'qoder_ai_result.txt');
    writeFileSync(aiResultFile, result.output, 'utf-8');
    return result.output;
  } else {
    console.error('  ❌ 汇总分析失败');
    return null;
  }
}

main().catch(err => {
  console.error('错误:', err);
  process.exit(1);
});
