import type { PracticeItem } from './practice.types';
import { stripMarkdownForSearch } from './practice-compare.util';

function searchHaystackForItem(it: PracticeItem): string {
  const q = it.question ?? '';
  const tag = it.tags ?? '';
  const a = stripMarkdownForSearch(it.answer ?? '');
  const o = String(it.oralOneLiner ?? '');
  return (q + '\n' + tag + '\n' + a + '\n' + o).toLowerCase();
}

/** 多词空格分隔，需同时包含（与扩展一致）。 */
export function applyPracticeSearchFilter(items: PracticeItem[], rawQuery: string): PracticeItem[] {
  const raw = String(rawQuery ?? '').trim();
  if (!raw) return items;
  const tokens = raw
    .toLowerCase()
    .split(/\s+/)
    .map((t) => t.trim())
    .filter(Boolean);
  if (tokens.length === 0) return items;
  return items.filter((it) => {
    const hay = searchHaystackForItem(it);
    return tokens.every((t) => hay.includes(t));
  });
}
