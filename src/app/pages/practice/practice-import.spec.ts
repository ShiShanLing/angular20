import * as XLSX from 'xlsx';

import { normalizeCategory, parsePracticeFile } from './practice-import';

function buildWorkbookBuffer(rows: Array<Array<string | number>>): ArrayBuffer {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  return XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
}

describe('practice-import', () => {
  it('normalizes category aliases', () => {
    expect(normalizeCategory('TypeScript')).toBe('angular-ts');
    expect(normalizeCategory('安卓')).toBe('android');
    expect(normalizeCategory('')).toBeNull();
  });

  it('parses workbook with header row', () => {
    const buf = buildWorkbookBuffer([
      ['分类', '题目', '答案', '标签'],
      ['ios', '什么是 ARC', '自动引用计数', '内存'],
      ['Angular-TS', 'signal 与 RxJS 怎么选', '看场景', 'Angular'],
    ]);

    const { drafts, errors } = parsePracticeFile(buf);
    expect(errors.length).toBe(0);
    expect(drafts.length).toBe(2);
    expect(drafts[0].category).toBe('ios');
    expect(drafts[1].category).toBe('angular-ts');
  });

  it('supports no-header mode by positional columns', () => {
    const buf = buildWorkbookBuffer([
      ['android', 'Activity 生命周期', 'onCreate...', '基础'],
      ['angular-css', '什么是 :host', '组件宿主', '样式'],
    ]);

    const { drafts, errors } = parsePracticeFile(buf);
    expect(errors.length).toBe(0);
    expect(drafts.length).toBe(2);
    expect(drafts[0].sourceRow).toBe(1);
    expect(drafts[1].category).toBe('angular-css');
  });

  it('reports invalid category rows and keeps valid ones', () => {
    const buf = buildWorkbookBuffer([
      ['分类', '题目', '答案', '标签'],
      ['unknown-cat', '无效分类题', 'x', 'x'],
      ['ios', '有效题', 'y', 'y'],
    ]);

    const { drafts, errors } = parsePracticeFile(buf);
    expect(drafts.length).toBe(1);
    expect(drafts[0].question).toBe('有效题');
    expect(errors.length).toBe(1);
    expect(errors[0]).toContain('分类无效或为空');
  });
});

