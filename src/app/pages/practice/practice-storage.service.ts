import { Injectable } from '@angular/core';
import type { PracticeCategory, PracticeFilterCategory, PracticeItem, PracticeItemDraft } from './practice.types';

const STORAGE_KEY = 'angular20_practice_v1';

/** E2E / 调试：设为 `1` 时不自动注入内置题库（见 PracticeComponent） */
export const PRACTICE_SKIP_BUILTIN_SEED_KEY = 'angular20_practice_skip_builtin_seed_v1';

/** 刷题页记住的分类筛选（与题库数据分开存） */
export const PRACTICE_FILTER_CATEGORY_KEY = 'angular20_practice_filter_category_v1';

const VALID_CATEGORIES: PracticeCategory[] = [
  'ios',
  'android',
  'angular-ts',
  'angular-js',
  'angular-css',
];

function isPracticeCategory(x: string): x is PracticeCategory {
  return (VALID_CATEGORIES as string[]).includes(x);
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function normQuestion(q: string): string {
  return q.trim().replace(/\s+/g, ' ').toLowerCase();
}

@Injectable({ providedIn: 'root' })
export class PracticeStorageService {
  load(): PracticeItem[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) return [];
      const out: PracticeItem[] = [];
      for (const x of parsed) {
        const item = this.parseItem(x);
        if (item) out.push(item);
      }
      return out;
    } catch {
      return [];
    }
  }

  save(items: PracticeItem[]): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }

  /**
   * 将内置/打包好的题目合并进本地（与导入表格相同：按「分类 + 规范化题干」去重）。
   */
  mergeItems(incoming: PracticeItem[]): { added: number; skipped: number } {
    const existing = this.load();
    const seen = new Set(
      existing.map((i) => `${i.category}::${normQuestion(i.question)}`)
    );
    let added = 0;
    let skipped = 0;

    for (const item of incoming) {
      const key = `${item.category}::${normQuestion(item.question)}`;
      if (seen.has(key)) {
        skipped++;
        continue;
      }
      seen.add(key);
      existing.push({ ...item });
      added++;
    }

    this.save(existing);
    return { added, skipped };
  }

  importDrafts(drafts: PracticeItemDraft[]): { added: number; skipped: number } {
    const existing = this.load();
    const seen = new Set(
      existing.map((i) => `${i.category}::${normQuestion(i.question)}`)
    );
    let added = 0;
    let skipped = 0;
    const now = Date.now();

    for (const d of drafts) {
      const key = `${d.category}::${normQuestion(d.question)}`;
      if (seen.has(key)) {
        skipped++;
        continue;
      }
      seen.add(key);
      const row: PracticeItem = {
        id: newId(),
        category: d.category,
        question: d.question,
        answer: d.answer,
        tags: d.tags,
        importedAt: now,
      };
      if ('markD' in d && d.markD === true) {
        row.markD = true;
      }
      if (typeof d.oralOneLiner === 'string' && d.oralOneLiner.trim()) {
        row.oralOneLiner = d.oralOneLiner.trim();
      }
      existing.push(row);
      added++;
    }

    this.save(existing);
    return { added, skipped };
  }

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
  }

  readSavedFilterCategory(): PracticeFilterCategory {
    try {
      const raw = localStorage.getItem(PRACTICE_FILTER_CATEGORY_KEY);
      if (raw === null || raw === '' || raw === 'all') return 'all';
      if (isPracticeCategory(raw)) return raw;
      return 'all';
    } catch {
      return 'all';
    }
  }

  saveFilterCategory(f: PracticeFilterCategory): void {
    try {
      localStorage.setItem(PRACTICE_FILTER_CATEGORY_KEY, f);
    } catch {
      /* quota / 隐私模式 */
    }
  }

  private parseItem(x: unknown): PracticeItem | null {
    if (!x || typeof x !== 'object') return null;
    const o = x as Record<string, unknown>;
    if (
      typeof o['id'] !== 'string' ||
      typeof o['category'] !== 'string' ||
      typeof o['question'] !== 'string' ||
      typeof o['answer'] !== 'string' ||
      typeof o['importedAt'] !== 'number'
    ) {
      return null;
    }
    const tags = typeof o['tags'] === 'string' ? o['tags'] : '';
    const cat = o['category'];
    if (!isPracticeCategory(cat)) return null;
    const item: PracticeItem = {
      id: o['id'],
      category: cat,
      question: o['question'],
      answer: o['answer'],
      tags,
      importedAt: o['importedAt'],
    };
    if (o['markD'] === true) {
      item.markD = true;
    }
    if (typeof o['oralOneLiner'] === 'string' && o['oralOneLiner'].trim()) {
      item.oralOneLiner = o['oralOneLiner'].trim();
    }
    return item;
  }

  countByCategory(items: PracticeItem[]): Record<PracticeCategory, number> {
    const base: Record<PracticeCategory, number> = {
      ios: 0,
      android: 0,
      'angular-ts': 0,
      'angular-js': 0,
      'angular-css': 0,
    };
    for (const i of items) {
      if (i.category in base) base[i.category]++;
    }
    return base;
  }
}
