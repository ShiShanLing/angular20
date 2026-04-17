import { Injectable } from '@angular/core';
import type { PracticeCategory, PracticeItem, PracticeItemDraft } from './practice.types';

const STORAGE_KEY = 'angular20_practice_v1';

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
      existing.push({
        id: newId(),
        category: d.category,
        question: d.question,
        answer: d.answer,
        tags: d.tags,
        importedAt: now,
      });
      added++;
    }

    this.save(existing);
    return { added, skipped };
  }

  clearAll(): void {
    localStorage.removeItem(STORAGE_KEY);
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
    return {
      id: o['id'],
      category: cat,
      question: o['question'],
      answer: o['answer'],
      tags,
      importedAt: o['importedAt'],
    };
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
