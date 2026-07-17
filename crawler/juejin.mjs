#!/usr/bin/env node
/**
 * 掘金评论爬虫
 *
 * 用法:
 *   node crawler/juejin.mjs <url1> [url2] [url3] ...
 *   node crawler/juejin.mjs --config targets.json
 *   node crawler/juejin.mjs --list                          # 查看已采集数据
 *   node crawler/juejin.mjs --export csv                    # 导出为CSV
 *
 * 支持的 URL 格式:
 *   https://juejin.cn/post/xxxxx          (文章)
 *   https://juejin.cn/pin/xxxxx           (沸点)
 *   https://juejin.cn/pins/myclub/xxxxx   (圈子沸点)
 *
 * 数据存储: crawler/data/juejin_comments.json
 * 配置格式(targets.json):
 *   { "urls": ["https://juejin.cn/post/xxx", "https://juejin.cn/pin/xxx"] }
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, 'data');
const DATA_FILE = join(DATA_DIR, 'juejin_comments.json');
const API_URL = 'https://api.juejin.cn/interact_api/v1/comment/list';

// ===== 配置 =====
const CONFIG = {
  pageSize: 50,          // 每页条数（最大50）
  delay: 1500,           // 请求间隔（ms），避免被限流
  userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
};

// ===== 工具函数 =====

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

/** 从 URL 中解析 item_id 和 item_type */
function parseUrl(url) {
  const u = new URL(url);
  const parts = u.pathname.split('/').filter(Boolean);

  // /post/xxxxx → 文章 (item_type=2)
  if (parts[0] === 'post' && parts[1]) {
    return { itemId: parts[1], itemType: 2, label: '文章' };
  }
  // /pin/xxxxx → 沸点 (item_type=4)
  if (parts[0] === 'pin' && parts[1]) {
    return { itemId: parts[1], itemType: 4, label: '沸点' };
  }
  // /pins/myclub/xxxxx 或 /pins/topic/xxxxx → 沸点 (item_type=4)
  if (parts[0] === 'pins' && parts.length >= 2) {
    const id = parts[parts.length - 1];
    if (/^\d{10,}$/.test(id)) {
      return { itemId: id, itemType: 4, label: '沸点' };
    }
  }

  return null;
}

/** 调用掘金评论 API */
async function fetchComments(itemId, itemType, cursor = '0') {
  const body = {
    item_id: itemId,
    item_type: itemType,
    cursor,
    limit: CONFIG.pageSize,
    sort: 0,
    client_type: 2608,
  };

  const resp = await fetch(`${API_URL}?aid=2608&spider=0`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': CONFIG.userAgent,
      'Referer': 'https://juejin.cn/',
    },
    body: JSON.stringify(body),
  });

  const json = await resp.json();
  if (json.err_no !== 0) {
    throw new Error(`API错误: ${json.err_msg}`);
  }

  return {
    comments: json.data || [],
    total: json.count || 0,
    cursor: json.cursor || '0',
    hasMore: json.has_more || false,
  };
}

/** 解析单条评论 */
function parseComment(c) {
  const info = c.comment_info || {};
  const user = c.user_info || {};
  return {
    commentId: info.comment_id,
    userId: user.user_id,
    userName: user.user_name || '未知用户',
    userDesc: user.description || '',
    content: (info.comment_content || '').trim(),
    diggCount: info.digg_count || 0,
    buryCount: info.bury_count || 0,
    replyCount: info.reply_count || 0,
    createdAt: info.ctime ? new Date(info.ctime * 1000).toISOString() : '',
    isTop: info.level === 1,
    replies: (c.reply_infos || []).map(r => ({
      commentId: r.comment_info?.comment_id,
      userName: r.user_info?.user_name || '未知用户',
      content: (r.comment_info?.comment_content || '').trim(),
      diggCount: r.comment_info?.digg_count || 0,
      createdAt: r.comment_info?.ctime ? new Date(r.comment_info.ctime * 1000).toISOString() : '',
    })),
  };
}

/** 判断评论是否是今天的（东八区） */
function isToday(isoStr) {
  if (!isoStr) return false;
  const d = new Date(isoStr);
  // 转为东八区日期
  const now = new Date();
  const bjOffset = 8 * 60; // 东八区偏移分钟
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60000;
  const bjNow = new Date(utcNow + bjOffset * 60000);
  const bjComment = new Date(d.getTime() + d.getTimezoneOffset() * 60000 + bjOffset * 60000);
  return bjNow.getFullYear() === bjComment.getFullYear()
    && bjNow.getMonth() === bjComment.getMonth()
    && bjNow.getDate() === bjComment.getDate();
}

/** 抓取一个 URL 的所有评论 */
async function crawlUrl(url, opts = {}) {
  const parsed = parseUrl(url);
  if (!parsed) {
    console.error(`  ⚠ 无法解析URL: ${url}`);
    return { url, error: '无法解析URL', comments: [] };
  }

  console.log(`  → ${parsed.label} [${parsed.itemId}]${opts.todayOnly ? ' (仅今天)' : ''}`);

  const allComments = [];
  let cursor = '0';
  let page = 0;
  let total = 0;
  let skippedOld = 0;

  while (true) {
    page++;
    const result = await fetchComments(parsed.itemId, parsed.itemType, cursor);
    total = result.total;

    let comments = result.comments.map(parseComment);

    if (opts.todayOnly) {
      const before = comments.length;
      comments = comments.filter(c => isToday(c.createdAt));
      skippedOld += (before - comments.length);
    }

    allComments.push(...comments);

    process.stdout.write(`    第${page}页: 获取${comments.length}条 (累计${allComments.length}/${total})\r`);

    // 仅今天模式：如果整页都没有今天的评论，说明后面的更早，可以停了
    if (opts.todayOnly && comments.length === 0 && result.comments.length > 0) {
      console.log(`    ℹ 遇到非今天评论，提前结束 (跳过${skippedOld}条旧评论)`);
      break;
    }

    if (!result.hasMore || result.comments.length === 0) break;
    cursor = result.cursor;
    await sleep(CONFIG.delay);
  }

  console.log(`    ✓ 完成: 共${allComments.length}条评论${opts.todayOnly ? ` (过滤掉${skippedOld}条旧数据)` : ''}`);

  return {
    url,
    itemId: parsed.itemId,
    itemType: parsed.itemType,
    label: parsed.label,
    totalComments: allComments.length,
    crawledAt: new Date().toISOString(),
    comments: allComments,
  };
}

// ===== 数据存储 =====

function loadExistingData() {
  if (!existsSync(DATA_FILE)) return { tasks: [] };
  try {
    return JSON.parse(readFileSync(DATA_FILE, 'utf-8'));
  } catch { return { tasks: [] }; }
}

function saveData(data) {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function mergeResults(existing, newResults) {
  const map = new Map();
  // 先放旧数据
  for (const task of existing.tasks) {
    map.set(task.itemId, task);
  }
  // 用新数据覆盖
  for (const task of newResults) {
    if (task.error) continue;
    const prev = map.get(task.itemId);
    if (prev) {
      // 去重合并评论
      const seen = new Set(prev.comments.map(c => c.commentId));
      const newOnes = task.comments.filter(c => !seen.has(c.commentId));
      task.comments = [...prev.comments, ...newOnes];
      task.totalComments = task.comments.length;
      console.log(`  ℹ 合并: 新增${newOnes.length}条, 总计${task.comments.length}条`);
    }
    map.set(task.itemId, task);
  }
  return { tasks: [...map.values()], lastUpdate: new Date().toISOString() };
}

// ===== 导出 =====

function exportCSV(data) {
  const rows = [['URL', '类型', '评论ID', '用户名', '用户简介', '评论内容', '点赞', '回复数', '时间', '是否置顶']];
  for (const task of data.tasks) {
    for (const c of task.comments) {
      rows.push([
        task.url,
        task.label,
        c.commentId,
        c.userName,
        c.userDesc.replace(/[,\n]/g, ' '),
        c.content.replace(/[,\n]/g, ' '),
        c.diggCount,
        c.replyCount,
        c.createdAt,
        c.isTop ? '是' : '',
      ]);
    }
  }
  // 简单CSV，引号包裹
  const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const outFile = join(DATA_DIR, 'juejin_comments.csv');
  writeFileSync(outFile, '\uFEFF' + csv, 'utf-8'); // BOM for Excel中文
  console.log(`✓ 已导出CSV: ${outFile} (${rows.length - 1}条)`);
}

function listData(data) {
  if (!data.tasks.length) {
    console.log('暂无采集数据');
    return;
  }
  console.log(`\n已采集 ${data.tasks.length} 个目标:\n`);
  for (const t of data.tasks) {
    console.log(`  [${t.label}] ${t.itemId}`);
    console.log(`    URL: ${t.url}`);
    console.log(`    评论: ${t.totalComments}条 | 采集时间: ${t.crawledAt}`);
    console.log();
  }
}

// ===== 主流程 =====

async function main() {
  const args = process.argv.slice(2);
  const data = loadExistingData();

  // --list: 查看已采集数据
  if (args.includes('--list')) {
    listData(data);
    return;
  }

  // --export csv: 导出
  if (args.includes('--export')) {
    const format = args[args.indexOf('--export') + 1] || 'csv';
    if (format === 'csv') exportCSV(data);
    else console.error(`不支持的导出格式: ${format}`);
    return;
  }

  // --config: 从配置文件读取URL列表
  const todayOnly = args.includes('--today');
  let urls = [];
  if (args.includes('--config')) {
    const configFile = args[args.indexOf('--config') + 1];
    if (!configFile || !existsSync(configFile)) {
      console.error(`配置文件不存在: ${configFile}`);
      process.exit(1);
    }
    const config = JSON.parse(readFileSync(configFile, 'utf-8'));
    urls = config.urls || [];
  } else {
    // 命令行直接传URL
    urls = args.filter(a => a.startsWith('http'));
  }

  if (!urls.length) {
    console.log('用法:');
    console.log('  node crawler/juejin.mjs <url1> [url2] ... [--today]');
    console.log('  node crawler/juejin.mjs --config targets.json [--today]');
    console.log('  node crawler/juejin.mjs --list');
    console.log('  node crawler/juejin.mjs --export csv');
    console.log('\n选项:');
    console.log('  --today   仅采集今天的评论');
    return;
  }

  console.log(`\n🕷️  掘金评论爬虫 v1.0`);
  console.log(`   目标: ${urls.length} 个URL${todayOnly ? ' (仅今天)' : ''}\n`);

  const results = [];
  for (const url of urls) {
    console.log(`\n[${urls.indexOf(url) + 1}/${urls.length}] ${url}`);
    try {
      const result = await crawlUrl(url, { todayOnly });
      results.push(result);
    } catch (err) {
      console.error(`  ✗ 错误: ${err.message}`);
      results.push({ url, error: err.message, comments: [] });
    }
    if (urls.indexOf(url) < urls.length - 1) await sleep(CONFIG.delay);
  }

  // 合并存储
  const merged = mergeResults(data, results);
  saveData(merged);

  const totalNew = results.reduce((s, r) => s + (r.comments?.length || 0), 0);
  console.log(`\n✅ 采集完成: 本次获取${totalNew}条评论, 总计${merged.tasks.reduce((s, t) => s + t.totalComments, 0)}条`);
  console.log(`   数据存储: ${DATA_FILE}`);
}

main().catch(err => {
  console.error('致命错误:', err);
  process.exit(1);
});
