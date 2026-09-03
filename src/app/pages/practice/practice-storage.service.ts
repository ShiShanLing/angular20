import { Injectable } from '@angular/core';
import type { PracticeCategory, PracticeFilterCategory, PracticeItem, PracticeItemDraft } from './practice.types';

const STORAGE_KEY = 'angular20_practice_v1';
const DAILY_STATE_KEY = 'angular20_practice_daily_state_v1';
const SESSION_HISTORY_KEY = 'angular20_practice_session_history_v1';
const SESSION_HISTORY_MAX = 80;
export type PracticeStorageScope =
  | 'practice'
  | 'ios-learning'
  | 'ios-objective-learning'
  | 'android-learning'
  | 'android-objective-learning'
  | 'angular-learning'
  | 'angular-objective-learning'
  | 'ts-learning'
  | 'ts-objective-learning';
export type PracticeHistoryTrack = 'ios' | 'android' | 'angular' | 'ts' | 'practice';

export const PRACTICE_HISTORY_TRACK_SCOPES: Record<PracticeHistoryTrack, PracticeStorageScope[]> = {
  ios: ['ios-learning', 'ios-objective-learning'],
  android: ['android-learning', 'android-objective-learning'],
  angular: ['angular-learning', 'angular-objective-learning'],
  ts: ['ts-learning', 'ts-objective-learning'],
  practice: ['practice'],
};

export const PRACTICE_HISTORY_TRACK_LABELS: Record<PracticeHistoryTrack, string> = {
  ios: 'iOS',
  android: 'Android',
  angular: 'Angular',
  ts: 'TypeScript',
  practice: '知识刷题',
};

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

export type PracticeSessionKind = 'daily' | 'review';
export type PracticeQuestionMode = 'objective' | 'subjective';

export interface PracticeSessionRecord {
  id: string;
  kind: PracticeSessionKind;
  at: number;
  score: number;
  total: number;
  percent: number;
  questionMode: PracticeQuestionMode;
  wrongCount: number;
}

export interface PracticeSessionHistory {
  records: PracticeSessionRecord[];
}

const VALID_CATEGORIES: PracticeCategory[] = [
  'ios',
  'angular',
  'android',
  'angular-ts',
  'angular-js',
  'angular-css',
];

// MARK: 判断
function isPracticeCategory(x: string): x is PracticeCategory {
  return (VALID_CATEGORIES as string[]).includes(x);
}

// MARK: 新建
function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `q-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// MARK: 题目
function normQuestion(q: string): string {
  return q.trim().replace(/\s+/g, ' ').toLowerCase();
}

// MARK: 键
function scopedKey(key: string, scope: PracticeStorageScope): string {
  return scope === 'practice' ? key : `${key}_${scope}`;
}

/**
 * 知识刷题数据持久化：题库、每日练习记录与筛选分类写入 localStorage。
 */
@Injectable({ providedIn: 'root' })
export class PracticeStorageService {
  // MARK: 加载数据
  // 读取本地题库；解析失败返回空数组。
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

  // MARK: 保存
  // 全量覆盖保存题库。
  save(items: PracticeItem[], scope: PracticeStorageScope = 'practice'): void {
    localStorage.setItem(scopedKey(STORAGE_KEY, scope), JSON.stringify(items));
  }

  // MARK: 合并
  // 将内置/打包好的题目合并进本地（与导入表格相同：按「分类 + 规范化题干」去重）。
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
          old.oralOneLiner !== item.oralOneLiner ||
          old.questionType !== item.questionType ||
          JSON.stringify(old.options ?? []) !== JSON.stringify(item.options ?? []) ||
          JSON.stringify(old.correctAnswers ?? []) !== JSON.stringify(item.correctAnswers ?? []) ||
          old.explanation !== item.explanation ||
          old.sourceQuestionId !== item.sourceQuestionId
        ) {
          old.category = item.category;
          old.question = item.question;
          old.answer = item.answer;
          old.tags = item.tags;
          old.markD = item.markD;
          old.oralOneLiner = item.oralOneLiner;
          old.questionType = item.questionType;
          old.options = item.options;
          old.correctAnswers = item.correctAnswers;
          old.explanation = item.explanation;
          old.sourceQuestionId = item.sourceQuestionId;
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

  // MARK: 导入
  // 将表格导入行转为题目并入库；结构与 {@link mergeItems} 类似但接受草稿类型。
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

  // MARK: 清空
  // 清除题库与每日状态键。
  clearAll(scope: PracticeStorageScope = 'practice'): void {
    localStorage.removeItem(scopedKey(STORAGE_KEY, scope));
    localStorage.removeItem(scopedKey(DAILY_STATE_KEY, scope));
  }

  // MARK: 读取
  // 读取每日刷题打卡记录。
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

  // MARK: 保存
  // 持久化每日刷题状态。
  saveDailyState(state: PracticeDailyState, scope: PracticeStorageScope = 'practice'): void {
    localStorage.setItem(scopedKey(DAILY_STATE_KEY, scope), JSON.stringify(state));
  }

  // MARK: 读取
  // 上次在 UI 中选中的分类筛选（与题库数据分开存）。
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

  // MARK: 保存
  // 记住分类筛选供下次进入页面恢复。
  saveFilterCategory(f: PracticeFilterCategory, scope: PracticeStorageScope = 'practice'): void {
    try {
      localStorage.setItem(scopedKey(PRACTICE_FILTER_CATEGORY_KEY, scope), f);
    } catch {
      /* quota / 隐私模式 */
    }
  }

  // MARK: 读取
  // 读取本科目学习 / 复习成绩历史。
  readSessionHistory(scope: PracticeStorageScope = 'practice'): PracticeSessionHistory {
    try {
      const raw = localStorage.getItem(scopedKey(SESSION_HISTORY_KEY, scope));
      if (!raw) return { records: [] };
      const parsed = JSON.parse(raw) as unknown;
      if (!parsed || typeof parsed !== 'object') return { records: [] };
      const records = (parsed as Record<string, unknown>)['records'];
      if (!Array.isArray(records)) return { records: [] };
      const out: PracticeSessionRecord[] = [];
      for (const value of records) {
        const record = this.parseSessionRecord(value);
        if (record) out.push(record);
      }
      return { records: out };
    } catch {
      return { records: [] };
    }
  }

  // MARK: 保存
  // 追加一条成绩记录，最新的在前。
  appendSessionRecord(
    record: Omit<PracticeSessionRecord, 'id'>,
    scope: PracticeStorageScope = 'practice'
  ): PracticeSessionHistory {
    const current = this.readSessionHistory(scope);
    const next: PracticeSessionHistory = {
      records: [{ ...record, id: newId() }, ...current.records].slice(0, SESSION_HISTORY_MAX),
    };
    this.saveSessionHistory(next, scope);
    return next;
  }

  // MARK: 保存
  saveSessionHistory(state: PracticeSessionHistory, scope: PracticeStorageScope = 'practice'): void {
    localStorage.setItem(scopedKey(SESSION_HISTORY_KEY, scope), JSON.stringify(state));
  }

  // MARK: 读取
  // 合并一个科目下各题型 scope 的成绩，按时间从早到晚。
  readSessionHistoryForTrack(track: PracticeHistoryTrack): PracticeSessionRecord[] {
    const byId = new Map<string, PracticeSessionRecord>();
    for (const scope of PRACTICE_HISTORY_TRACK_SCOPES[track]) {
      for (const record of this.readSessionHistory(scope).records) {
        byId.set(record.id, record);
      }
    }
    return [...byId.values()].sort((a, b) => a.at - b.at);
  }
  
  // MARK: 解析
  // 将 localStorage 中的未知 JSON 解析为 {@link PracticeItem}；字段不全则丢弃。
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
    if (
      o['questionType'] === 'shortAnswer' ||
      o['questionType'] === 'trueFalse' ||
      o['questionType'] === 'single' ||
      o['questionType'] === 'multiple'
    ) {
      item.questionType = o['questionType'];
    }
    if (Array.isArray(o['options'])) {
      const options = o['options']
        .filter((opt): opt is Record<string, unknown> => !!opt && typeof opt === 'object')
        .map((opt) => ({
          id: typeof opt['id'] === 'string' ? opt['id'] : '',
          text: typeof opt['text'] === 'string' ? opt['text'] : '',
        }))
        .filter((opt) => opt.id && opt.text);
      if (options.length) item.options = options;
    }
    if (Array.isArray(o['correctAnswers'])) {
      const correctAnswers = o['correctAnswers'].filter((id): id is string => typeof id === 'string');
      if (correctAnswers.length) item.correctAnswers = [...new Set(correctAnswers)];
    }
    if (typeof o['explanation'] === 'string') {
      item.explanation = o['explanation'];
    }
    if (typeof o['sourceQuestionId'] === 'string') {
      item.sourceQuestionId = o['sourceQuestionId'];
    }
    return item;
  }
  
  // MARK: 解析
  // 解析单日打卡记录结构。
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

  // MARK: 解析
  private parseSessionRecord(x: unknown): PracticeSessionRecord | null {
    if (!x || typeof x !== 'object') return null;
    const o = x as Record<string, unknown>;
    if (typeof o['id'] !== 'string' || !o['id']) return null;
    if (o['kind'] !== 'daily' && o['kind'] !== 'review') return null;
    if (o['questionMode'] !== 'objective' && o['questionMode'] !== 'subjective') return null;
    if (typeof o['at'] !== 'number' || !Number.isFinite(o['at'])) return null;
    if (typeof o['score'] !== 'number' || !Number.isFinite(o['score'])) return null;
    if (typeof o['total'] !== 'number' || !Number.isFinite(o['total'])) return null;
    if (typeof o['percent'] !== 'number' || !Number.isFinite(o['percent'])) return null;
    const wrongCount = typeof o['wrongCount'] === 'number' && Number.isFinite(o['wrongCount'])
      ? Math.max(0, Math.floor(o['wrongCount']))
      : 0;
    return {
      id: o['id'],
      kind: o['kind'],
      at: o['at'],
      score: o['score'],
      total: Math.max(0, o['total']),
      percent: Math.max(0, Math.min(100, Math.round(o['percent']))),
      questionMode: o['questionMode'],
      wrongCount,
    };
  }

  // MARK: 计数
  // 统计各分类题目数量（用于 UI 徽章）。
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
