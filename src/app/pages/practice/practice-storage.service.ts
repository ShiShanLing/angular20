import { Injectable } from '@angular/core';
import type { PracticeCategory, PracticeFilterCategory, PracticeItem, PracticeItemDraft } from './practice.types';

const STORAGE_KEY = 'angular20_practice_v1';
const DAILY_STATE_KEY = 'angular20_practice_daily_state_v1';
export type PracticeStorageScope = 'practice' | 'ios-learning' | 'angular-learning';

/** E2E / 调试：设为 `1` 时不自动注入内置题库（见 PracticeComponent） */
export const PRACTICE_SKIP_BUILTIN_SEED_KEY = 'angular20_practice_skip_builtin_seed_v1';

/** 刷题页记住的分类筛选（与题库数据分开存） */
export const PRACTICE_FILTER_CATEGORY_KEY = 'angular20_practice_filter_category_v1';

export interface PracticeDayRecord {
  date: string;
  itemIds: string[];
  rememberedIds: string[];
  attempts: number;
  completedAt?: number;
}

export interface PracticeDailyState {
  records: Record<string, PracticeDayRecord>;
}

const VALID_CATEGORIES: PracticeCategory[] = [
  'ios',
  'angular',
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

function scopedKey(key: string, scope: PracticeStorageScope): string {
  return scope === 'practice' ? key : `${key}_${scope}`;
}

/**
 * 知识刷题数据持久化：题库、每日练习记录与筛选分类写入 localStorage。
 */
@Injectable({ providedIn: 'root' })
export class PracticeStorageService {
  /** 读取本地题库；解析失败返回空数组。 */
  load(scope: PracticeStorageScope = 'practice'): PracticeItem[] {
    try {
      const raw = localStorage.getItem(scopedKey(STORAGE_KEY, scope));
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

  /** 全量覆盖保存题库。 */
  save(items: PracticeItem[], scope: PracticeStorageScope = 'practice'): void {
    localStorage.setItem(scopedKey(STORAGE_KEY, scope), JSON.stringify(items));
  }

  /**
   * 将内置/打包好的题目合并进本地（与导入表格相同：按「分类 + 规范化题干」去重）。
   */
  mergeItems(
    incoming: PracticeItem[],
    scope: PracticeStorageScope = 'practice'
  ): { added: number; updated: number; skipped: number } {
    const existing = this.load(scope);
    const seen = new Set(
      existing.map((i) => `${i.category}::${normQuestion(i.question)}`)
    );
    const byId = new Map(existing.map((i) => [i.id, i]));
    let added = 0;
    let updated = 0;
    let skipped = 0;

    for (const item of incoming) {
      const old = byId.get(item.id);
      if (old) {
        if (
          old.category !== item.category ||
          old.question !== item.question ||
          old.answer !== item.answer ||
          old.tags !== item.tags ||
          old.markD !== item.markD ||
          old.oralOneLiner !== item.oralOneLiner
        ) {
          old.category = item.category;
          old.question = item.question;
          old.answer = item.answer;
          old.tags = item.tags;
          old.markD = item.markD;
          old.oralOneLiner = item.oralOneLiner;
          updated++;
        }
        continue;
      }
      const key = `${item.category}::${normQuestion(item.question)}`;
      if (seen.has(key)) {
        skipped++;
        continue;
      }
      seen.add(key);
      existing.push({ ...item });
      byId.set(item.id, existing[existing.length - 1]);
      added++;
    }

    this.save(existing, scope);
    return { added, updated, skipped };
  }

  /** 将表格导入行转为题目并入库；结构与 {@link mergeItems} 类似但接受草稿类型。 */
  importDrafts(
    drafts: PracticeItemDraft[],
    scope: PracticeStorageScope = 'practice'
  ): { added: number; skipped: number } {
    const existing = this.load(scope);
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

    this.save(existing, scope);
    return { added, skipped };
  }

  /** 清除题库与每日状态键。 */
  clearAll(scope: PracticeStorageScope = 'practice'): void {
    localStorage.removeItem(scopedKey(STORAGE_KEY, scope));
    localStorage.removeItem(scopedKey(DAILY_STATE_KEY, scope));
  }

  /** 读取每日刷题打卡记录。 */
  readDailyState(scope: PracticeStorageScope = 'practice'): PracticeDailyState {
    try {
      const raw = localStorage.getItem(scopedKey(DAILY_STATE_KEY, scope));
      if (!raw) return { records: {} };
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object') return { records: {} };
      const records = (parsed as Record<string, unknown>)['records'];
      if (!records || typeof records !== 'object') return { records: {} };
      const out: Record<string, PracticeDayRecord> = {};
      for (const [date, value] of Object.entries(records as Record<string, unknown>)) {
        const record = this.parseDayRecord(date, value);
        if (record) out[date] = record;
      }
      return { records: out };
    } catch {
      return { records: {} };
    }
  }

  /** 持久化每日刷题状态。 */
  saveDailyState(state: PracticeDailyState, scope: PracticeStorageScope = 'practice'): void {
    localStorage.setItem(scopedKey(DAILY_STATE_KEY, scope), JSON.stringify(state));
  }

  /** 上次在 UI 中选中的分类筛选（与题库数据分开存）。 */
  readSavedFilterCategory(scope: PracticeStorageScope = 'practice'): PracticeFilterCategory {
    try {
      const raw = localStorage.getItem(scopedKey(PRACTICE_FILTER_CATEGORY_KEY, scope));
      if (raw === null || raw === '' || raw === 'all') return 'all';
      if (isPracticeCategory(raw)) return raw;
      return 'all';
    } catch {
      return 'all';
    }
  }

  /** 记住分类筛选供下次进入页面恢复。 */
  saveFilterCategory(f: PracticeFilterCategory, scope: PracticeStorageScope = 'practice'): void {
    try {
      localStorage.setItem(scopedKey(PRACTICE_FILTER_CATEGORY_KEY, scope), f);
    } catch {
      /* quota / 隐私模式 */
    }
  }
  
  /** 将 localStorage 中的未知 JSON 解析为 {@link PracticeItem}；字段不全则丢弃。 */
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
  
  /** 解析单日打卡记录结构。 */
  private parseDayRecord(date: string, x: unknown): PracticeDayRecord | null {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    if (!x || typeof x !== 'object') return null;
    const o = x as Record<string, unknown>;
    const itemIds = Array.isArray(o['itemIds'])
      ? o['itemIds'].filter((id): id is string => typeof id === 'string')
      : [];
    const rememberedIds = Array.isArray(o['rememberedIds'])
      ? o['rememberedIds'].filter((id): id is string => typeof id === 'string')
      : [];
    const attempts = typeof o['attempts'] === 'number' && Number.isFinite(o['attempts'])
      ? Math.max(0, Math.floor(o['attempts']))
      : 0;
    const record: PracticeDayRecord = {
      date,
      itemIds: [...new Set(itemIds)],
      rememberedIds: [...new Set(rememberedIds)],
      attempts,
    };
    
    if (typeof o['completedAt'] === 'number' && Number.isFinite(o['completedAt'])) {
      record.completedAt = o['completedAt'];
    }
    return record;
  }

  /** 统计各分类题目数量（用于 UI 徽章）。 */
  countByCategory(items: PracticeItem[]): Record<PracticeCategory, number> {
    const base: Record<PracticeCategory, number> = {
      ios: 0,
      angular: 0,
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
