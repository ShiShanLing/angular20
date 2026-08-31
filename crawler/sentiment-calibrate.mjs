/**
 * 并排保留 AI 与关键词两套情绪计数（不覆盖）
 */
import { mergeSectors, marketIndexFromSectors } from './sector-utils.mjs';

/** @deprecated 仅保留常量兼容 */
export const DEFAULT_CALIBRATION_THRESHOLD = 20;

/** 从 guba-analyze 报告提取情绪结构 */
export function aggregateFromKeywordReport(kwResult) {
  const dist = { bullish: 0, bearish: 0, fear: 0, greed: 0, neutral: 0 };
  const rawSectors = {};
  let totalPosts = 0;

  for (const bar of kwResult?.bars || []) {
    const posts = bar.postCount || 0;
    totalPosts += posts;
    if (bar.distribution) {
      for (const [k, v] of Object.entries(bar.distribution)) {
        if (Object.prototype.hasOwnProperty.call(dist, k)) dist[k] += v;
      }
    }
    if (posts > 0 && bar.name) {
      rawSectors[bar.name] = {
        posts,
        bullish: bar.distribution?.bullish || 0,
        bearish: bar.distribution?.bearish || 0,
        fear: bar.distribution?.fear || 0,
        greed: bar.distribution?.greed || 0,
        neutral: bar.distribution?.neutral || 0,
        temperature: bar.temperature ?? 50,
        signals: [],
      };
    }
  }

  const sectors = mergeSectors(rawSectors);
  const marketIndex = marketIndexFromSectors(sectors, dist, totalPosts);

  return { totalPosts, distribution: dist, sectors, marketIndex };
}

export function bearFearPct(dist, total) {
  const t = Math.max(Number(total) || 0, 1);
  return Math.round(((dist.bearish + dist.fear) / t) * 1000) / 10;
}

function packSentiment(agg) {
  const mi = agg?.marketIndex ?? null;
  const dist = agg?.distribution || {};
  const total = agg?.totalPosts || 0;
  return {
    marketIndex: mi,
    totalPosts: total,
    distribution: { ...dist },
    sectors: agg?.sectors || {},
    bearFearPct: bearFearPct(dist, total),
  };
}

/** 合并 AI + 关键词，两套指数均保留 */
export function mergeSentimentResults(aiAgg, kwResult) {
  const kwAgg = kwResult ? aggregateFromKeywordReport(kwResult) : null;
  const kwMi = kwResult?.marketIndex?.index ?? kwAgg?.marketIndex ?? null;

  const aiSentiment = packSentiment(aiAgg);
  const keywordSentiment = kwAgg ? {
    marketIndex: kwMi,
    totalPosts: kwAgg.totalPosts,
    distribution: kwAgg.distribution,
    sectors: kwAgg.sectors,
    bearFearPct: bearFearPct(kwAgg.distribution, kwAgg.totalPosts),
    level: kwResult?.marketIndex?.level ?? null,
  } : null;
  
  return {
    ...aiAgg,
    aiSentiment,
    keywordSentiment,
    sentimentSource: 'dual',
    calibrated: false,
  };
}

/** 仅关键词模式（跳过 Qoder 批次） */
export function buildKeywordOnlyResult(kwResult, extra = {}) {
  const kwAgg = aggregateFromKeywordReport(kwResult);
  const kwMi = kwResult?.marketIndex?.index ?? kwAgg.marketIndex;

  const keywordSentiment = {
    marketIndex: kwMi,
    totalPosts: kwAgg.totalPosts,
    distribution: kwAgg.distribution,
    sectors: kwAgg.sectors,
    bearFearPct: bearFearPct(kwAgg.distribution, kwAgg.totalPosts),
    level: kwResult?.marketIndex?.level ?? null,
  };

  return {
    ...extra,
    marketIndex: kwMi,
    totalPosts: kwAgg.totalPosts,
    distribution: kwAgg.distribution,
    sectors: kwAgg.sectors,
    aiSentiment: null,
    keywordSentiment,
    sentimentSource: 'keyword',
    calibrated: false,
  };
}

/** @deprecated 不再覆盖，改为 mergeSentimentResults */
export function calibrateSentimentResult(aiAgg, kwResult) {
  return mergeSentimentResults(aiAgg, kwResult);
}

export function shouldCalibrateSentiment() {
  return false;
}
