/** 真实顺序。没有 sort 时沿用原来的题号，避免旧题被打乱。 */
export function questionSortKey(item: { sort?: number; no?: number }): number {
  if (typeof item.sort === 'number' && Number.isFinite(item.sort)) return item.sort;
  if (typeof item.no === 'number' && Number.isFinite(item.no)) return item.no;
  return Number.MAX_SAFE_INTEGER;
}

/**
 * 插入后希望出现在第 displayNo 题（从 1 开始）时，应该写入的排序值。
 * 插在第 50 题前面时，前后如果是 49 和 50，得到 49.5。
 */
export function sortKeyBeforeDisplay(
  items: { sort?: number; no?: number }[],
  displayNo: number,
): number {
  const ordered = [...items].sort((a, b) => questionSortKey(a) - questionSortKey(b));
  if (ordered.length === 0) return 1;
  const place = Math.floor(displayNo);
  if (place <= 1) return questionSortKey(ordered[0]) - 1;
  if (place > ordered.length) return questionSortKey(ordered[ordered.length - 1]) + 1;
  const prev = questionSortKey(ordered[place - 2]);
  const next = questionSortKey(ordered[place - 1]);
  if (prev === next) return next - 0.5;
  return (prev + next) / 2;
}
