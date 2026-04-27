/** 与 VS Code 扩展 practice.js 一致的文本规范化与相似度（bigram Jaccard）。 */

export function normalizeText(s: string): string {
  return String(s ?? '')
    .trim()
    .replace(/\s+/g, ' ');
}

export function answerPlainForCompare(s: string): string {
  let t = String(s ?? '');
  t = t.replace(/```[\s\S]*?```/g, ' ');
  t = t.replace(/`([^`]*?)`/g, '$1');
  t = t.replace(/\*\*?/g, '');
  t = t.replace(/^#{1,6}\s+/gm, '');
  return t;
}

export function stripMarkdownForSearch(s: string): string {
  let t = answerPlainForCompare(s);
  t = t.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1');
  t = t.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1');
  return t;
}

export function bigramJaccard(a: string, b: string): number {
  const x = normalizeText(a);
  const y = normalizeText(b);
  if (x.length === 0 && y.length === 0) return 1;
  if (x.length < 2 && y.length < 2) return x === y ? 1 : 0;
  const grams = (s: string): Set<string> => {
    const set = new Set<string>();
    for (let i = 0; i < s.length - 1; i++) set.add(s.slice(i, i + 2));
    if (s.length === 1) set.add(s);
    return set;
  };
  const A = grams(x);
  const B = grams(y);
  let inter = 0;
  for (const g of A) if (B.has(g)) inter++;
  const union = A.size + B.size - inter;
  return union === 0 ? 0 : inter / union;
}

export interface ComparePracticeResult {
  message: string;
  level: 'ok' | 'mid' | 'low';
}

export function compareUserAnswerToReference(userRaw: string, referenceRaw: string): ComparePracticeResult {
  const u = normalizeText(userRaw);
  const refPlain = answerPlainForCompare(referenceRaw);
  const ref = normalizeText(refPlain);
  const exact = u === ref;
  const sim = exact ? 1 : bigramJaccard(userRaw, refPlain);
  const pct = Math.round(sim * 100);

  if (exact) {
    return { message: '与参考答案一致（空格已规范化）。', level: 'ok' };
  }
  if (sim >= 0.72) {
    const level: ComparePracticeResult['level'] = sim >= 0.88 ? 'ok' : 'mid';
    return {
      message: `相似度约 ${pct}%：整体较接近，可对照片段与要点是否覆盖。`,
      level,
    };
  }
  if (sim >= 0.4) {
    return {
      message: `相似度约 ${pct}%：有部分重合，建议点开参考答案查漏补缺。`,
      level: 'mid',
    };
  }
  return {
    message: `相似度约 ${pct}%：表述差异较大，建议对照参考答案整理思路。`,
    level: 'low',
  };
}
