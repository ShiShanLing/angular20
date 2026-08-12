/**
 * 分析时间窗口：默认只用东八区「当天 09:00–15:00」的帖子
 * （对齐定时任务 15:00 收盘后跑日报，并配合资金流向）
 */

export const SESSION_START = '09:00:00';
export const SESSION_END = '15:00:59'; // 含 15:00 整分

/** 东八区今天 YYYY-MM-DD */
export function getBjToday(date = new Date()) {
  const utc = date.getTime() + date.getTimezoneOffset() * 60000;
  const bj = new Date(utc + 8 * 60 * 60000);
  return bj.toISOString().substring(0, 10);
}

/** 日历日加减（按 YYYY-MM-DD 字符串） */
export function addBjDays(dateStr, deltaDays) {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + deltaDays)).toISOString().substring(0, 10);
}

function normalizeTime(publishTime) {
  const raw = (publishTime || '').substring(11).trim();
  if (!raw) return '';
  if (raw.length === 5) return `${raw}:00`; // HH:MM
  return raw.substring(0, 8); // HH:MM:SS
}

/**
 * 是否在分析窗口内
 * @param {string} publishTime 如 "2026-08-04 14:25:03"
 * @param {{ days?: number, dateStr?: string }} opts
 *   days=1 → 仅今天 09:00–15:00
 *   days=N → 最近 N 个自然日（含今天），每天都只取 09:00–15:00
 */
export function isInAnalysisWindow(publishTime, opts = {}) {
  const days = Math.max(1, Number(opts.days) || 1);
  const today = opts.dateStr || getBjToday();
  if (!publishTime || publishTime.length < 16) return false;

  const day = publishTime.substring(0, 10);
  const time = normalizeTime(publishTime);
  if (!time) return false;
  if (time < SESSION_START || time > SESSION_END) return false;

  if (days <= 1) return day === today;

  const startDay = addBjDays(today, -(days - 1));
  return day >= startDay && day <= today;
}

/** 可读的窗口描述 */
export function analysisWindowLabel(opts = {}) {
  const days = Math.max(1, Number(opts.days) || 1);
  const today = opts.dateStr || getBjToday();
  if (days <= 1) return `${today} ${SESSION_START.slice(0, 5)}–${SESSION_END.slice(0, 5)}`;
  const startDay = addBjDays(today, -(days - 1));
  return `${startDay}~${today} 每日 ${SESSION_START.slice(0, 5)}–${SESSION_END.slice(0, 5)}`;
}
