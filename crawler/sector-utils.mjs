/**
 * 板块名归一化与合并工具
 * 解决 AI 输出「银行」「银行Ⅱ」「银行II」等重复板块的问题
 *
 * 温度公式（与 AI prompt / 本地重算共用）：
 *   score = (bullish + greed - bearish - fear) / max(posts, 1)
 *   temperature = clamp(round(50 + score * 50), 0, 100)
 */

export const SECTOR_CANONICAL = {
  '上证指数': '上证指数', '上证': '上证指数', '大盘': '上证指数',
  '创业板指': '创业板指', '创业板': '创业板指',
  '证券': '证券', '券商': '证券', '非银金融': '证券',
  '银行': '银行',
  '酿酒': '酿酒', '酿酒概念': '酿酒',
  '白酒': '白酒', '酒ETF': '白酒',
  '新能源': '新能源',
  '互联网': '互联网', '互联网服务': '互联网',
  '半导体ETF': '半导体ETF', '半导体ETF国联安': '半导体ETF',
  '科技ETF': '科技ETF', '科技ETF华宝': '科技ETF', '科技': '科技ETF',
  '电力': '电力',
  '芯片': '芯片', '国产芯片': '芯片', '芯片ETF': '芯片',
  '半导体': '半导体', '半导体概念': '半导体',
  '医药生物': '医药生物', '医药': '医药生物', '生物医药': '医药生物',
  '医药ETF': '医药生物', '医药ETF广发': '医药生物',
  '医疗器械': '医疗器械', '器械': '医疗器械',
  '医疗服务': '医疗服务', '医疗': '医疗服务',
  '医疗ETF': '医疗服务', '医疗ETF华宝': '医疗服务',
};

/** 股吧代码 → 统计用板块（ETF 并入对应行业板块） */
export const CODE_TO_CANONICAL_SECTOR = {
  BK0727: '医疗服务',
  of512170: '医疗服务',
  '512170': '医疗服务',
  BK1216: '医药生物',
  of159938: '医药生物',
  '159938': '医药生物',
};

/** 参与板块热度 / 市场指数加权的最小帖子数（少于则不算） */
export const MIN_POSTS_FOR_HEAT = 5;
/** @deprecated 使用 MIN_POSTS_FOR_HEAT */
export const MIN_POSTS_FOR_INDEX = MIN_POSTS_FOR_HEAT;

/** 去掉后缀并映射到固定板块名 */
export function normalizeSectorName(name) {
  let cleaned = String(name || '').trim();
  if (!cleaned) return cleaned;

  // 复合名取主板块：银行/非银金融 → 银行
  if (/[/、]/.test(cleaned)) {
    cleaned = cleaned.split(/[/、]/)[0].trim();
  }

  // 去掉括号说明
  cleaned = cleaned.replace(/\s*\([^)]*\)\s*$/g, '').trim();

  // ETF 名称去掉基金公司后缀：半导体ETF国联安 → 半导体ETF
  cleaned = cleaned.replace(/(ETF)[\u4e00-\u9fffA-Za-z]*$/u, '$1').trim();

  // 去掉 Unicode 罗马数字后缀：银行Ⅱ → 银行
  cleaned = cleaned.replace(/[ⅡⅢⅣⅤⅥ]+$/gu, '').trim();

  // 去掉 ASCII 罗马数字后缀：银行II → 银行
  cleaned = cleaned.replace(/\s*(?:II|III|IV|V|VI)+$/i, '').trim();

  // 去掉数字后缀：银行2 → 银行
  cleaned = cleaned.replace(/[2-9]+$/g, '').trim();

  return SECTOR_CANONICAL[cleaned] || cleaned;
}

/** 由股吧 bar 得到统计用板块名（优先代码映射，再走名称归一化） */
export function canonicalSectorFromBar(bar) {
  const code = String(bar?.code || '').trim();
  if (CODE_TO_CANONICAL_SECTOR[code]) return CODE_TO_CANONICAL_SECTOR[code];
  return normalizeSectorName(bar?.barName || bar?.name || code);
}

/**
 * 合并同统计板块的股吧帖子（如 医疗ETF→医疗服务、医药ETF→医药生物）
 * 用于关键词分析前，保证帖子数一起统计
 */
export function mergeBarsByCanonicalSector(bars) {
  const groups = new Map();

  for (const bar of bars || []) {
    const sectorName = canonicalSectorFromBar(bar) || bar.barName || bar.code;
    if (!groups.has(sectorName)) {
      groups.set(sectorName, {
        code: bar.code,
        barName: sectorName,
        posts: [],
        sourceCodes: [],
      });
    }
    const g = groups.get(sectorName);
    // 优先保留 BK 行业代码，便于权重表命中
    if (/^BK/i.test(String(bar.code || ''))) g.code = bar.code;
    g.posts.push(...(bar.posts || []));
    if (bar.code && !g.sourceCodes.includes(bar.code)) g.sourceCodes.push(bar.code);
  }

  return [...groups.values()].map((g) => ({
    code: g.code,
    barName: g.barName,
    posts: g.posts,
    totalPosts: g.posts.length,
    sourceCodes: g.sourceCodes,
  }));
}

/** 由情绪计数计算温度（0–100） */
export function temperatureFromCounts(data) {
  const posts = Math.max(Number(data?.posts) || 0, 1);
  const bullish = Number(data?.bullish) || 0;
  const greed = Number(data?.greed) || 0;
  const bearish = Number(data?.bearish) || 0;
  const fear = Number(data?.fear) || 0;
  const score = (bullish + greed - bearish - fear) / posts;
  return Math.max(0, Math.min(100, Math.round(50 + score * 50)));
}

/** 由全局 distribution 计算市场指数（帖子不足时回退用此） */
export function marketIndexFromDistribution(dist, totalPosts) {
  const t = Math.max(Number(totalPosts) || 0, 1);
  const bullish = Number(dist?.bullish) || 0;
  const greed = Number(dist?.greed) || 0;
  const bearish = Number(dist?.bearish) || 0;
  const fear = Number(dist?.fear) || 0;
  return temperatureFromCounts({ posts: t, bullish, greed, bearish, fear });
}

/**
 * 合并同板块，并按情绪计数重算温度（忽略模型自报 temperature）
 */
export function mergeSectors(sectorsObj) {
  if (!sectorsObj || typeof sectorsObj !== 'object') return {};

  const sectorData = {};

  for (const [rawName, data] of Object.entries(sectorsObj)) {
    const name = normalizeSectorName(rawName);
    if (!name) continue;

    if (!sectorData[name]) {
      sectorData[name] = {
        posts: 0, bullish: 0, bearish: 0, fear: 0, greed: 0, neutral: 0,
        signals: [],
      };
    }

    const s = sectorData[name];
    const posts = data.posts || 0;
    s.posts += posts;
    s.bullish += data.bullish || 0;
    s.bearish += data.bearish || 0;
    s.fear += data.fear || 0;
    s.greed += data.greed || 0;
    s.neutral += data.neutral || 0;
    if (data.topSignal) s.signals.push(data.topSignal);
    if (Array.isArray(data.signals)) s.signals.push(...data.signals);
  }

  const sectors = {};
  for (const [name, s] of Object.entries(sectorData)) {
    sectors[name] = {
      posts: s.posts,
      temperature: temperatureFromCounts(s),
      bullish: s.bullish,
      bearish: s.bearish,
      fear: s.fear,
      greed: s.greed,
      neutral: s.neutral,
      signals: [...new Set(s.signals)].slice(0, 3),
    };
  }

  return sectors;
}

/**
 * 市场指数：各板块温度按 posts 加权；posts < minPosts 不参与指数
 * 若无合格板块，回退到全局 distribution
 */
export function marketIndexFromSectors(sectors, dist, totalPosts, minPosts = MIN_POSTS_FOR_HEAT) {
  let weightSum = 0;
  let weightedTemp = 0;

  for (const s of Object.values(sectors || {})) {
    const posts = s.posts || 0;
    if (posts < minPosts) continue;
    weightedTemp += (s.temperature ?? 50) * posts;
    weightSum += posts;
  }

  if (weightSum > 0) {
    return Math.round(weightedTemp / weightSum);
  }

  return marketIndexFromDistribution(dist, totalPosts);
}

/**
 * 过滤出帖子数足够、可参与热度比较的板块
 * @returns {Array<[string, object]>}
 */
export function heatSectors(sectors, minPosts = MIN_POSTS_FOR_HEAT) {
  return Object.entries(sectors || {}).filter(([, s]) => (s?.posts || 0) >= minPosts);
}

/** 统一等级文案（与日报/关键词对齐） */
export function sentimentLevel(index) {
  const mi = Number(index) || 50;
  if (mi < 20) return { level: '极度恐慌', short: '极度恐慌' };
  if (mi < 30) return { level: '恐慌', short: '恐慌' };
  if (mi < 40) return { level: '偏恐慌', short: '偏恐慌' };
  if (mi < 50) return { level: '略偏恐慌', short: '略偏恐慌' };
  if (mi < 60) return { level: '中性', short: '中性' };
  if (mi < 70) return { level: '略偏贪婪', short: '略偏贪婪' };
  if (mi < 80) return { level: '贪婪', short: '贪婪' };
  return { level: '极度贪婪', short: '极度贪婪' };
}
