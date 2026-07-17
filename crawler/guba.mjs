#!/usr/bin/env node
/**
 * 东方财富股吧爬虫
 *
 * 用法:
 *   node crawler/guba.mjs sh000001                    # 上证指数股吧
 *   node crawler/guba.mjs sz399006 --today            # 创业板指，仅今天
 *   node crawler/guba.mjs sh000001 sz399006 --today   # 多个股吧
 *   node crawler/guba.mjs --config guba_targets.json  # 配置文件
 *   node crawler/guba.mjs --list                      # 查看已采集数据
 *   node crawler/guba.mjs --export csv                # 导出CSV
 *
 * 支持的股吧代码:
 *   sh000001   上证指数
 *   sz399006   创业板指
 *   sz399001   深证成指
 *   000001     平安银行
 *   600519     贵州茅台
 *   ...        任意股票/指数代码
 *
 * 数据存储: crawler/data/guba_posts.json
 * 配置格式(guba_targets.json):
 *   { "codes": ["sh000001", "sz399006"], "todayOnly": true }
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const DATA_FILE = join(DATA_DIR, 'guba_posts.json');

// ===== 配置 =====
const CONFIG = {
  pagesPerRun: 5,          // 每次运行最多抓几页（避免太慢）
  delay: 1200,             // 请求间隔（ms）
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
};

// ===== 工具函数 =====

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/** 判断时间字符串是否是今天的（东八区） */
function isToday(timeStr) {
  if (!timeStr) return false;
  // timeStr 格式: "2026-07-17 11:30:18"
  const postDate = timeStr.substring(0, 10); // "2026-07-17"
  const now = new Date();
  const bjOffset = 8 * 60;
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60000;
  const bjNow = new Date(utcNow + bjOffset * 60000);
  const todayStr = bjNow.toISOString().substring(0, 10);
  return postDate === todayStr;
}

/** 获取今天的日期字符串 YYYY-MM-DD（东八区） */
function getBjToday() {
  const now = new Date();
  const bjOffset = 8 * 60;
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60000;
  const bjNow = new Date(utcNow + bjOffset * 60000);
  return bjNow.toISOString().substring(0, 10);
}

// ===== 核心抓取 =====

/** 抓取股吧列表页 */
async function fetchGubaPage(code, page = 1) {
  // 第1页: list,{code},f.html  第N页: list,{code},f_{N}.html
  const pageSuffix = page <= 1 ? '' : `_${page}`;
  const url = `https://guba.eastmoney.com/list,${code},f${pageSuffix}.html`;

  const resp = await fetch(url, {
    headers: {
      'User-Agent': CONFIG.userAgent,
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
    },
  });

  if (!resp.ok) {
    throw new Error(`HTTP ${resp.status}: ${resp.statusText}`);
  }

  const html = await resp.text();

  // 从 HTML 中提取 var article_list={...};
  const match = html.match(/var article_list=({[\s\S]*?});/);
  if (!match) {
    // 可能是验证页面或空页面
    if (html.includes('验证') || html.includes('captcha')) {
      throw new Error('触发反爬验证');
    }
    throw new Error('无法解析页面数据');
  }

  const data = JSON.parse(match[1]);
  const posts = (data.re || []).map(p => ({
    postId: p.post_id,
    title: (p.post_title || '').trim(),
    content: (p.post_content || '').trim(),
    author: p.user_nickname || '未知用户',
    userId: p.user_id || '',
    barCode: p.stockbar_code || code,
    barName: p.stockbar_name || '',
    publishTime: p.post_publish_time || '',
    lastTime: p.post_last_time || '',
    clicks: p.post_click_count || 0,
    comments: p.post_comment_count || 0,
    forwards: p.post_forward_count || 0,
    likes: p.post_like_count || 0,
    bullish: p.bullish_bearish || 0,  // 1=看多, 2=看空, 0=未标记
    hasPic: p.post_has_pic || false,
    hasVideo: p.post_has_video || false,
    postType: p.post_type || 0,
    ip: p.post_ip || '',
  }));

  return {
    posts,
    totalCount: data.count || 0,
    barName: data.bar_name || '',
    barCode: data.bar_code || code,
  };
}

/** 抓取帖子详情页（获取完整正文） */
async function fetchPostDetail(code, postId) {
  const url = `https://guba.eastmoney.com/news,${code},${postId}.html`;

  const resp = await fetch(url, {
    headers: {
      'User-Agent': CONFIG.userAgent,
      'Accept': 'text/html',
    },
  });

  if (!resp.ok) return null;

  const html = await resp.text();

  // 提取 post_article={...}
  const idx = html.indexOf('post_article=');
  if (idx < 0) return null;

  // 找到对应的JSON
  const jsonStart = idx + 'post_article='.length;
  let depth = 0;
  let jsonEnd = jsonStart;
  for (let i = jsonStart; i < html.length && i < jsonStart + 50000; i++) {
    if (html[i] === '{') depth++;
    else if (html[i] === '}') {
      depth--;
      if (depth === 0) { jsonEnd = i + 1; break; }
    }
  }

  try {
    const article = JSON.parse(html.substring(jsonStart, jsonEnd));
    return {
      content: (article.post_content || '').trim(),
      abstract: (article.post_abstract || '').trim(),
    };
  } catch {
    return null;
  }
}

// ===== 爬取流程 =====

async function crawlGuba(code, opts = {}) {
  console.log(`  → 股吧: ${code}${opts.todayOnly ? ' (仅今天)' : ''}`);

  const allPosts = [];
  let barName = '';
  let totalCount = 0;
  let stoppedEarly = false;

  for (let page = 1; page <= CONFIG.pagesPerRun; page++) {
    try {
      const result = await fetchGubaPage(code, page);
      barName = result.barName;
      totalCount = result.totalCount;

      let posts = result.posts;

      if (opts.todayOnly) {
        const before = posts.length;
        const todayPosts = posts.filter(p => isToday(p.publishTime));
        posts = todayPosts;

        // 如果整页都没有今天的帖子，后面的更旧，可以停了
        if (todayPosts.length === 0 && result.posts.length > 0) {
          stoppedEarly = true;
          console.log(`    第${page}页: 无今天帖子，提前结束`);
          break;
        }
      }

      allPosts.push(...posts);
      process.stdout.write(`    第${page}页: ${posts.length}条 (累计${allPosts.length}/${totalCount})\r`);

      // 如果帖子不足一页，说明没有下一页了
      if (result.posts.length < 80) break;

      await sleep(CONFIG.delay);
    } catch (err) {
      console.error(`    第${page}页出错: ${err.message}`);
      break;
    }
  }

  // 可选：抓取帖子详情获取完整正文
  if (opts.withDetail && allPosts.length > 0) {
    console.log(`\n    抓取详情 (${Math.min(allPosts.length, 20)}条)...`);
    const detailBatch = allPosts.slice(0, 20); // 最多抓20条详情
    for (let i = 0; i < detailBatch.length; i++) {
      const detail = await fetchPostDetail(code, detailBatch[i].postId);
      if (detail && detail.content) {
        detailBatch[i].content = detail.content;
      }
      if (i < detailBatch.length - 1) await sleep(CONFIG.delay);
      process.stdout.write(`    详情: ${i + 1}/${detailBatch.length}\r`);
    }
  }

  console.log(`    ✓ ${barName}(${code}): ${allPosts.length}条帖子${stoppedEarly ? ' (提前结束)' : ''}`);

  return {
    code,
    barName,
    totalPosts: allPosts.length,
    totalCount,
    crawledAt: new Date().toISOString(),
    date: getBjToday(),
    posts: allPosts,
  };
}

// ===== 数据存储 =====

function loadExistingData() {
  if (!existsSync(DATA_FILE)) return { bars: [] };
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
  } catch { return { bars: [] }; }
}

function saveData(data) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function mergeResults(existing, newResults) {
  const map = new Map();

  // 先放旧数据
  for (const bar of existing.bars) {
    map.set(bar.code, bar);
  }

  // 合并新数据
  for (const bar of newResults) {
    if (!bar.posts) continue;
    const prev = map.get(bar.code);
    if (prev) {
      // 按 postId 去重合并
      const seen = new Set(prev.posts.map(p => p.postId));
      const newOnes = bar.posts.filter(p => !seen.has(p.postId));
      bar.posts = [...prev.posts, ...newOnes];
      bar.totalPosts = bar.posts.length;
      if (newOnes.length > 0) {
        console.log(`  ℹ ${bar.barName}: 新增${newOnes.length}条, 总计${bar.posts.length}条`);
      } else {
        console.log(`  ℹ ${bar.barName}: 无新增, 总计${bar.posts.length}条`);
      }
    }
    map.set(bar.code, bar);
  }

  return { bars: [...map.values()], lastUpdate: new Date().toISOString() };
}

// ===== 导出 =====

function exportCSV(data) {
  const rows = [['股吧代码', '股吧名称', '帖子ID', '标题', '作者', '内容', '点击', '评论数', '转发', '看多看空', '发布时间', 'IP']];
  for (const bar of data.bars) {
    for (const p of bar.posts) {
      const bullishLabel = p.bullish === 1 ? '看多' : p.bullish === 2 ? '看空' : '';
      rows.push([
        bar.code,
        bar.barName,
        p.postId,
        p.title.replace(/[,\n]/g, ' '),
        p.author,
        (p.content || p.title).replace(/[,\n]/g, ' ').substring(0, 500),
        p.clicks,
        p.comments,
        p.forwards,
        bullishLabel,
        p.publishTime,
        p.ip,
      ]);
    }
  }
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const outFile = join(DATA_DIR, 'guba_posts.csv');
  writeFileSync(outFile, '\uFEFF' + csv, 'utf-8');
  console.log(`✓ 已导出CSV: ${outFile} (${rows.length - 1}条)`);
}

function listData(data) {
  if (!data.bars.length) {
    console.log('暂无采集数据');
    return;
  }
  console.log(`\n已采集 ${data.bars.length} 个股吧:\n`);
  for (const bar of data.bars) {
    console.log(`  [${bar.code}] ${bar.barName}`);
    console.log(`    帖子: ${bar.totalPosts}条 | 采集时间: ${bar.crawledAt}`);
    if (bar.posts.length > 0) {
      const latest = bar.posts[bar.posts.length - 1];
      console.log(`    最新: ${latest.title.substring(0, 50)} (${latest.publishTime})`);
    }
    console.log();
  }
}

// ===== 统计摘要 =====

function printSummary(data) {
  console.log('\n📊 数据摘要:');
  for (const bar of data.bars) {
    const today = getBjToday();
    const todayPosts = bar.posts.filter(p => (p.publishTime || '').startsWith(today));
    console.log(`  ${bar.barName}(${bar.code}): 总${bar.totalPosts}条, 今天${todayPosts.length}条`);

    if (todayPosts.length > 0) {
      // 简单情绪统计
      let bullish = 0, bearish = 0, neutral = 0;
      for (const p of todayPosts) {
        if (p.bullish === 1) bullish++;
        else if (p.bullish === 2) bearish++;
        else neutral++;
      }
      if (bullish + bearish > 0) {
        console.log(`    情绪: 看多${bullish} / 看空${bearish} / 中性${neutral}`);
      }

      // 热门帖子（按点击数排序）
      const hot = [...todayPosts].sort((a, b) => b.clicks - a.clicks).slice(0, 3);
      console.log(`    热门:`);
      for (const p of hot) {
        console.log(`      [${p.clicks}点击] ${p.title.substring(0, 50)}`);
      }
    }
  }
}

// ===== 主流程 =====

async function main() {
  const args = process.argv.slice(2);
  const data = loadExistingData();

  // --list: 查看已采集数据
  if (args.includes('--list')) {
    listData(data);
    printSummary(data);
    return;
  }

  // --export csv: 导出
  if (args.includes('--export')) {
    const format = args[args.indexOf('--export') + 1] || 'csv';
    if (format === 'csv') exportCSV(data);
    else console.error(`不支持的导出格式: ${format}`);
    return;
  }

  // 解析参数
  const todayOnly = args.includes('--today');
  const withDetail = args.includes('--detail');
  const pagesArg = args.find(a => a.startsWith('--pages='));
  if (pagesArg) {
    CONFIG.pagesPerRun = parseInt(pagesArg.split('=')[1]) || 5;
  }

  let codes = [];
  if (args.includes('--config')) {
    const configFile = args[args.indexOf('--config') + 1];
    if (!configFile || !existsSync(configFile)) {
      console.error(`配置文件不存在: ${configFile}`);
      process.exit(1);
    }
    const config = JSON.parse(readFileSync(configFile, 'utf-8'));
    codes = config.codes || [];
    if (config.todayOnly !== undefined) {
      // 配置文件也可以设置默认todayOnly
    }
  } else {
    // 命令行直接传股吧代码
    codes = args.filter(a => !a.startsWith('--'));
  }

  if (!codes.length) {
    console.log('用法:');
    console.log('  node crawler/guba.mjs sh000001 [--today] [--detail] [--pages=N]');
    console.log('  node crawler/guba.mjs sh000001 sz399006 --today');
    console.log('  node crawler/guba.mjs --config guba_targets.json');
    console.log('  node crawler/guba.mjs --list');
    console.log('  node crawler/guba.mjs --export csv');
    console.log('\n选项:');
    console.log('  --today     仅采集今天的帖子');
    console.log('  --detail    同时抓取帖子详情（较慢）');
    console.log('  --pages=N   每次运行最多抓N页（默认5）');
    console.log('\n常用代码:');
    console.log('  sh000001  上证指数    sz399006  创业板指');
    console.log('  sz399001  深证成指    000001    平安银行');
    return;
  }

  console.log(`\n🕷️  东方财富股吧爬虫 v1.0`);
  console.log(`   目标: ${codes.join(', ')}${todayOnly ? ' (仅今天)' : ''}`);
  console.log(`   每页最多: ${CONFIG.pagesPerRun}页\n`);

  const results = [];
  for (let i = 0; i < codes.length; i++) {
    console.log(`\n[${i + 1}/${codes.length}] ${codes[i]}`);
    try {
      const result = await crawlGuba(codes[i], { todayOnly, withDetail });
      results.push(result);
    } catch (err) {
      console.error(`  ✗ 错误: ${err.message}`);
      results.push({ code: codes[i], barName: '', totalPosts: 0, posts: [], error: err.message });
    }
    if (i < codes.length - 1) await sleep(CONFIG.delay);
  }

  // 合并存储
  const merged = mergeResults(data, results);
  saveData(merged);

  const totalNew = results.reduce((s, r) => s + (r.totalPosts || 0), 0);
  console.log(`\n✅ 采集完成: 本次获取${totalNew}条帖子`);
  console.log(`   数据存储: ${DATA_FILE}`);

  // 打印摘要
  printSummary(merged);
}

main().catch(err => {
  console.error('致命错误:', err);
  process.exit(1);
});
