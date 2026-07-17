#!/usr/bin/env node
/**
 * 东方财富股吧 - AI情绪分析模块（全量分析）
 *
 * 通过 LLM API 对每条帖子进行深度情绪分析，比关键词方案更准确。
 * 兼容所有 OpenAI 兼容 API（OpenAI、DeepSeek、通义千问、Ollama等）
 *
 * 用法:
 *   node crawler/guba-ai.mjs                           # 分析已有数据
 *   node crawler/guba-ai.mjs --crawl                   # 先抓取再分析
 *   node crawler/guba-ai.mjs --days=3                  # 分析最近N天
 *   node crawler/guba-ai.mjs --json                    # 仅输出JSON
 *   node crawler/guba-ai.mjs --provider=deepseek       # 指定提供商
 *
 * 配置（crawler/ai-config.json）:
 *   {
 *     "provider": "deepseek",
 *     "apiKey": "sk-xxx",
 *     "baseUrl": "https://api.deepseek.com/v1",
 *     "model": "deepseek-chat",
 *     "batchSize": 20
 *   }
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const DATA_FILE = join(DATA_DIR, 'guba_posts.json');
const AI_CONFIG_FILE = join(__dirname, 'ai-config.json');
const AI_REPORT_FILE = join(DATA_DIR, 'guba_ai_analysis.json');

// ============================================================
// 预设API配置
// ============================================================

const PROVIDERS = {
  deepseek: {
    baseUrl: 'https://api.deepseek.com/v1',
    model: 'deepseek-chat',
    batchSize: 25,
    label: 'DeepSeek',
  },
  openai: {
    baseUrl: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    batchSize: 25,
    label: 'OpenAI',
  },
  qwen: {
    baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1',
    model: 'qwen-turbo',
    batchSize: 25,
    label: '通义千问',
  },
  ollama: {
    baseUrl: 'http://localhost:11434/v1',
    model: 'qwen2.5:7b',
    batchSize: 15,
    label: 'Ollama本地',
  },
};

// ============================================================
// 配置加载
// ============================================================

function loadConfig() {
  // 优先读配置文件
  if (existsSync(AI_CONFIG_FILE)) {
    try {
      const config = JSON.parse(readFileSync(AI_CONFIG_FILE, 'utf-8'));
      // 合并provider预设
      if (config.provider && PROVIDERS[config.provider]) {
        const preset = PROVIDERS[config.provider];
        return {
          baseUrl: config.baseUrl || preset.baseUrl,
          model: config.model || preset.model,
          batchSize: config.batchSize || preset.batchSize,
          apiKey: config.apiKey || '',
          provider: config.provider,
          label: preset.label,
        };
      }
      return config;
    } catch (e) {
      console.error('配置文件解析失败:', e.message);
    }
  }

  // 从环境变量读取
  const apiKey = process.env.AI_API_KEY || process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY || '';
  const provider = process.env.AI_PROVIDER || 'deepseek';
  const preset = PROVIDERS[provider] || PROVIDERS.deepseek;

  return {
    baseUrl: process.env.AI_BASE_URL || preset.baseUrl,
    model: process.env.AI_MODEL || preset.model,
    batchSize: parseInt(process.env.AI_BATCH_SIZE || preset.batchSize),
    apiKey,
    provider,
    label: preset.label,
  };
}

// ============================================================
// AI 分析核心
// ============================================================

const ANALYSIS_PROMPT = `你是一个专业的中国股票市场情绪分析师。请分析以下东方财富股吧帖子的情绪。

对每条帖子，返回JSON数组中每个对象包含：
- id: 帖子ID
- sentiment: 情绪分类，只能是以下之一: "bullish"(看多), "bearish"(看空), "fear"(恐慌), "greed"(贪婪), "neutral"(中性)
- confidence: 置信度 0~1
- score: 情绪得分 -1(极度看空) 到 +1(极度看多)
- reason: 简短分析理由(20字以内)
- keywords: 从帖子中提取的1~3个关键金融词

分析要点：
1. 注意反讽和讽刺，如"稳了"可能是反话
2. 结合上下文判断真实情绪
3. "抄底""反弹"等词不一定看多，要看语境
4. 高互动帖子(点击多)的情绪更有代表性
5. 股吧用户经常情绪化，要识别真实观点

只返回JSON数组，不要其他内容。`;

async function analyzeBatch(posts, config) {
  const postTexts = posts.map(p => ({
    id: p.postId,
    text: `${p.title}${p.content && p.content !== p.title ? ' | ' + p.content : ''}`,
    clicks: p.clicks || 0,
    comments: p.comments || 0,
    author: p.author || '',
    time: p.publishTime || '',
  }));

  const userMessage = `请分析以下${posts.length}条股吧帖子的情绪：\n\n${JSON.stringify(postTexts, null, 1)}`;

  const resp = await fetch(`${config.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model,
      messages: [
        { role: 'system', content: ANALYSIS_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.1,  // 低温度，更一致的结果
      max_tokens: 4000,
    }),
  });

  if (!resp.ok) {
    const errText = await resp.text();
    throw new Error(`API错误 ${resp.status}: ${errText.substring(0, 200)}`);
  }

  const data = await resp.json();
  const content = data.choices?.[0]?.message?.content || '';

  // 解析JSON响应
  let results;
  try {
    // 尝试直接解析
    results = JSON.parse(content);
  } catch {
    // 尝试从markdown代码块中提取
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      results = JSON.parse(jsonMatch[1].trim());
    } else {
      // 尝试找到第一个 [ 和最后一个 ]
      const start = content.indexOf('[');
      const end = content.lastIndexOf(']');
      if (start >= 0 && end > start) {
        results = JSON.parse(content.substring(start, end + 1));
      } else {
        throw new Error('无法解析AI响应');
      }
    }
  }

  return results;
}

// ============================================================
// 全量分析流程
// ============================================================

async function analyzeAllPosts(allPosts, config) {
  const totalPosts = allPosts.length;
  const totalBatches = Math.ceil(totalPosts / config.batchSize);
  const allResults = [];
  let errors = 0;

  console.log(`\n🤖 AI分析启动 (${config.label} ${config.model})`);
  console.log(`   帖子总数: ${totalPosts}`);
  console.log(`   批次: ${totalBatches}批 × ${config.batchSize}条/批\n`);

  for (let i = 0; i < totalPosts; i += config.batchSize) {
    const batch = allPosts.slice(i, i + config.batchSize);
    const batchNum = Math.floor(i / config.batchSize) + 1;

    process.stdout.write(`   批次 ${batchNum}/${totalBatches}: 分析${batch.length}条帖子...\r`);

    try {
      const results = await analyzeBatch(batch, config);
      allResults.push(...results);
      process.stdout.write(`   批次 ${batchNum}/${totalBatches}: ✓ ${results.length}条完成\n`);
    } catch (err) {
      errors++;
      console.error(`   批次 ${batchNum}/${totalBatches}: ✗ ${err.message}`);

      // 如果是限流，等一会再试
      if (err.message.includes('429') || err.message.includes('rate')) {
        console.log('   限流，等待10秒后重试...');
        await sleep(10000);
        try {
          const results = await analyzeBatch(batch, config);
          allResults.push(...results);
          errors--;
          console.log(`   批次 ${batchNum}: ✓ 重试成功`);
        } catch (retryErr) {
          console.error(`   批次 ${batchNum}: ✗ 重试失败: ${retryErr.message}`);
        }
      }
    }

    // 批次间延迟，避免限流
    if (i + config.batchSize < totalPosts) {
      await sleep(1500);
    }
  }

  console.log(`\n   分析完成: ${allResults.length}/${totalPosts}条成功${errors > 0 ? `, ${errors}批失败` : ''}`);

  return allResults;
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

// ============================================================
// 结果聚合
// ============================================================

function aggregateResults(posts, aiResults, bars) {
  // 建立AI结果索引
  const aiMap = new Map();
  for (const r of aiResults) {
    aiMap.set(String(r.id), r);
  }

  // 合并原始帖子和AI分析结果
  const analyzedPosts = [];
  let unmatched = 0;

  for (const post of posts) {
    const ai = aiMap.get(String(post.postId));
    if (ai) {
      analyzedPosts.push({
        ...post,
        aiSentiment: ai.sentiment,
        aiConfidence: ai.confidence,
        aiScore: ai.score,
        aiReason: ai.reason,
        aiKeywords: ai.keywords || [],
      });
    } else {
      unmatched++;
    }
  }

  // 按板块聚合
  const barStats = new Map();
  for (const bar of bars) {
    const barPosts = analyzedPosts.filter(p => {
      // 检查帖子是否属于这个板块
      return bar.posts.some(bp => bp.postId === p.postId);
    });

    if (barPosts.length === 0) continue;

    const dist = { bullish: 0, bearish: 0, fear: 0, greed: 0, neutral: 0 };
    let totalScore = 0;
    let totalConfidence = 0;
    const allKeywords = new Map();

    for (const p of barPosts) {
      dist[p.aiSentiment] = (dist[p.aiSentiment] || 0) + 1;
      totalScore += p.aiScore * (1 + Math.log10(1 + p.clicks));
      totalConfidence += p.aiConfidence;
      for (const kw of (p.aiKeywords || [])) {
        allKeywords.set(kw, (allKeywords.get(kw) || 0) + 1);
      }
    }

    const avgScore = barPosts.reduce((s, p) => s + p.aiScore * (1 + Math.log10(1 + (p.clicks || 0))), 0)
      / barPosts.reduce((s, p) => s + (1 + Math.log10(1 + (p.clicks || 0))), 0);
    const temperature = Math.round(50 + avgScore * 50);

    barStats.set(bar.code, {
      code: bar.code,
      name: bar.barName,
      postCount: barPosts.length,
      temperature,
      avgScore: Math.round(avgScore * 1000) / 1000,
      avgConfidence: Math.round(totalConfidence / barPosts.length * 100) / 100,
      distribution: dist,
      topKeywords: [...allKeywords.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([k, v]) => ({ keyword: k, count: v })),
      // 代表性帖子
      representative: barPosts
        .sort((a, b) => Math.abs(b.aiScore) - Math.abs(a.aiScore))
        .slice(0, 4)
        .map(p => ({
          title: p.title,
          clicks: p.clicks,
          sentiment: p.aiSentiment,
          score: p.aiScore,
          reason: p.aiReason,
        })),
    });
  }

  // 全局热门关键词
  const globalKeywords = new Map();
  for (const p of analyzedPosts) {
    for (const kw of (p.aiKeywords || [])) {
      globalKeywords.set(kw, (globalKeywords.get(kw) || 0) + 1);
    }
  }

  // 市场综合指数
  const validBars = [...barStats.values()].filter(b => b.postCount > 0);
  const weights = { 'sh000001': 3.0, 'sz399006': 2.5, 'BK0473': 2.0, 'BK0475': 1.5, 'BK0477': 1.0, 'BK0493': 1.0, 'BK0447': 1.0 };

  let wSum = 0, wTotal = 0;
  for (const b of validBars) {
    const w = weights[b.code] || 1.0;
    wSum += b.temperature * w;
    wTotal += w;
  }
  const marketIndex = wTotal > 0 ? Math.round(wSum / wTotal) : 50;

  let level, emoji, description;
  if (marketIndex >= 75) { level = '极度贪婪'; emoji = '🔴🔴🔴'; description = '市场极度乐观，注意过热风险'; }
  else if (marketIndex >= 60) { level = '贪婪'; emoji = '🟠'; description = '市场偏多，情绪积极'; }
  else if (marketIndex >= 45) { level = '中性'; emoji = '🟡'; description = '市场情绪平稳，多空均衡'; }
  else if (marketIndex >= 30) { level = '恐惧'; emoji = '🟢'; description = '市场偏空，情绪谨慎（可能是机会）'; }
  else { level = '极度恐惧'; emoji = '🟢🟢🟢'; description = '市场极度悲观（历史上往往是底部区域）'; }

  // 情绪分布总览
  const globalDist = { bullish: 0, bearish: 0, fear: 0, greed: 0, neutral: 0 };
  for (const p of analyzedPosts) {
    globalDist[p.aiSentiment] = (globalDist[p.aiSentiment] || 0) + 1;
  }

  return {
    generatedAt: new Date().toISOString(),
    model: `${config_label} ${config_model}`,
    totalAnalyzed: analyzedPosts.length,
    unmatched,
    marketIndex: { index: marketIndex, level, emoji, description },
    globalDistribution: globalDist,
    hotKeywords: [...globalKeywords.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([k, v]) => ({ keyword: k, count: v })),
    bars: [...barStats.values()],
    // 最强情绪帖子
    extremePosts: analyzedPosts
      .sort((a, b) => Math.abs(b.aiScore) - Math.abs(a.aiScore))
      .slice(0, 10)
      .map(p => ({
        title: p.title,
        barName: p.barName || '',
        clicks: p.clicks,
        sentiment: p.aiSentiment,
        score: p.aiScore,
        confidence: p.aiConfidence,
        reason: p.aiReason,
      })),
    posts: analyzedPosts.map(p => ({
      postId: p.postId,
      title: p.title,
      sentiment: p.aiSentiment,
      score: p.aiScore,
      confidence: p.aiConfidence,
      reason: p.aiReason,
      keywords: p.aiKeywords,
      clicks: p.clicks,
      publishTime: p.publishTime,
    })),
  };
}

let config_label = '';
let config_model = '';

// ============================================================
// 报告打印
// ============================================================

function printReport(report) {
  console.log('\n' + '='.repeat(60));
  console.log('  🧠 AI市场情绪分析报告');
  console.log('  📅 ' + new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
  console.log('  🤖 模型: ' + report.model);
  console.log('='.repeat(60));

  // 市场指数
  const mi = report.marketIndex;
  console.log(`\n🎯 市场情绪指数: ${mi.index}/100  ${mi.emoji}`);
  console.log(`   等级: ${mi.level}  |  ${mi.description}`);
  console.log(`   分析帖子: ${report.totalAnalyzed}条${report.unmatched > 0 ? ` (${report.unmatched}条未匹配)` : ''}`);

  // 情绪分布
  const d = report.globalDistribution;
  const total = report.totalAnalyzed;
  console.log(`\n📊 全局情绪分布:`);
  console.log(`   看多: ${d.bullish} (${(d.bullish / total * 100).toFixed(1)}%)  ${'█'.repeat(Math.round(d.bullish / total * 40))}`);
  console.log(`   贪婪: ${d.greed} (${(d.greed / total * 100).toFixed(1)}%)  ${'█'.repeat(Math.round(d.greed / total * 40))}`);
  console.log(`   中性: ${d.neutral} (${(d.neutral / total * 100).toFixed(1)}%)  ${'█'.repeat(Math.round(d.neutral / total * 40))}`);
  console.log(`   看空: ${d.bearish} (${(d.bearish / total * 100).toFixed(1)}%)  ${'█'.repeat(Math.round(d.bearish / total * 40))}`);
  console.log(`   恐慌: ${d.fear} (${(d.fear / total * 100).toFixed(1)}%)  ${'█'.repeat(Math.round(d.fear / total * 40))}`);

  // 各板块
  console.log(`\n${'─'.repeat(60)}`);
  console.log('📈 板块情绪对比:');
  console.log(`${'─'.repeat(60)}`);

  const sortedBars = report.bars.sort((a, b) => b.temperature - a.temperature);
  for (const bar of sortedBars) {
    const tempEmoji = bar.temperature >= 60 ? '🟠' : bar.temperature >= 45 ? '🟡' : '🟢';
    console.log(`\n  ${tempEmoji} ${bar.name} (${bar.code})  温度:${bar.temperature}°  置信度:${bar.avgConfidence}`);
    console.log(`    帖子:${bar.postCount} | 看多:${bar.distribution.bullish} 中性:${bar.distribution.neutral} 看空:${bar.distribution.bearish} 恐慌:${bar.distribution.fear} 贪婪:${bar.distribution.greed}`);
    if (bar.topKeywords.length > 0) {
      console.log(`    关键词: ${bar.topKeywords.map(k => `${k.keyword}(${k.count})`).join(', ')}`);
    }
    for (const r of bar.representative.slice(0, 2)) {
      const se = r.sentiment === 'bullish' || r.sentiment === 'greed' ? '🟢' : '🔴';
      console.log(`    ${se} [${r.clicks}点击] ${r.title.substring(0, 45)}`);
      console.log(`       → ${r.reason} (${r.score > 0 ? '+' : ''}${r.score})`);
    }
  }

  // 热门关键词
  console.log(`\n${'─'.repeat(60)}`);
  console.log('🔥 AI提取热门话题:');
  console.log(`${'─'.repeat(60)}`);
  for (let i = 0; i < Math.min(15, report.hotKeywords.length); i++) {
    const k = report.hotKeywords[i];
    const bar = '█'.repeat(Math.min(k.count, 30));
    console.log(`  ${String(i + 1).padStart(2)}. ${k.keyword.padEnd(10)} ${String(k.count).padStart(4)}次  ${bar}`);
  }

  // 最强情绪帖子
  console.log(`\n${'─'.repeat(60)}`);
  console.log('⚡ 情绪最强帖子 (AI分析):');
  console.log(`${'─'.repeat(60)}`);

  const bullish = report.extremePosts.filter(p => p.score > 0).slice(0, 3);
  const bearish = report.extremePosts.filter(p => p.score < 0).slice(0, 3);

  if (bullish.length) {
    console.log('\n  🟢 最强看多:');
    for (const p of bullish) {
      console.log(`    [${p.clicks}点击|置信${p.confidence}] ${p.title.substring(0, 50)}`);
      console.log(`      AI: ${p.reason} (${p.score > 0 ? '+' : ''}${p.score})`);
    }
  }
  if (bearish.length) {
    console.log('\n  🔴 最强看空:');
    for (const p of bearish) {
      console.log(`    [${p.clicks}点击|置信${p.confidence}] ${p.title.substring(0, 50)}`);
      console.log(`      AI: ${p.reason} (${p.score})`);
    }
  }

  // 信号
  console.log(`\n${'─'.repeat(60)}`);
  console.log('💡 AI情绪信号提示:');
  console.log(`${'─'.repeat(60)}`);

  const signals = [];
  if (mi.index <= 25) signals.push('⚠ 市场极度恐慌 - 历史上往往是阶段性底部');
  if (mi.index >= 75) signals.push('⚠ 市场极度贪婪 - 注意追高风险');
  if (d.fear > d.bullish) signals.push('⚠ 恐慌情绪占主导 - 可能超卖');
  if (d.greed > total * 0.1) signals.push('⚠ 贪婪帖子占比超10% - 短期可能过热');

  for (const bar of sortedBars) {
    if (bar.temperature <= 20) signals.push(`⚠ ${bar.name}极度悲观(${bar.temperature}°)`);
    if (bar.temperature >= 80) signals.push(`⚠ ${bar.name}极度乐观(${bar.temperature}°)`);
  }

  // 板块分化
  const temps = sortedBars.map(b => b.temperature);
  if (temps.length >= 2) {
    const maxDiff = Math.max(...temps) - Math.min(...temps);
    if (maxDiff > 30) signals.push(`⚠ 板块温差${maxDiff}° - 严重分化，结构性行情`);
    else if (maxDiff > 15) signals.push(`ℹ 板块温差${maxDiff}° - 轻度分化`);
  }

  if (signals.length === 0) signals.push('ℹ 市场情绪处于正常区间');
  for (const s of signals) console.log(`  ${s}`);

  console.log('\n' + '='.repeat(60));
  console.log('  ⚠ 以上分析基于AI对股吧帖子的理解，不构成投资建议');
  console.log('='.repeat(60) + '\n');
}

// ============================================================
// 主流程
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const outputJson = args.includes('--json');
  const doCrawl = args.includes('--crawl');
  const daysArg = args.find(a => a.startsWith('--days='));
  const days = daysArg ? parseInt(daysArg.split('=')[1]) : 1;
  const providerArg = args.find(a => a.startsWith('--provider='));
  const pagesArg = args.find(a => a.startsWith('--pages='));
  const pages = pagesArg ? pagesArg.split('=')[1] : '5';

  // 加载配置
  const config = loadConfig();
  config_label = config.label || config.provider;
  config_model = config.model;

  if (providerArg) {
    const provider = providerArg.split('=')[1];
    if (PROVIDERS[provider]) {
      Object.assign(config, PROVIDERS[provider]);
      config.provider = provider;
      config_label = PROVIDERS[provider].label;
      config_model = config.model;
    }
  }

  if (!config.apiKey) {
    console.error('❌ 未配置API Key！请创建 crawler/ai-config.json:');
    console.error(`   {
     "provider": "deepseek",
     "apiKey": "你的API Key",
     "baseUrl": "https://api.deepseek.com/v1",
     "model": "deepseek-chat"
   }`);
    console.error('\n   支持的服务: deepseek / openai / qwen / ollama');
    console.error('   也可以通过环境变量: AI_API_KEY=sk-xxx node crawler/guba-ai.mjs');
    process.exit(1);
  }

  // 先抓取
  if (doCrawl) {
    console.log('🔄 先抓取最新数据...\n');
    try {
      execSync(
        `node ${join(__dirname, 'guba.mjs')} --config ${join(__dirname, 'guba_targets.json')} --today --pages=${pages}`,
        { stdio: 'inherit' }
      );
    } catch (err) {
      console.error('抓取失败:', err.message);
    }
  }

  // 读取数据
  if (!existsSync(DATA_FILE)) {
    console.error('❌ 无数据文件，请先运行爬虫');
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));

  // 过滤时间
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().substring(0, 10);

  // 收集所有帖子
  const allPosts = [];
  for (const bar of data.bars) {
    for (const p of bar.posts) {
      if (p.publishTime && p.publishTime.substring(0, 10) >= cutoffStr) {
        allPosts.push(p);
      }
    }
  }

  // 去重
  const seen = new Set();
  const uniquePosts = [];
  for (const p of allPosts) {
    if (!seen.has(p.postId)) {
      seen.add(p.postId);
      uniquePosts.push(p);
    }
  }

  console.log(`📊 数据准备: ${uniquePosts.length}条独立帖子 (最近${days}天)`);

  if (uniquePosts.length === 0) {
    console.log('ℹ 没有需要分析的数据');
    return;
  }

  // AI分析
  const aiResults = await analyzeAllPosts(uniquePosts, config);

  // 聚合
  const report = aggregateResults(uniquePosts, aiResults, data.bars);
  report.dateRange = `${cutoffStr} ~ ${new Date().toISOString().substring(0, 10)}`;

  // 输出
  if (outputJson) {
    // 不输出posts详情到stdout（太大了）
    const { posts, ...summary } = report;
    console.log(JSON.stringify(summary, null, 2));
  } else {
    printReport(report);
  }

  // 保存完整报告
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(AI_REPORT_FILE, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`💾 完整报告已保存: ${AI_REPORT_FILE}`);
}

main().catch(err => {
  console.error('致命错误:', err);
  process.exit(1);
});
