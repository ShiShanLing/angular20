import { TestBed } from '@angular/core/testing';

import type { PracticeItemDraft } from './practice.types';
import {
  PRACTICE_FILTER_CATEGORY_KEY,
  PracticeStorageService,
} from './practice-storage.service';

describe('PracticeStorageService', () => {
  let service: PracticeStorageService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({});
    service = TestBed.inject(PracticeStorageService);
  });

  it('loads empty list when storage is empty', () => {
    expect(service.load()).toEqual([]);
  });

  it('imports drafts and skips duplicates by category + normalized question', () => {
    const drafts: PracticeItemDraft[] = [
      {
        category: 'ios',
        question: '什么是 ARC？',
        answer: '自动引用计数',
        tags: '内存',
        sourceRow: 2,
      },
      {
        category: 'ios',
        question: ' 什么是   ARC？ ',
        answer: '重复题干',
        tags: '重复',
        sourceRow: 3,
      },
      {
        category: 'android',
        question: '什么是 Handler',
        answer: '消息机制',
        tags: '线程',
        sourceRow: 4,
      },
    ];

    const result = service.importDrafts(drafts);
    expect(result.added).toBe(2);
    expect(result.skipped).toBe(1);
    expect(service.load().length).toBe(2);
  });

  it('updates existing built-in items by id when merging seed data', () => {
    const first = {
      id: 'builtin-1',
      category: 'ios' as const,
      question: 'q1',
      answer: 'old',
      tags: 'Foundation · Easy',
      importedAt: 1,
    };
    service.save([first]);

    const result = service.mergeItems([
      {
        ...first,
        answer: '| A | B |\\n|---|---|\\n| 1 | 2 |',
        markD: true,
        oralOneLiner: 'new line',
        importedAt: 2,
      },
    ]);

    expect(result).toEqual({ added: 0, updated: 1, skipped: 0 });
    expect(service.load()[0]).toEqual(
      jasmine.objectContaining({
        answer: '| A | B |\\n|---|---|\\n| 1 | 2 |',
        markD: true,
        oralOneLiner: 'new line',
      })
    );
  });

  it('counts items by category', () => {
    service.importDrafts([
      { category: 'ios', question: 'q1', answer: '', tags: '', sourceRow: 2 },
      { category: 'ios', question: 'q2', answer: '', tags: '', sourceRow: 3 },
      { category: 'angular-ts', question: 'q3', answer: '', tags: '', sourceRow: 4 },
    ]);

    const counts = service.countByCategory(service.load());
    expect(counts.ios).toBe(2);
    expect(counts['angular-ts']).toBe(1);
    expect(counts.android).toBe(0);
  });

  it('clears all items', () => {
    service.importDrafts([
      { category: 'ios', question: 'q1', answer: '', tags: '', sourceRow: 2 },
    ]);
    expect(service.load().length).toBe(1);

    service.clearAll();
    expect(service.load()).toEqual([]);
  });

  it('appends session history newest first and keeps it when clearing questions', () => {
    service.appendSessionRecord({
      kind: 'review',
      at: 100,
      score: 3,
      total: 5,
      percent: 60,
      questionMode: 'objective',
      wrongCount: 2,
    }, 'ios-learning');
    service.appendSessionRecord({
      kind: 'daily',
      at: 200,
      score: 5,
      total: 5,
      percent: 100,
      questionMode: 'subjective',
      wrongCount: 0,
    }, 'ios-learning');

    const history = service.readSessionHistory('ios-learning').records;
    expect(history.length).toBe(2);
    expect(history[0].kind).toBe('daily');
    expect(history[0].percent).toBe(100);
    expect(history[1].score).toBe(3);

    service.clearAll('ios-learning');
    expect(service.readSessionHistory('ios-learning').records.length).toBe(2);
  });

  it('merges subjective and objective scopes for a subject track in chronological order', () => {
    service.appendSessionRecord({
      kind: 'review',
      at: 300,
      score: 8,
      total: 10,
      percent: 80,
      questionMode: 'objective',
      wrongCount: 2,
    }, 'ios-objective-learning');
    service.appendSessionRecord({
      kind: 'daily',
      at: 100,
      score: 5,
      total: 5,
      percent: 100,
      questionMode: 'subjective',
      wrongCount: 0,
    }, 'ios-learning');

    const merged = service.readSessionHistoryForTrack('ios');
    expect(merged.map((record) => record.percent)).toEqual([100, 80]);
    expect(merged.map((record) => record.kind)).toEqual(['daily', 'review']);
  });

  it('persists and reads filter category', () => {
    expect(service.readSavedFilterCategory()).toBe('all');
    service.saveFilterCategory('ios');
    expect(localStorage.getItem(PRACTICE_FILTER_CATEGORY_KEY)).toBe('ios');
    expect(service.readSavedFilterCategory()).toBe('ios');
  });

  it('readSavedFilterCategory falls back for invalid value', () => {
    localStorage.setItem(PRACTICE_FILTER_CATEGORY_KEY, 'not-a-category');
    expect(service.readSavedFilterCategory()).toBe('all');
  });
});
