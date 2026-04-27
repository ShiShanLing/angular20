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

