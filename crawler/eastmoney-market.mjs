/**
 * 东方财富行情工具（非官方 push2 网页接口）
 * 供市场 Agent 使用；新闻抓取与 run-analysis 共用。
 */
import { spawnSync } from 'child_process';
import { getBjToday } from './time-window.mjs';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const REFERER = 'https://quote.eastmoney.com/';
const UT = 'bd1d9ddb04089700cf9c27f6f7426281';
const QUOTE_HOSTS = [
  'https://82.push2.eastmoney.com',
  'https://39.push2.eastmoney.com',
  'https://48.push2.eastmoney.com',
  'https://push2delay.eastmoney.com',
  'https://push2.eastmoney.com',
];

function expandQuoteUrls(url) {
  const m = String(url).match(/^https:\/\/(?:\d+\.)?push2(?:delay)?\.eastmoney\.com(\/.*)$/i);
  if (!m) return [url];
  return QUOTE_HOSTS.map(host => `${host}${m[1]}`);
}

export function httpGetText(url, timeoutSec = 15) {
  for (const candidate of expandQuoteUrls(url)) {
    const result = spawnSync('curl', [
      '-sL',
      '-A', UA,
      '-H', `Referer: ${REFERER}`,
      '--max-time', String(timeoutSec),
      candidate,
    ], { encoding: 'utf-8', maxBuffer: 8 * 1024 * 1024 });
    if (result.status === 0 && result.stdout) return result.stdout;
  }
  return '';
}

function num(v) {
  if (v === '-' || v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function yi(amount) {
  const n = num(amount);
  if (n == null) return null;
  return Math.round((n / 1e8) * 100) / 100;
}

function parseJson(raw) {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

function asRows(diff) {
  if (!diff) return [];
  return Array.isArray(diff) ? diff : Object.values(diff);
}

const INDEX_SPECS = [
  { name: '上证指数', secid: '1.000001' },
  { name: '深证成指', secid: '0.399001' },
  { name: '创业板指', secid: '0.399006' },
  { name: '沪深300', secid: '1.000300' },
];

/** 主要指数：现价 / 涨跌幅 / 成交额(亿) / 涨跌家数 */
export function getIndices() {
  const secids = INDEX_SPECS.map(s => s.secid).join(',');
  const url = `https://push2.eastmoney.com/api/qt/ulist.np/get?fltt=2&invt=2&secids=${secids}&fields=f2,f3,f4,f6,f12,f13,f14,f104,f105,f106,f152&ut=${UT}`;
  const rows = asRows(parseJson(httpGetText(url))?.data?.diff);
  const bySecid = new Map();
  const byName = new Map();
  for (const row of rows) {
    if (row.f12 != null && row.f13 != null) bySecid.set(`${row.f13}.${row.f12}`, row);
    if (row.f14) byName.set(row.f14, row);
  }

  return INDEX_SPECS.map((spec, i) => {
    const row = bySecid.get(spec.secid) || byName.get(spec.name) || rows[i] || {};
    const pct = num(row.f3);
    return {
      name: row.f14 || spec.name,
      code: spec.secid,
      price: num(row.f2),
      change: num(row.f4),
      pct,
      amountYi: yi(row.f6),
      upCount: num(row.f104),
      downCount: num(row.f105),
      flatCount: num(row.f106),
      direction: pct == null ? '未知' : pct > 0.05 ? '涨' : pct < -0.05 ? '跌' : '震荡',
    };
  });
}

function mapBoard(row) {
  return {
    code: row.f12 || '',
    name: row.f14 || '',
    price: num(row.f2),
    pct: num(row.f3),
    change: num(row.f4),
    amountYi: yi(row.f6),
    turnover: num(row.f8),
    leader: row.f128 || '',
    leaderPct: num(row.f136),
  };
}

function fetchBoardList(fs, pz = 500) {
  const fields = 'f12,f14,f2,f3,f4,f6,f8,f128,f136,f152';
  const boards = [];
  const seen = new Set();
  let page = 1;
  let total = Infinity;
  while (boards.length < total && page <= 8) {
    const url = `https://push2.eastmoney.com/api/qt/clist/get?pn=${page}&pz=${pz}&po=1&np=1&fltt=2&invt=2&fid=f3&fs=${encodeURIComponent(fs)}&fields=${fields}&ut=${UT}`;
    const data = parseJson(httpGetText(url))?.data;
    if (!data) break;
    total = num(data.total) ?? 0;
    const rows = asRows(data.diff);
    if (!rows.length) break;
    for (const row of rows) {
      const board = mapBoard(row);
      if (!board.name || seen.has(board.code || board.name)) continue;
      seen.add(board.code || board.name);
      boards.push(board);
    }
    if (boards.length >= total) break;
    page += 1;
  }
  return boards;
}

function summarizeBoards(boards) {
  const sortedPct = [...boards].sort((a, b) => (b.pct ?? -999) - (a.pct ?? -999));
  const sortedAmt = [...boards].sort((a, b) => (b.amountYi ?? -1) - (a.amountYi ?? -1));
  const up = boards.filter(b => (b.pct ?? 0) > 0).length;
  const down = boards.filter(b => (b.pct ?? 0) < 0).length;
  const flat = boards.length - up - down;
  return {
    total: boards.length,
    up,
    down,
    flat,
    topGainers: sortedPct.slice(0, 10),
    topLosers: [...sortedPct].reverse().slice(0, 10),
    topAmount: sortedAmt.slice(0, 10),
  };
}

/** 全部行业板块 */
export function getIndustryBoards() {
  const boards = fetchBoardList('m:90+t:2+f:!50', 100);
  return { ...summarizeBoards(boards), boards };
}

/**
 * 概念板块
 * @param {{ topN?: number, all?: boolean }} opts
 */
export function getConceptBoards(opts = {}) {
  const all = Boolean(opts.all);
  const topN = Math.max(5, Number(opts.topN) || 15);
  const boards = fetchBoardList('m:90+t:3+f:!50', 100);
  const summary = summarizeBoards(boards);
  if (all) return { ...summary, boards };

  const sortedPct = [...boards].sort((a, b) => (b.pct ?? -999) - (a.pct ?? -999));
  return {
    ...summary,
    boards: [
      ...sortedPct.slice(0, topN),
      ...[...sortedPct].reverse().slice(0, topN),
    ],
    note: `概念板块共 ${boards.length} 个，默认只返回涨跌各 ${topN}；全量请传 all=true`,
  };
}

function fetchLimitPool(kind, dateStr) {
  const ymd = dateStr.replace(/-/g, '');
  const path = kind === 'zt' ? 'getTopicZTPool' : 'getTopicDTPool';
  const url = `https://push2ex.eastmoney.com/${path}?ut=7eea3edcaed734bea9cbfc24409ed989&dpt=wz.ztzt&Pageindex=0&pagesize=20&sort=fbt:asc&date=${ymd}`;
  const data = parseJson(httpGetText(url))?.data;
  if (!data) return { count: null, samples: [] };
  const pool = data.pool || [];
  const count = num(data.tc) ?? pool.length;
  const samples = pool.slice(0, 8).map((item) => ({
    name: item.n || item.name || '',
    code: item.c || item.code || '',
    pct: num(item.zdp ?? item.pct),
  })).filter(s => s.name);
  return { count, samples };
}

function yiFromYuan(v) {
  const n = num(v);
  if (n == null) return null;
  return Math.round((n / 1e8) * 100) / 100;
}

function mapFundBoard(row) {
  return {
    code: row.f12 || '',
    name: row.f14 || '',
    pct: num(row.f3),
    mainNetYi: yiFromYuan(row.f62),
    mainNetPct: num(row.f184),
    superNetYi: yiFromYuan(row.f66),
    bigNetYi: yiFromYuan(row.f72),
    midNetYi: yiFromYuan(row.f78),
    smallNetYi: yiFromYuan(row.f84),
    leader: row.f204 || row.f128 || '',
  };
}

function fetchFundBoardList(fs, topN = 10) {
  const fields = 'f12,f14,f3,f62,f184,f66,f72,f78,f84,f204,f128';
  const fetchPage = (po) => {
    const url = `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=${Math.max(topN * 2, 20)}&po=${po}&np=1&fltt=2&invt=2&fid=f62&fs=${encodeURIComponent(fs)}&fields=${fields}&ut=${UT}`;
    return asRows(parseJson(httpGetText(url))?.data?.diff).map(mapFundBoard).filter(b => b.name);
  };
  const inflowRows = fetchPage(1); // 净流入降序
  const outflowRows = fetchPage(0); // 净流入升序（流出最多在前）
  return {
    total: Math.max(inflowRows.length, outflowRows.length),
    inflowTop: inflowRows.filter(b => (b.mainNetYi ?? 0) > 0).slice(0, topN),
    outflowTop: outflowRows.filter(b => (b.mainNetYi ?? 0) < 0).slice(0, topN),
  };
}

/**
 * 大盘今日资金流向（沪深合计分时最后一根）
 * 口径：东财推算，主力≈超大单+大单
 */
export function getMarketFundFlow() {
  const url = 'https://push2.eastmoney.com/api/qt/stock/fflow/kline/get?lmt=0&klt=1&secid=1.000001&secid2=0.399001&fields1=f1,f2,f3,f7&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61,f62,f63';
  const klines = parseJson(httpGetText(url))?.data?.klines || [];
  if (!klines.length) {
    return { available: false, reason: '未获取到大盘资金流向' };
  }
  const last = String(klines[klines.length - 1] || '').split(',');
  // time,主力,小单,中单,大单,超大单
  const time = last[0] || '';
  const mainNetYi = yiFromYuan(last[1]);
  const smallNetYi = yiFromYuan(last[2]);
  const midNetYi = yiFromYuan(last[3]);
  const bigNetYi = yiFromYuan(last[4]);
  const superNetYi = yiFromYuan(last[5]);
  return {
    available: true,
    time,
    mainNetYi,
    smallNetYi,
    midNetYi,
    bigNetYi,
    superNetYi,
    direction: mainNetYi == null ? '未知' : mainNetYi > 0 ? '净流入' : mainNetYi < 0 ? '净流出' : '持平',
  };
}

/** 行业板块主力资金流向 Top */
export function getIndustryFundFlow(topN = 10) {
  return { type: 'industry', ...fetchFundBoardList('m:90+t:2', topN) };
}

/** 概念板块主力资金流向 Top */
export function getConceptFundFlow(topN = 10) {
  return { type: 'concept', ...fetchFundBoardList('m:90+t:3', topN) };
}

/** 市场宽度：涨跌家数 + 涨停/跌停概览 */
export function getMarketBreadth() {
  const indices = getIndices();
  const sh = indices.find(i => i.code === '1.000001');
  const sz = indices.find(i => i.code === '0.399001');
  const cyb = indices.find(i => i.code === '0.399006');
  const dateStr = getBjToday();
  const zt = fetchLimitPool('zt', dateStr);
  const dt = fetchLimitPool('dt', dateStr);

  const up = (sh?.upCount || 0) + (sz?.upCount || 0);
  const down = (sh?.downCount || 0) + (sz?.downCount || 0);
  const flat = (sh?.flatCount || 0) + (sz?.flatCount || 0);
  const amountYi = indices
    .filter(i => i.code === '1.000001' || i.code === '0.399001')
    .reduce((sum, i) => sum + (i.amountYi || 0), 0);

  return {
    date: dateStr,
    shanghai: sh || null,
    shenzhen: sz || null,
    chinext: cyb || null,
    hsAmountYi: Math.round(amountYi * 100) / 100,
    upCount: up || null,
    downCount: down || null,
    flatCount: flat || null,
    limitUp: zt,
    limitDown: dt,
  };
}

/** 抓取东财快讯（股市/重要/要闻） */
export function getTodayNews(limit = 30) {
  const channels = [
    { id: 101, name: '重要' },
    { id: 102, name: '股市' },
    { id: 100, name: '快讯' },
  ];
  const today = getBjToday();
  const seen = new Set();
  const news = [];

  for (const ch of channels) {
    const raw = httpGetText(
      `https://newsapi.eastmoney.com/kuaixun/v1/getlist_${ch.id}_ajaxResult_40_1_.html`
    );
    const match = raw.match(/ajaxResult=(\{[\s\S]*\})/);
    if (!match) continue;
    let data;
    try { data = JSON.parse(match[1]); } catch { continue; }
    for (const item of data.LivesList || []) {
      const id = item.id || item.newsid || item.title;
      if (!id || seen.has(id)) continue;
      const showTime = item.showtime || item.time || item.dateTime || '';
      if (showTime && showTime.substring(0, 10) < today) continue;
      seen.add(id);
      news.push({
        title: (item.title || item.simtitle || '').trim(),
        digest: (item.digest || item.simdigest || '').trim(),
        time: showTime,
        channel: ch.name,
        url: item.url_w || item.url_unique || '',
      });
    }
  }

  const colRaw = httpGetText(
    'https://np-listapi.eastmoney.com/comm/web/getNewsByColumns?client=web&biz=web_news_col&column=350&order=1&needInteractData=0&page_index=1&page_size=15&req_trace=market_agent&fields=code,showTime,title,mediaName,summary,url,uniqueUrl'
  );
  try {
    const col = JSON.parse(colRaw);
    for (const item of (col.data && col.data.list) || []) {
      const id = item.code || item.title;
      if (!id || seen.has(id)) continue;
      const showTime = item.showTime || '';
      if (showTime && showTime.substring(0, 10) < today) continue;
      seen.add(id);
      news.push({
        title: (item.title || '').trim(),
        digest: (item.summary || '').trim(),
        time: showTime,
        channel: '要闻',
        url: item.uniqueUrl || item.url || '',
      });
    }
  } catch { /* ignore */ }

  return news.slice(0, limit);
}

export { getTodayNews as fetchTodayNews };
