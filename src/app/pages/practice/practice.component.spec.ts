import { EnvironmentInjector, runInInjectionContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';

import { PracticeComponent } from './practice.component';
import { PracticeStorageService } from './practice-storage.service';
import type { PracticeItem } from './practice.types';

const msgStub = {
  success: jasmine.createSpy('success'),
  warning: jasmine.createSpy('warning'),
  error: jasmine.createSpy('error'),
  info: jasmine.createSpy('info'),
};
const modalStub = { confirm: jasmine.createSpy('confirm'), info: jasmine.createSpy('info') };

function makeItem(overrides: Partial<PracticeItem> = {}): PracticeItem {
  return {
    id: Math.random().toString(36).slice(2),
    category: 'ios',
    question: 'q?',
    answer: 'a',
    tags: '',
    importedAt: Date.now(),
    ...overrides,
  };
}

describe('PracticeComponent', () => {
  let component: PracticeComponent;

  beforeEach(() => {
    localStorage.clear();
    // Provide only services — do NOT import PracticeComponent so heavy NZ Zorro
    // templates are never compiled, preventing browser OOM/crash in tests.
    TestBed.configureTestingModule({
      providers: [
        PracticeStorageService,
        { provide: NzMessageService, useValue: msgStub },
        { provide: NzModalService, useValue: modalStub },
      ],
    });

    const injector = TestBed.inject(EnvironmentInjector);
    runInInjectionContext(injector, () => {
      component = new PracticeComponent();
    });
    component.ngOnInit();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('listForNav returns all when filter is "all" and no search', () => {
    component.items.set([makeItem({ category: 'ios' }), makeItem({ category: 'android' })]);
    component.filterCategory.set('all');
    component.searchQuery.set('');
    expect(component.listForNav().length).toBe(2);
  });

  it('listForNav filters by category when search empty', () => {
    component.items.set([
      makeItem({ category: 'ios' }),
      makeItem({ category: 'android' }),
      makeItem({ category: 'ios' }),
    ]);
    component.filterCategory.set('ios');
    component.searchQuery.set('');
    expect(component.listForNav().length).toBe(2);
    expect(component.listForNav().every(i => i.category === 'ios')).toBeTrue();
  });

  it('currentItem returns item at currentIndex', () => {
    const items = [makeItem({ question: 'q1' }), makeItem({ question: 'q2' })];
    component.items.set(items);
    component.filterCategory.set('all');
    component.currentIndex.set(1);
    expect(component.currentItem()?.question).toBe('q2');
  });

  it('currentItem returns null when list is empty', () => {
    component.items.set([]);
    expect(component.currentItem()).toBeNull();
  });

  it('next does not pass last item (extension-aligned)', () => {
    component.items.set([makeItem(), makeItem()]);
    component.filterCategory.set('all');
    component.searchQuery.set('');
    component.currentIndex.set(1);
    component.next();
    expect(component.currentIndex()).toBe(1);
  });

  it('prev does not go before first item', () => {
    component.items.set([makeItem(), makeItem(), makeItem()]);
    component.filterCategory.set('all');
    component.searchQuery.set('');
    component.currentIndex.set(0);
    component.prev();
    expect(component.currentIndex()).toBe(0);
  });

  it('setFilter resets showAnswer to false', () => {
    component.items.set([makeItem(), makeItem()]);
    component.filterCategory.set('all');
    component.showAnswer.set(true);
    component.setFilter('all');
    expect(component.showAnswer()).toBeFalse();
  });

  it('toggleAnswer flips showAnswer', () => {
    expect(component.showAnswer()).toBeFalse();
    component.toggleAnswer();
    expect(component.showAnswer()).toBeTrue();
    component.toggleAnswer();
    expect(component.showAnswer()).toBeFalse();
  });

  it('categoryLabel returns correct label for ios', () => {
    expect(component.categoryLabel('ios')).toBe('iOS');
  });

  it('statsTotal reflects items count', () => {
    component.items.set([makeItem(), makeItem(), makeItem()]);
    expect(component.statsTotal()).toBe(3);
  });
});
