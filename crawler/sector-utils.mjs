/**
 * 板块名归一化与合并工具
 * 解决 AI 输出「银行」「银行Ⅱ」「银行II」等重复板块的问题
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
};

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

/** 合并同板块的多条记录（按帖子数加权平均温度） */
export function mergeSectors(sectorsObj) {
  if (!sectorsObj || typeof sectorsObj !== 'object') return {};

  const sectorData = {};

  for (const [rawName, data] of Object.entries(sectorsObj)) {
    const name = normalizeSectorName(rawName);
    if (!name) continue;

    if (!sectorData[name]) {
      sectorData[name] = {
        posts: 0, bullish: 0, bearish: 0, fear: 0, greed: 0, neutral: 0,
        weightedTemp: 0, signals: [],
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
    s.weightedTemp += (data.temperature ?? 50) * (posts || 1);
    if (data.topSignal) s.signals.push(data.topSignal);
    if (Array.isArray(data.signals)) s.signals.push(...data.signals);
  }

  const sectors = {};
  for (const [name, s] of Object.entries(sectorData)) {
    sectors[name] = {
      posts: s.posts,
      temperature: s.posts > 0 ? Math.round(s.weightedTemp / s.posts) : 50,
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
