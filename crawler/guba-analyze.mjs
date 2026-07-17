#!/usr/bin/env node
/**
 * 东方财富股吧 - 市场情绪分析模块
 *
 * 用法:
 *   node crawler/guba-analyze.mjs                    # 关键词分析（默认，快速免费）
 *   node crawler/guba-analyze.mjs --ai               # AI分析（需配置API Key）
 *   node crawler/guba-analyze.mjs --compare          # 对比模式：关键词+AI并排
 *   node crawler/guba-analyze.mjs --crawl            # 先抓取再分析
 *   node crawler/guba-analyze.mjs --crawl --pages=10 # 抓更多页
 *   node crawler/guba-analyze.mjs --json             # 输出JSON格式（供前端调用）
 *   node crawler/guba-analyze.mjs --days=3           # 分析最近N天数据
 *
 * 分析模式:
 *   关键词(默认) - 快速免费，适合趋势对比，绝对值有偏差
 *   AI(--ai)     - 准确度高，需LLM API Key，每次约0.05元
 *   对比(--compare) - 两种方案同时运行，直观对比差异
 *
 * 分析内容:
 *   1. 帖子情绪分类（看多/看空/恐慌/贪婪/中性）
 *   2. 板块情绪评分 + 跨板块对比
 *   3. 热门话题/关键词提取
 *   4. 市场综合情绪指数
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const DATA_FILE = join(DATA_DIR, 'guba_posts.json');
const REPORT_FILE = join(DATA_DIR, 'guba_analysis.json');

// ============================================================
// 情绪词典 - 中国股市专用
// ============================================================

const DICTIONARY = {
  // === 看多/乐观 ===
  bullish: {
    weight: 1,
    words: [
      '抄底', '反弹', '看多', '看涨', '起飞', '大涨', '暴涨', '牛市', '底部', '见底',
      '机会', '利好', '加仓', '满仓', '金叉', '突破', '新高', '强势', '拉升', '起爆',
      '大牛', '翻红', '红盘', '大涨', '上攻', '启动', '爆发', '做多', '建仓', '抄底',
      '护盘', '撑住', '止跌', '企稳', '回踩', '蓄力', '放量', '主力', '吸筹', '洗盘',
      '慢牛', '长牛', '低估', '价值', '洼地', '低估', '安全', '底部区域', '底部放量',
      '稳了', '必涨', '翻倍', '大肉', '上车', '冲冲冲', '梭哈', '牛', '涨',
    ],
  },

  // === 看空/悲观 ===
  bearish: {
    weight: 1,
    words: [
      '割肉', '清仓', '崩盘', '暴跌', '熊市', '套牢', '跌停', '大跌', '利空', '减仓',
      '空仓', '死叉', '破位', '新低', '弱势', '砸盘', '跳水', '血崩', '暴跌', '做空',
      '阴跌', '下跌', '杀跌', '出逃', '跑路', '站岗', '高位', '套人', '骗', '割韭菜',
      '亏损', '亏钱', '血亏', '巨亏', '爆仓', '完了', '完蛋', '绝望', '末日', '惨',
      '凉凉', 'GG', 'gg', '药丸', '完了', '跑路', '清仓走人', '见顶', '顶部',
      '诱多', '出货', '派发', '缩量', '无量', '阴跌', '漫漫', '深不见底',
    ],
  },

  // === 恐慌/恐惧（极端看空）===
  fear: {
    weight: 1.8,
    words: [
      '恐慌', '恐惧', '踩踏', '熔断', '千股跌停', '股灾', '黑天鹅', '暴跌',
      '血洗', '崩了', '完了', '跑吧', '别接刀', '飞刀', '接飞刀', '送命',
      '末日', '灾难', '浩劫', '惨烈', '血流成河', '尸横遍野', '哀嚎',
      '绝望', '麻木', '麻木了', '无底洞', '深不见底',
    ],
  },

  // === 贪婪/狂热（极端看多）===
  greed: {
    weight: 1.8,
    words: [
      '梭哈', '满仓干', '全仓', '重仓', 'all in', 'All in', 'ALL IN',
      '必涨', '翻倍', '十倍股', '百倍股', '暴富', '财务自由', '发财',
      '稳赚', '稳了', '冲冲冲', '不卖', '死拿', '拿住', '钻石手',
      'to the moon', '火箭', '起飞', '一飞冲天',
    ],
  },

  // === 质疑/讽刺（通常暗示看空）===
  sarcastic: {
    weight: 0.6,
    words: [
      '呵呵', '哈哈', '笑死', '果然', '又是', '又是这样', '一如既往',
      '果然如此', '每次都', '永远', '又来了', '老样子', '习惯就好',
      '绿油油', '韭菜', '被割', '又被割', '套路',
    ],
  },
};

// ============================================================
// 金融关键词提取词典（用于热门话题）
// ============================================================

const FINANCIAL_TERMS = [
  // 指数/大盘
  '上证指数', '大盘', '指数', '创业板', '科创板', '北证', '沪深300', '中证500',
  '年线', '半年线', '均线', '支撑位', '压力位', '缺口', '3000点', '3500点', '4000点',
  // 操作
  '加仓', '减仓', '满仓', '空仓', '半仓', '抄底', '割肉', '止损', '止盈', '做T',
  '高抛低吸', '波段', '短线', '中线', '长线',
  // 板块/概念
  '银行', '证券', '保险', '新能源', '光伏', '锂电', '芯片', '半导体', 'AI', '人工智能',
  '机器人', '低空经济', '无人驾驶', '医药', '白酒', '消费', '地产', '房地产',
  '科技', '军工', '稀土', '有色', '煤炭', '钢铁', '电力',
  // 资金
  '主力', '庄家', '量化', '外资', '北向', '融资', '基金', '散户', '大户', '游资',
  '国家队', '汇金', '证金', '社保', '险资',
  // 事件
  '降息', '降准', '加息', 'LPR', 'MLF', '逆回购', '国常会', '政治局',
  '财报', '业绩', '分红', '除权', '解禁', '减持', '增持', '回购',
  // 技术面
  'K线', 'MACD', 'KDJ', 'RSI', '布林', '量价', '放量', '缩量', '涨停', '跌停',
  '龙虎榜', '换手率', '市盈率', '市净率',
  // 情绪
  '恐慌', '贪婪', '犹豫', '观望', '躁动', '狂热', '绝望',
];

// ============================================================
// 停用词
// ============================================================

const STOP_WORDS = new Set([
  '的', '了', '是', '在', '我', '有', '和', '就', '不', '人', '都', '一', '一个',
  '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '没有', '看', '好',
  '自己', '这', '他', '她', '吗', '啊', '呢', '吧', '那', '又', '被', '让', '把',
  '什么', '怎么', '这个', '那个', '还', '可以', '已经', '还是', '或者', '而且',
  '但是', '因为', '所以', '如果', '虽然', '但', '而', '对', '从', '以', '与',
  '个', '们', '多', '少', '大', '小', '来', '去', '过', '没', '做', '能',
  '真的', '感觉', '觉得', '知道', '应该', '可能', '比较', '一下', '现在',
  '今天', '明天', '昨天', '每天', '早上', '下午', '晚上',
  '就是', '不是', '只是', '不过', '只有', '只要',
  '哈哈', '呵呵', '啊啊', '嗯嗯',
]);

// ============================================================
// 分析引擎
// ============================================================

/** 分析单个帖子的情绪 */
function analyzePostSentiment(post) {
  const text = `${post.title} ${post.content || ''}`.toLowerCase();

  const scores = { bullish: 0, bearish: 0, fear: 0, greed: 0, sarcastic: 0 };
  const matchedWords = { bullish: [], bearish: [], fear: [], greed: [], sarcastic: [] };

  for (const [category, config] of Object.entries(DICTIONARY)) {
    for (const word of config.words) {
      if (text.includes(word.toLowerCase())) {
        scores[category] += config.weight;
        matchedWords[category].push(word);
      }
    }
  }

  // 去重（同一类别同一词只算一次）
  for (const cat of Object.keys(matchedWords)) {
    matchedWords[cat] = [...new Set(matchedWords[cat])];
    scores[cat] = matchedWords[cat].length * DICTIONARY[cat].weight;
  }

  // 综合得分：-1(极度看空) ~ +1(极度看多)
  const positive = scores.bullish + scores.greed;
  const negative = scores.bearish + scores.fear + scores.sarcastic;
  const total = positive + negative;
  const rawScore = total > 0 ? (positive - negative) / total : 0;

  // 互动加权：高点击/高评论的帖子影响力更大
  const engagementMultiplier = Math.min(
    1 + Math.log10(1 + (post.clicks || 0)) * 0.3 + Math.log10(1 + (post.comments || 0)) * 0.5,
    3.0  // 最多加权3倍
  );

  // 分类标签
  let label = 'neutral';
  if (scores.fear > 2) label = 'fear';
  else if (scores.greed > 2) label = 'greed';
  else if (rawScore > 0.3) label = 'bullish';
  else if (rawScore < -0.3) label = 'bearish';

  return {
    postId: post.postId,
    title: post.title,
    label,
    score: rawScore,
    weightedScore: rawScore * engagementMultiplier,
    engagement: engagementMultiplier,
    clicks: post.clicks || 0,
    comments: post.comments || 0,
    publishTime: post.publishTime,
    bullishWords: matchedWords.bullish,
    bearishWords: matchedWords.bearish,
    fearWords: matchedWords.fear,
    greedWords: matchedWords.greed,
    sentimentDetail: scores,
  };
}

/** 分析一个板块的整体情绪 */
function analyzeBar(bar, analyzedPosts) {
  if (analyzedPosts.length === 0) {
    return {
      code: bar.code,
      name: bar.barName,
      postCount: 0,
      sentiment: null,
    };
  }

  // 情绪分布
  const distribution = { bullish: 0, bearish: 0, fear: 0, greed: 0, neutral: 0 };
  for (const p of analyzedPosts) {
    distribution[p.label] = (distribution[p.label] || 0) + 1;
  }

  // 加权情绪得分
  const totalWeighted = analyzedPosts.reduce((sum, p) => sum + p.weightedScore, 0);
  const totalEngagement = analyzedPosts.reduce((sum, p) => sum + p.engagement, 0);
  const avgScore = totalWeighted / totalEngagement;

  // 活跃度指标
  const totalClicks = analyzedPosts.reduce((sum, p) => sum + p.clicks, 0);
  const totalComments = analyzedPosts.reduce((sum, p) => sum + p.comments, 0);
  const avgClicks = totalClicks / analyzedPosts.length;
  const avgComments = totalComments / analyzedPosts.length;

  // 恐慌贪婪比
  const fearGreedRatio = distribution.greed + distribution.bullish > 0
    ? (distribution.fear + distribution.bearish) / (distribution.greed + distribution.bullish)
    : Infinity;

  // 情绪温度 0~100 (50=中性, <30=恐慌, >70=贪婪)
  const temperature = Math.round(50 + avgScore * 50);

  return {
    code: bar.code,
    name: bar.barName,
    postCount: analyzedPosts.length,
    temperature,           // 0~100 情绪温度
    avgScore: Math.round(avgScore * 1000) / 1000,
    distribution,
    totalClicks,
    totalComments,
    avgClicks: Math.round(avgClicks * 10) / 10,
    avgComments: Math.round(avgComments * 10) / 10,
    fearGreedRatio: fearGreedRatio === Infinity ? 'N/A' : Math.round(fearGreedRatio * 100) / 100,
    // 代表性帖子
    topBullish: analyzedPosts
      .filter(p => p.label === 'bullish' || p.label === 'greed')
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 2)
      .map(p => ({ title: p.title, clicks: p.clicks, words: [...p.bullishWords, ...p.greedWords] })),
    topBearish: analyzedPosts
      .filter(p => p.label === 'bearish' || p.label === 'fear')
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 2)
      .map(p => ({ title: p.title, clicks: p.clicks, words: [...p.bearishWords, ...p.fearWords] })),
  };
}

/** 提取热门关键词 */
function extractHotTopics(allPosts) {
  const termFreq = new Map();

  for (const post of allPosts) {
    const text = `${post.title} ${post.content || ''}`;
    for (const term of FINANCIAL_TERMS) {
      if (text.includes(term)) {
        const entry = termFreq.get(term) || { count: 0, clicks: 0, posts: [] };
        entry.count++;
        entry.clicks += post.clicks || 0;
        if (entry.posts.length < 2) {
          entry.posts.push({ title: post.title, clicks: post.clicks || 0 });
        }
        termFreq.set(term, entry);
      }
    }
  }

  // 按频次排序，返回前20
  return [...termFreq.entries()]
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 20)
    .map(([term, data]) => ({
      term,
      count: data.count,
      totalClicks: data.clicks,
      hotScore: Math.round(data.count + Math.log10(1 + data.clicks) * 10),
      samplePosts: data.posts,
    }));
}

/** 计算市场综合情绪指数 */
function calculateMarketIndex(barResults) {
  // 只计算有数据的板块
  const validBars = barResults.filter(b => b.postCount > 0 && b.temperature !== null);
  if (validBars.length === 0) return null;

  // 权重配置：指数权重最高
  const weights = {
    'sh000001': 3.0,   // 上证指数 - 最重要的市场指标
    'sz399006': 2.5,   // 创业板指 - 成长股代表
    'BK0473': 2.0,     // 证券 - 散户情绪晴雨表
    'BK0475': 1.5,     // 银行 - 防御板块
    'BK0477': 1.0,     // 酿酒 - 消费
    'BK0493': 1.0,     // 新能源 - 赛道
    'BK0447': 1.0,     // 互联网 - 科技
  };

  let totalWeight = 0;
  let weightedSum = 0;
  let totalPosts = 0;
  let totalClicks = 0;
  let totalComments = 0;

  for (const bar of validBars) {
    const w = weights[bar.code] || 1.0;
    weightedSum += bar.temperature * w;
    totalWeight += w;
    totalPosts += bar.postCount;
    totalClicks += bar.totalClicks;
    totalComments += bar.totalComments;
  }

  const index = Math.round(weightedSum / totalWeight);

  // 情绪等级
  let level, emoji, description;
  if (index >= 75) {
    level = '极度贪婪'; emoji = '🔴🔴🔴'; description = '市场极度乐观，注意过热风险';
  } else if (index >= 60) {
    level = '贪婪'; emoji = '🟠'; description = '市场偏多，情绪积极';
  } else if (index >= 45) {
    level = '中性'; emoji = '🟡'; description = '市场情绪平稳，多空均衡';
  } else if (index >= 30) {
    level = '恐惧'; emoji = '🟢'; description = '市场偏空，情绪谨慎（可能是机会）';
  } else {
    level = '极度恐惧'; emoji = '🟢🟢🟢'; description = '市场极度悲观（历史上往往是底部区域）';
  }

  // 板块分化度（标准差）
  const temps = validBars.map(b => b.temperature);
  const mean = temps.reduce((a, b) => a + b, 0) / temps.length;
  const variance = temps.reduce((sum, t) => sum + Math.pow(t - mean, 2), 0) / temps.length;
  const divergence = Math.round(Math.sqrt(variance));

  return {
    index,          // 0~100 市场情绪指数
    level,          // 情绪等级
    emoji,
    description,
    divergence,     // 板块分化度（越高越分化）
    divergenceLabel: divergence > 20 ? '严重分化' : divergence > 10 ? '轻度分化' : '基本一致',
    totalPosts,
    totalClicks,
    totalComments,
    validBarCount: validBars.length,
  };
}

// ============================================================
// 报告生成
// ============================================================

function printReport(marketIndex, barResults, hotTopics, allPostsCount) {
  console.log('\n' + '='.repeat(60));
  console.log('  📊 市场情绪分析报告');
  console.log('  📅 ' + new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
  console.log('='.repeat(60));

  // 1. 市场综合指数
  if (marketIndex) {
    console.log(`\n🎯 市场情绪指数: ${marketIndex.index}/100  ${marketIndex.emoji}`);
    console.log(`   等级: ${marketIndex.level}`);
    console.log(`   解读: ${marketIndex.description}`);
    console.log(`   板块分化: ${marketIndex.divergenceLabel}(${marketIndex.divergence})`);
    console.log(`   数据量: ${marketIndex.totalPosts}条帖子, ${marketIndex.totalClicks}次点击`);
  }

  // 2. 各板块情绪
  console.log(`\n${'─'.repeat(60)}`);
  console.log('📈 板块情绪对比:');
  console.log(`${'─'.repeat(60)}`);

  const sortedBars = barResults
    .filter(b => b.postCount > 0)
    .sort((a, b) => b.temperature - a.temperature);

  for (const bar of sortedBars) {
    const tempBar = getTempBar(bar.temperature);
    const d = bar.distribution;
    console.log(`\n  ${bar.name} (${bar.code})  温度:${bar.temperature}° ${tempBar}`);
    console.log(`    帖子:${bar.postCount} | 点击:${bar.totalClicks} | 评论:${bar.totalComments}`);
    console.log(`    看多:${d.bullish} 贪婪:${d.greed} 中性:${d.neutral} 看空:${d.bearish} 恐慌:${d.fear}`);

    if (bar.topBullish.length > 0) {
      console.log(`    🟢 看多代表: ${bar.topBullish[0].title.substring(0, 40)} [${bar.topBullish[0].clicks}点击]`);
    }
    if (bar.topBearish.length > 0) {
      console.log(`    🔴 看空代表: ${bar.topBearish[0].title.substring(0, 40)} [${bar.topBearish[0].clicks}点击]`);
    }
  }

  // 无数据的板块
  const emptyBars = barResults.filter(b => b.postCount === 0);
  if (emptyBars.length > 0) {
    console.log(`\n  ℹ 无数据板块: ${emptyBars.map(b => b.name).join(', ')}`);
  }

  // 3. 热门话题
  console.log(`\n${'─'.repeat(60)}`);
  console.log('🔥 热门话题 Top 15:');
  console.log(`${'─'.repeat(60)}`);
  for (let i = 0; i < Math.min(15, hotTopics.length); i++) {
    const t = hotTopics[i];
    const bar = '█'.repeat(Math.min(Math.round(t.hotScore / 2), 30));
    console.log(`  ${String(i + 1).padStart(2)}. ${t.term.padEnd(8)} ${String(t.count).padStart(4)}次提及  ${bar}`);
  }

  // 4. 情绪极端帖子
  console.log(`\n${'─'.repeat(60)}`);
  console.log('⚡ 情绪最强帖子:');
  console.log(`${'─'.repeat(60)}`);

  const allAnalyzed = barResults.flatMap(b => b._analyzedPosts || []);
  const extremeBullish = allAnalyzed
    .filter(p => p.label === 'greed' || p.label === 'bullish')
    .sort((a, b) => Math.abs(b.weightedScore) - Math.abs(a.weightedScore))
    .slice(0, 3);
  const extremeBearish = allAnalyzed
    .filter(p => p.label === 'fear' || p.label === 'bearish')
    .sort((a, b) => Math.abs(b.weightedScore) - Math.abs(a.weightedScore))
    .slice(0, 3);

  if (extremeBullish.length) {
    console.log('\n  🟢 最强看多:');
    for (const p of extremeBullish) {
      const words = [...p.bullishWords, ...p.greedWords].join(',');
      console.log(`    [${p.clicks}点击] ${p.title.substring(0, 50)}`);
      console.log(`      关键词: ${words || '-'}`);
    }
  }
  if (extremeBearish.length) {
    console.log('\n  🔴 最强看空:');
    for (const p of extremeBearish) {
      const words = [...p.bearishWords, ...p.fearWords].join(',');
      console.log(`    [${p.clicks}点击] ${p.title.substring(0, 50)}`);
      console.log(`      关键词: ${words || '-'}`);
    }
  }

  // 5. 投资建议提示
  console.log(`\n${'─'.repeat(60)}`);
  console.log('💡 情绪信号提示:');
  console.log(`${'─'.repeat(60)}`);

  if (marketIndex) {
    const signals = [];
    if (marketIndex.index <= 25) signals.push('⚠ 市场极度恐慌 - 历史上往往是阶段性底部区域');
    if (marketIndex.index >= 75) signals.push('⚠ 市场极度贪婪 - 注意追高风险');
    if (marketIndex.divergence > 20) signals.push('⚠ 板块严重分化 - 结构性行情，注意选对方向');
    if (marketIndex.divergence <= 5) signals.push('ℹ 板块高度一致 - 可能面临方向选择');

    // 检查是否有板块温度极端
    for (const bar of sortedBars) {
      if (bar.temperature <= 20) signals.push(`⚠ ${bar.name}极度悲观 - 可能是超卖信号`);
      if (bar.temperature >= 80) signals.push(`⚠ ${bar.name}极度乐观 - 短期可能回调`);
    }

    if (signals.length === 0) signals.push('ℹ 市场情绪处于正常区间，无明显极端信号');
    for (const s of signals) console.log(`  ${s}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('  ⚠ 以上分析仅基于股吧帖子情绪，不构成投资建议');
  console.log('='.repeat(60) + '\n');
}

function getTempBar(temp) {
  if (temp >= 75) return '🔴🔴🔴 极度贪婪';
  if (temp >= 60) return '🟠🟠 偏多';
  if (temp >= 45) return '🟡 中性';
  if (temp >= 30) return '🟢🟢 偏空';
  return '🟢🟢🟢 极度恐慌';
}

// ============================================================
// 对比报告
// ============================================================

function printComparison(kwResult, aiResult) {
  console.log('\n' + '='.repeat(65));
  console.log('  📊 关键词 vs AI 分析对比报告');
  console.log('  📅 ' + new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' }));
  console.log('='.repeat(65));

  const kwMI = kwResult.marketIndex;
  const aiMI = aiResult.marketIndex;

  // 核心指标对比
  console.log('\n🎯 市场情绪指数:');
  console.log(`  关键词方案: ${kwMI.index}/100  ${kwMI.level}  ${kwMI.emoji || ''}`);
  console.log(`  AI分析方案: ${aiMI.index}/100  ${aiMI.level}  ${aiMI.emoji || ''}`);
  console.log(`  差异: ${Math.abs(kwMI.index - aiMI.index)}点 ${kwMI.index > aiMI.index ? '(关键词偏高)' : '(AI偏高)'}`);

  // 全局情绪分布对比
  const kwDist = kwResult.bars.reduce((acc, b) => {
    if (!b.distribution) return acc;
    for (const [k, v] of Object.entries(b.distribution)) acc[k] = (acc[k] || 0) + v;
    return acc;
  }, {});
  const kwTotal = Object.values(kwDist).reduce((a, b) => a + b, 0);

  const aiDist = aiResult.globalDistribution || {};
  const aiTotal = Object.values(aiDist).reduce((a, b) => a + b, 0);

  console.log('\n📊 全局情绪分布对比:');
  console.log('  情绪     | 关键词          | AI分析          | 差异');
  console.log('  ---------|-----------------|-----------------|--------');
  for (const cat of ['bullish', 'greed', 'neutral', 'bearish', 'fear']) {
    const labels = { bullish: '看多', greed: '贪婪', neutral: '中性', bearish: '看空', fear: '恐慌' };
    const kwVal = kwDist[cat] || 0;
    const aiVal = aiDist[cat] || 0;
    const kwPct = kwTotal > 0 ? (kwVal / kwTotal * 100).toFixed(1) : '0.0';
    const aiPct = aiTotal > 0 ? (aiVal / aiTotal * 100).toFixed(1) : '0.0';
    const diff = (parseFloat(aiPct) - parseFloat(kwPct)).toFixed(1);
    const diffStr = diff > 0 ? `+${diff}%` : `${diff}%`;
    console.log(`  ${labels[cat].padEnd(6)} | ${String(kwVal).padStart(4)} (${kwPct.padStart(5)}%) | ${String(aiVal).padStart(4)} (${aiPct.padStart(5)}%) | ${diffStr}`);
  }

  // 看多看空合计
  const kwBull = ((kwDist.bullish || 0) + (kwDist.greed || 0)) / kwTotal * 100;
  const kwBear = ((kwDist.bearish || 0) + (kwDist.fear || 0)) / kwTotal * 100;
  const aiBull = ((aiDist.bullish || 0) + (aiDist.greed || 0)) / aiTotal * 100;
  const aiBear = ((aiDist.bearish || 0) + (aiDist.fear || 0)) / aiTotal * 100;
  console.log('  ---------|-----------------|-----------------|--------');
  console.log(`  看多合计 | ${kwBull.toFixed(1).padStart(13)}% | ${aiBull.toFixed(1).padStart(13)}% | ${(aiBull - kwBull).toFixed(1)}%`);
  console.log(`  看空合计 | ${kwBear.toFixed(1).padStart(13)}% | ${aiBear.toFixed(1).padStart(13)}% | ${(aiBear - kwBear).toFixed(1)}%`);

  // 板块温度对比
  console.log('\n📈 板块温度对比:');
  console.log('  板块         | 关键词 | AI分析 | 差异  | 说明');
  console.log('  -------------|--------|--------|-------|--------');

  const aiBarMap = new Map((aiResult.bars || []).map(b => [b.code, b]));
  for (const kwBar of kwResult.bars) {
    if (kwBar.postCount === 0) continue;
    const aiBar = aiBarMap.get(kwBar.code);
    if (!aiBar || aiBar.postCount === 0) continue;
    const diff = aiBar.temperature - kwBar.temperature;
    let note = '';
    if (diff < -15) note = 'AI更悲观';
    else if (diff > 15) note = 'AI更乐观';
    else note = '基本一致';
    console.log(`  ${kwBar.name.padEnd(10)} | ${String(kwBar.temperature).padStart(4)}°  | ${String(aiBar.temperature).padStart(4)}°  | ${diff > 0 ? '+' : ''}${diff}° | ${note}`);
  }

  // 总结
  console.log('\n💡 对比总结:');
  const indexDiff = kwMI.index - aiMI.index;
  if (indexDiff > 15) {
    console.log(`  ⚠ 关键词方案比AI高${indexDiff}点，可能高估了市场乐观度`);
    console.log('  📌 关键词方案把大量讽刺/反语/混合情绪帖子误判为“中性”');
    console.log('  📌 AI方案能识别语境，判断更准确');
  } else if (indexDiff < -15) {
    console.log(`  ⚠ AI方案比关键词高${Math.abs(indexDiff)}点`);
  } else {
    console.log('  ℹ 两种方案结果接近，市场情绪较明确');
  }
  console.log('\n  📌 建议: 用AI分析做决策参考，用关键词分析做日常趋势跟踪');
  console.log('='.repeat(65) + '\n');
}

// ============================================================
// 主流程
// ============================================================

async function main() {
  const args = process.argv.slice(2);
  const outputJson = args.includes('--json');
  const doCrawl = args.includes('--crawl');
  const useAI = args.includes('--ai');
  const useCompare = args.includes('--compare');
  const daysArg = args.find(a => a.startsWith('--days='));
  const days = daysArg ? parseInt(daysArg.split('=')[1]) : 1;
  const pagesArg = args.find(a => a.startsWith('--pages='));
  const pages = pagesArg ? pagesArg.split('=')[1] : '5';

  // --ai 或 --compare 模式：调用AI分析
  if (useAI || useCompare) {
    const aiScript = join(__dirname, 'guba-ai.mjs');
    const aiArgs = [];
    if (doCrawl) aiArgs.push('--crawl');
    if (daysArg) aiArgs.push(daysArg);
    if (pagesArg) aiArgs.push(pagesArg);
    if (outputJson && !useCompare) aiArgs.push('--json');

    if (useCompare) {
      // 对比模式：先跑关键词，再跑AI，最后输出对比
      console.log('📊 对比模式：同时运行关键词分析和AI分析\n');

      // 1) 先抓取数据
      if (doCrawl) {
        console.log('🔄 先抓取最新数据...\n');
        try {
          execSync(
            `node ${join(__dirname, 'guba.mjs')} --config ${join(__dirname, 'guba_targets.json')} --today --pages=${pages}`,
            { stdio: 'inherit' }
          );
        } catch (err) { console.error('抓取失败:', err.message); }
      }

      // 2) 运行关键词分析（静默，获取JSON）
      console.log('\n🔤 运行关键词分析...');
      const kwScript = join(__dirname, 'guba-analyze.mjs');
      let kwResult;
      try {
        const kwOutput = execSync(`node ${kwScript} --json --days=${days}`, { encoding: 'utf-8' });
        kwResult = JSON.parse(kwOutput);
      } catch (err) {
        console.error('关键词分析失败:', err.message);
      }

      // 3) 运行AI分析
      console.log('\n🤖 运行AI分析...');
      try {
        execSync(`node ${aiScript} ${aiArgs.join(' ')}`, { stdio: 'inherit' });
      } catch (err) {
        console.error('AI分析失败:', err.message);
      }

      // 4) 读取AI结果并输出对比
      const aiReportFile = join(DATA_DIR, 'guba_ai_analysis.json');
      if (kwResult && existsSync(aiReportFile)) {
        const aiResult = JSON.parse(readFileSync(aiReportFile, 'utf-8'));
        printComparison(kwResult, aiResult);
      }
      return;
    } else {
      // 纯AI模式
      try {
        execSync(`node ${aiScript} ${aiArgs.join(' ')}`, { stdio: 'inherit' });
      } catch (err) {
        console.error('AI分析失败:', err.message);
      }
      return;
    }
  }

  // 先抓取数据
  if (doCrawl) {
    console.log('🔄 先抓取最新数据...\n');
    try {
      execSync(
        `node ${join(__dirname, 'guba.mjs')} --config ${join(__dirname, 'guba_targets.json')} --today --pages=${pages}`,
        { stdio: 'inherit' }
      );
    } catch (err) {
      console.error('抓取数据失败:', err.message);
    }
  }

  // 读取数据
  if (!existsSync(DATA_FILE)) {
    console.error('❌ 无数据文件，请先运行爬虫: node crawler/guba.mjs --config crawler/guba_targets.json --today');
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
  if (!data.bars || data.bars.length === 0) {
    console.error('❌ 数据为空');
    process.exit(1);
  }

  // 过滤最近N天数据
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  const cutoffStr = cutoff.toISOString().substring(0, 10);

  // 分析每个板块
  const barResults = [];
  let allPostsForTopics = [];

  for (const bar of data.bars) {
    // 过滤时间范围
    const filteredPosts = bar.posts.filter(p => {
      if (!p.publishTime) return false;
      return p.publishTime.substring(0, 10) >= cutoffStr;
    });

    // 分析每个帖子
    const analyzedPosts = filteredPosts.map(analyzePostSentiment);
    allPostsForTopics.push(...filteredPosts);

    const result = analyzeBar(bar, analyzedPosts);
    result._analyzedPosts = analyzedPosts; // 临时存储用于报告
    barResults.push(result);
  }

  // 热门话题
  const hotTopics = extractHotTopics(allPostsForTopics);

  // 市场综合指数
  const marketIndex = calculateMarketIndex(barResults);

  // 输出
  if (outputJson) {
    // JSON模式（供前端或其他程序调用）
    const cleanResults = barResults.map(r => {
      const { _analyzedPosts, ...rest } = r;
      return rest;
    });
    const report = {
      generatedAt: new Date().toISOString(),
      dateRange: `${cutoffStr} ~ ${new Date().toISOString().substring(0, 10)}`,
      marketIndex,
      bars: cleanResults,
      hotTopics,
    };
    console.log(JSON.stringify(report, null, 2));

    // 同时保存到文件
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf-8');
  } else {
    // 终端报告模式
    printReport(marketIndex, barResults, hotTopics, allPostsForTopics.length);

    // 保存JSON报告
    const cleanResults = barResults.map(r => {
      const { _analyzedPosts, ...rest } = r;
      return rest;
    });
    const report = {
      generatedAt: new Date().toISOString(),
      dateRange: `${cutoffStr} ~ ${new Date().toISOString().substring(0, 10)}`,
      marketIndex,
      bars: cleanResults,
      hotTopics,
    };
    if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
    writeFileSync(REPORT_FILE, JSON.stringify(report, null, 2), 'utf-8');
    console.log(`💾 报告已保存: ${REPORT_FILE}`);
  }
}

main().catch(err => {
  console.error('致命错误:', err);
  process.exit(1);
});
