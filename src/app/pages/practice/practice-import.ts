import * as XLSX from 'xlsx';
import type { PracticeCategory, PracticeItemDraft } from './practice.types';

const HEADER_ALIASES = {
  category: ['分类', '类别', 'category', '领域', '方向'],
  question: ['题目', '问题', '题干', 'question', 'q'],
  answer: ['答案', '参考答案', '解析', 'answer', 'a', '要点'],
  tags: ['标签', '备注', 'tags', 'tag', 'notes'],
};

function normCell(v: unknown): string {
  if (v === null || v === undefined) return '';
  return String(v).replace(/\r\n/g, '\n').trim();
}

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, '');
}

function findColumnIndex(headerRow: string[], aliases: string[]): number {
  const normalizedHeaders = headerRow.map(normalizeHeader);
  for (const alias of aliases) {
    const na = normalizeHeader(alias);
    const idx = normalizedHeaders.indexOf(na);
    if (idx >= 0) return idx;
  }
  return -1;
}

/** 表头行识别：至少命中「题目」列 */
function isHeaderRow(cells: string[]): boolean {
  return findColumnIndex(cells, HEADER_ALIASES.question) >= 0;
}

const CATEGORY_ALIASES: { category: PracticeCategory; patterns: RegExp[] }[] = [
  {
    category: 'ios',
    patterns: [/^ios$/i, /^apple$/i, /^objc$/i, /^swift$/i, /^苹果$/],
  },
  {
    category: 'android',
    patterns: [/^android$/i, /^安卓$/, /^kotlin$/i, /^java\s*\(android\)$/i],
  },
  {
    category: 'angular-ts',
    patterns: [
      /^angular[\s\-_]*ts$/i,
      /^typescript$/i,
      /^ts$/i,
      /^angular[\s\-_]*typescript$/i,
      /^angular.*ts$/i,
    ],
  },
  {
    category: 'angular-js',
    patterns: [/^angular[\s\-_]*js$/i, /^javascript$/i, /^js$/i, /^angular[\s\-_]*javascript$/i],
  },
  {
    category: 'angular-css',
    patterns: [/^angular[\s\-_]*css$/i, /^css$/i, /^scss$/i, /^less$/i, /^样式$/],
  },
];

export function normalizeCategory(raw: string): PracticeCategory | null {
  const s = normCell(raw);
  if (!s) return null;
  const compact = s.replace(/\s+/g, '');
  for (const { category, patterns } of CATEGORY_ALIASES) {
    for (const p of patterns) {
      if (p.test(s) || p.test(compact)) return category;
    }
  }
  return null;
}

export interface ParsePracticeFileResult {
  drafts: PracticeItemDraft[];
  errors: string[];
}

/**
 * 解析 .xlsx / .xls / .csv（Excel 另存为 CSV 也可）。
 * 第一行表头，至少包含「题目」列；「分类」「答案」「标签」可选。
 */
export function parsePracticeFile(buffer: ArrayBuffer): ParsePracticeFileResult {
  const drafts: PracticeItemDraft[] = [];
  const errors: string[] = [];

  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(buffer, { type: 'array' });
  } catch (e) {
    errors.push(`无法读取表格文件：${e instanceof Error ? e.message : String(e)}`);
    return { drafts, errors };
  }

  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    errors.push('文件中没有工作表。Excel 请至少保留一个 Sheet，并把题目放在第一个 Sheet。');
    return { drafts, errors };
  }

  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<(string | number | null | undefined)[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  }) as unknown[][];

  if (!matrix.length) {
    errors.push('表格为空。');
    return { drafts, errors };
  }

  const firstRow = matrix[0].map((c) => normCell(c));
  let headerRow: string[];
  let dataStart = 1;
  let catIdx: number;
  let qIdx: number;
  let aIdx: number;
  let tagIdx: number;

  if (isHeaderRow(firstRow)) {
    headerRow = firstRow;
    catIdx = findColumnIndex(headerRow, HEADER_ALIASES.category);
    qIdx = findColumnIndex(headerRow, HEADER_ALIASES.question);
    aIdx = findColumnIndex(headerRow, HEADER_ALIASES.answer);
    tagIdx = findColumnIndex(headerRow, HEADER_ALIASES.tags);
  } else {
    /* 无表头：按列顺序 分类 | 题目 | 答案 | 标签 */
    dataStart = 0;
    catIdx = 0;
    qIdx = 1;
    aIdx = 2;
    tagIdx = 3;
    if (matrix[0].length < 2) {
      errors.push(
        '未识别到表头，且列数不足。请使用第一行表头（含「题目」列），或按列顺序：分类、题目、答案、标签。'
      );
      return { drafts, errors };
    }
  }

  if (qIdx < 0) {
    errors.push('请添加「题目」列表头（或英文 question）。');
    return { drafts, errors };
  }

  const excelRowBase = 1; /* 1-based first row is header when dataStart === 1 */

  for (let i = dataStart; i < matrix.length; i++) {
    const row = matrix[i];
    const rowNum = i + excelRowBase;
    const question = qIdx < row.length ? normCell(row[qIdx]) : '';
    if (!question) continue;

    const catRaw = catIdx >= 0 && catIdx < row.length ? normCell(row[catIdx]) : '';
    const category = catRaw ? normalizeCategory(catRaw) : null;
    if (!category) {
      errors.push(`第 ${rowNum} 行：分类无效或为空（当前：「${catRaw || '（空）'}」）。请使用 iOS、Android、Angular-TS、Angular-JS、Angular-CSS 等。`);
      continue;
    }

    const answer = aIdx >= 0 && aIdx < row.length ? normCell(row[aIdx]) : '';
    const tags = tagIdx >= 0 && tagIdx < row.length ? normCell(row[tagIdx]) : '';

    drafts.push({ category, question, answer, tags, sourceRow: rowNum });
  }

  if (!drafts.length && !errors.length) {
    errors.push('没有找到有效题目行（「题目」列为空则跳过该行）。');
  }

  return { drafts, errors };
}
