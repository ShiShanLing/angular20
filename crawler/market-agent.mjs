#!/usr/bin/env node
/**
 * 手动市场 Agent：调用行情工具后分析走势与量能。
 *
 * 不影响 15:00 情绪日报定时任务。
 *
 * 用法:
 *   node crawler/market-agent.mjs
 *   node crawler/market-agent.mjs --q "今天量能怎么样，哪些板块最强"
 *   node crawler/market-agent.mjs --all-concepts
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { spawnSync } from 'child_process';
import { getBjToday } from './time-window.mjs';
import {
  getIndices,
  getIndustryBoards,
  getConceptBoards,
  getMarketBreadth,
  getTodayNews,
} from './eastmoney-market.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const OUT_FILE = join(DATA_DIR, 'market_agent.json');
const SENTIMENT_FILE = join(DATA_DIR, 'qoder_ai_result.json');
const QODER_MODEL = process.env.QODER_MODEL || 'Kimi-K3';
const SYNTH_TIMEOUT = 240000;
const DEFAULT_QUESTION = '分析今天 A 股走势与量能，并总结各板块涨跌。';

const SYSTEM_PROMPT = [
  '你是中国A股行情分析 Agent。附件是工具刚拉取的实时行情，请只根据附件回答用户问题。',
  '只输出一个 JSON，不要输出其它文字：',
  '{"summary":"一句话总览","indices":"指数走势","volume":"量能判断","sectors":"板块轮动","breadth":"涨跌家数与涨停跌停","news":"相关新闻要点或未知","conclusion":"简要结论","unknowns":["数据缺失项"]}',
  '规则：不要投资建议；数字必须来自附件；没有就写未知；量能用成交额亿元描述。',
].join('\n');

function parseArgs(argv) {
  const allConcepts = argv.includes('--all-concepts');
  const qIdx = argv.findIndex(a => a === '--q' || a === '--question');
  let question = DEFAULT_QUESTION;
  if (qIdx >= 0 && argv[qIdx + 1]) question = argv[qIdx + 1];
  else {
    const eq = argv.find(a => a.startsWith('--q=') || a.startsWith('--question='));
    if (eq) question = eq.slice(eq.indexOf('=') + 1);
  }
  return { question, allConcepts };
}

function ensureQoderCli() {
  const whichResult = spawnSync('which', ['qodercli'], { encoding: 'utf-8' });
  if (whichResult.status === 0) return true;
  const commonPaths = [
    join(process.env.HOME || '', '.local', 'bin', 'qodercli'),
    join(process.env.HOME || '', '.qoder', 'bin', 'qodercli', 'qodercli'),
  ];
  for (const p of commonPaths) {
    if (existsSync(p)) {
      process.env.PATH = `${dirname(p)}:${process.env.PATH}`;
      return true;
    }
  }
  console.log('  ⚠️ qodercli 未安装，将只输出行情摘要');
  
  return false;
}

function extractJson(text) {
  const jsonMatch = text.match(/```json\s*([\s\S]*?)```/);
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[1].trim()); } catch { /* fall through */ }
  }
  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try { return JSON.parse(objMatch[0]); } catch { /* fall through */ }
  }
  return null;
}


function callQoderCli(inputFile) {
  const prompt = `请阅读附件行情数据，回答用户问题并只输出 JSON。\n\n附件路径: ${inputFile}`;
  const result = spawnSync('qodercli', [
    '-p',
    '-m', QODER_MODEL,
    '--permission-mode', 'bypass_permissions',
    '--system-prompt', SYSTEM_PROMPT,
    '--attachment', inputFile,
    '--max-output-tokens', '2500',
    prompt,
  ], {
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    timeout: SYNTH_TIMEOUT,
    maxBuffer: 8 * 1024 * 1024,
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

function readSentimentToday() {
  if (!existsSync(SENTIMENT_FILE)) {
    return { available: false, reason: '当天尚无 qoder_ai_result.json' };
  }
  try {
    const data = JSON.parse(readFileSync(SENTIMENT_FILE, 'utf-8'));
    const sectors = Object.entries(data.sectors || {})
      .map(([name, s]) => ({
        name,
        posts: s.posts,
        temperature: s.temperature,
        bullish: s.bullish,
        bearish: s.bearish,
        fear: s.fear,
      }))
      .sort((a, b) => (b.posts || 0) - (a.posts || 0))
      .slice(0, 12);
    return {
      available: true,
      marketIndex: data.marketIndex,
      totalPosts: data.totalPosts,
      distribution: data.distribution,
      moveReason: data.moveReason || null,
      signals: (data.signals || []).slice(0, 6),
      sectors,
    };
  } catch (err) {
    return { available: false, reason: err.message };
  }
}

function compactBoards(data, all = false) {
  const out = {
    total: data.total,
    up: data.up,
    down: data.down,
    flat: data.flat,
    topGainers: data.topGainers,
    topLosers: data.topLosers,
    topAmount: data.topAmount,
  };
  if (all && Array.isArray(data.boards)) {
    out.all = data.boards.map(b => `${b.name}\t${b.pct}\t${b.amountYi}\t${b.leader || ''}`);
  }
  if (data.note) out.note = data.note;
  return out;
}

function fallbackAnalysis(bundle) {
  const indices = bundle.get_indices || [];
  const breadth = bundle.get_market_breadth || {};
  const industry = bundle.get_industry_boards || {};
  return {
    summary: '工具数据已拉取，模型分析未完成，以下为行情摘要。',
    indices: indices.map(i => `${i.name} ${i.pct ?? '?'}% 成交额${i.amountYi ?? '?'}亿`).join('；'),
    volume: `沪深成交额约 ${breadth.hsAmountYi ?? '未知'} 亿元`,
    sectors: `行业板块 ${industry.total ?? '?'} 个，上涨${industry.up ?? '?'} 下跌${industry.down ?? '?'}。领涨: ${(industry.topGainers || []).slice(0, 5).map(b => `${b.name} ${b.pct}%`).join('，') || '未知'}`,
    breadth: `上涨${breadth.upCount ?? '未知'} 下跌${breadth.downCount ?? '未知'}；涨停${breadth.limitUp?.count ?? '未知'} 跌停${breadth.limitDown?.count ?? '未知'}`,
    news: (bundle.get_today_news || []).slice(0, 3).map(n => n.title).join('；') || '未知',
    conclusion: '未知',
    unknowns: ['模型未给出完整分析'],
  };
}

function printReport(analysis, meta) {
  console.log('\n' + '='.repeat(56));
  console.log('  市场 Agent 分析');
  console.log('='.repeat(56));
  console.log(`  日期: ${meta.date}`);
  console.log(`  问题: ${meta.question}`);
  console.log(`  工具: ${meta.tools.join(' → ')}`);
  if (!analysis) {
    console.log('\n  （无分析结果）');
    return;
  }
  const lines = [
    ['总览', analysis.summary],
    ['指数', analysis.indices],
    ['量能', analysis.volume],
    ['板块', analysis.sectors],
    ['宽度', analysis.breadth],
    ['新闻', analysis.news],
    ['结论', analysis.conclusion],
  ];
  for (const [label, text] of lines) {
    if (!text) continue;
    console.log(`\n  【${label}】`);
    console.log(`  ${String(text).replace(/\n/g, '\n  ')}`);
  }
  if (Array.isArray(analysis.unknowns) && analysis.unknowns.length) {
    console.log(`\n  【未知】 ${analysis.unknowns.join('；')}`);
  }
  console.log('\n' + '='.repeat(56));
}

function gatherTools(allConcepts) {
  const used = [];
  const bundle = {};
  
  console.log('  🔧 get_indices');
  bundle.get_indices = getIndices();
  used.push('get_indices');

  console.log('  🔧 get_market_breadth');
  bundle.get_market_breadth = getMarketBreadth();
  used.push('get_market_breadth');

  console.log('  🔧 get_industry_boards');
  bundle.get_industry_boards = compactBoards(getIndustryBoards(), true);
  used.push('get_industry_boards');

  console.log('  🔧 get_concept_boards');
  bundle.get_concept_boards = compactBoards(getConceptBoards({
    topN: 15,
    all: allConcepts,
  }), allConcepts);
  used.push('get_concept_boards');

  console.log('  🔧 get_today_news');
  bundle.get_today_news = getTodayNews(20);
  used.push('get_today_news');

  console.log('  🔧 read_sentiment_today');
  bundle.read_sentiment_today = readSentimentToday();
  used.push('read_sentiment_today');

  return { bundle, used };
}

function main() {
  const { question, allConcepts } = parseArgs(process.argv.slice(2));
  const dateStr = getBjToday();

  console.log('╔══════════════════════════════════════════╗');
  console.log('║  市场 Agent（手动，不影响日报 cron）     ║');
  console.log('╚══════════════════════════════════════════╝');
  console.log(`  日期: ${dateStr}`);
  console.log(`  问题: ${question}`);
  console.log(`  模型: ${QODER_MODEL}${process.env.QODER_MODEL ? ' (环境变量)' : ' (默认)'}\n`);

  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });

  const { bundle, used } = gatherTools(allConcepts);
  console.log(`\n  ✓ 工具完成: ${used.join(', ')}`);
  console.log(`    行业板块 ${bundle.get_industry_boards.total} 个，概念 ${bundle.get_concept_boards.total} 个\n`);

  let analysis = null;
  let lastError = null;
  if (ensureQoderCli()) {
    const inputFile = join(DATA_DIR, 'market_agent_input.json');
    writeFileSync(inputFile, JSON.stringify({ date: dateStr, question, tools: bundle }, null, 2), 'utf-8');
    console.log('  🧠 综合分析中...');
    const result = callQoderCli(inputFile);
    try { unlinkSync(inputFile); } catch { /* ignore */ }
    if (result.error) {
      lastError = result.error;
      console.log(`  ⚠️ 模型失败: ${result.error}`);
      if (result.error === 'auth') {
        console.error('  请登录: qodercli login');
        console.error('  或设置: export QODER_PERSONAL_ACCESS_TOKEN=<PAT>');
      }
    } else {
      const parsed = extractJson(result.output);
      if (parsed?.analysis) analysis = parsed.analysis;
      else if (parsed?.summary || parsed?.indices) analysis = parsed;
      else {
        lastError = '输出非 JSON';
        console.log('  ⚠️ 输出非 JSON');
      }
    }
  }

  if (!analysis) {
    analysis = fallbackAnalysis(bundle);
    if (lastError) analysis.unknowns = [`模型异常: ${lastError}`, ...(analysis.unknowns || [])];
  }

  const payload = {
    generatedAt: new Date().toISOString(),
    date: dateStr,
    question,
    model: QODER_MODEL,
    tools: used,
    analysis,
    snapshot: {
      indices: bundle.get_indices,
      breadth: {
        hsAmountYi: bundle.get_market_breadth.hsAmountYi,
        upCount: bundle.get_market_breadth.upCount,
        downCount: bundle.get_market_breadth.downCount,
        limitUp: bundle.get_market_breadth.limitUp?.count,
        limitDown: bundle.get_market_breadth.limitDown?.count,
      },
      industry: {
        total: bundle.get_industry_boards.total,
        up: bundle.get_industry_boards.up,
        down: bundle.get_industry_boards.down,
        topGainers: bundle.get_industry_boards.topGainers,
        topLosers: bundle.get_industry_boards.topLosers,
      },
    },
  };
  writeFileSync(OUT_FILE, JSON.stringify(payload, null, 2), 'utf-8');
  printReport(analysis, { date: dateStr, question, tools: used });
  console.log(`\n💾 ${OUT_FILE}`);
}

main();
