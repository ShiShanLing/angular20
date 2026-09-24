import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { EMPTY } from 'rxjs';

import { PracticeListComponent } from './practice-list.component';
import { PracticeStorageService } from './practice-storage.service';
import { PracticeStarredSyncService } from './practice-starred-sync.service';
import { builtinSeedForScope } from './practice-builtin-seed';

const silentStarSync = {
  pull: () => EMPTY,
  push: () => undefined,
};

describe('PracticeListComponent recite mode', () => {
  it('loads the iOS bank and expands one question like an accordion', () => {
    const storage = new PracticeStorageService();
    TestBed.configureTestingModule({
      imports: [PracticeListComponent],
      providers: [
        { provide: PracticeStorageService, useValue: storage },
        { provide: PracticeStarredSyncService, useValue: silentStarSync },
        { provide: ActivatedRoute, useValue: { snapshot: { data: { reciteTrack: 'ios' } } } },
      ],
    });
    const fixture = TestBed.createComponent(PracticeListComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();

    expect(component.reciteMode).toBeTrue();
    expect(component.pageTitle()).toBe('iOS 背题');
    expect(component.allItems().length).toBe(builtinSeedForScope('ios-learning', 1).length);
    expect(component.filteredItems().length).toBe(component.allItems().length);
    expect(component.allItems().every((item) => !item.questionType || item.questionType === 'shortAnswer')).toBeTrue();

    const firstId = component.allItems()[0].id;
    component.toggleExpand(firstId);
    expect(component.expandedIds().has(firstId)).toBeTrue();
    expect(component.revealedIds().has(firstId)).toBeTrue();

    const secondId = component.allItems()[1]?.id;
    if (secondId) {
      component.toggleExpand(secondId);
      expect(component.expandedIds().has(firstId)).toBeFalse();
      expect(component.expandedIds().has(secondId)).toBeTrue();
    }
  });

  it('loads only Agent short-answer questions in the recite list', () => {
    const storage = new PracticeStorageService();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PracticeListComponent],
      providers: [
        { provide: PracticeStorageService, useValue: storage },
        { provide: PracticeStarredSyncService, useValue: silentStarSync },
        { provide: ActivatedRoute, useValue: { snapshot: { data: { reciteTrack: 'agent' } } } },
      ],
    });
    const fixture = TestBed.createComponent(PracticeListComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();

    expect(component.pageTitle()).toBe('Agent 背题');
    expect(component.allItems().length).toBe(builtinSeedForScope('agent-learning', 1).length);
    expect(component.allItems().some((item) => item.questionType === 'trueFalse' || item.questionType === 'single' || item.questionType === 'multiple')).toBeFalse();
  });

  it('keeps the full recite list and jumps to the first matched question when searching', () => {
    const storage = new PracticeStorageService();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PracticeListComponent],
      providers: [
        { provide: PracticeStorageService, useValue: storage },
        { provide: PracticeStarredSyncService, useValue: silentStarSync },
        { provide: ActivatedRoute, useValue: { snapshot: { data: { reciteTrack: 'ios' } } } },
      ],
    });
    const fixture = TestBed.createComponent(PracticeListComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();

    const total = component.filteredItems().length;
    const first = component.allItems().find((item) => item.question.includes('ARC'));
    expect(first).toBeTruthy();

    component.onSearchChange('ARC');

    expect(component.filteredItems().length).toBe(total);
    expect(component.searchResults().length).toBeGreaterThan(0);
    expect(component.searchResults()[0].id).toBe(first!.id);
    expect(component.expandedIds().has(first!.id)).toBeTrue();
    expect(component.revealedIds().has(first!.id)).toBeTrue();
  });

  it('stars a question and filters the recite list to starred items only', () => {
    localStorage.clear();
    const storage = new PracticeStorageService();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PracticeListComponent],
      providers: [
        { provide: PracticeStorageService, useValue: storage },
        { provide: PracticeStarredSyncService, useValue: silentStarSync },
        { provide: ActivatedRoute, useValue: { snapshot: { data: { reciteTrack: 'ios' } } } },
      ],
    });
    const fixture = TestBed.createComponent(PracticeListComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();

    const total = component.filteredItems().length;
    const firstId = component.allItems()[0].id;
    const secondId = component.allItems()[1].id;

    component.toggleStar(firstId, new Event('click'));
    expect(component.isStarred(firstId)).toBeTrue();
    expect(storage.readStarredIds('ios')).toEqual([firstId]);
    expect(component.filteredItems().length).toBe(total);

    component.toggleStarredOnly();
    expect(component.starredOnly()).toBeTrue();
    expect(component.filteredItems().map((item) => item.id)).toEqual([firstId]);

    component.toggleStar(secondId, new Event('click'));
    expect(component.filteredItems().map((item) => item.id)).toEqual([firstId, secondId]);

    component.toggleStarredOnly();
    expect(component.starredOnly()).toBeFalse();
    expect(component.filteredItems().length).toBe(total);
  });

  it('builds a contacts-style index every 10 questions and jumps to that decade', () => {
    const storage = new PracticeStorageService();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PracticeListComponent],
      providers: [
        { provide: PracticeStorageService, useValue: storage },
        { provide: PracticeStarredSyncService, useValue: silentStarSync },
        { provide: ActivatedRoute, useValue: { snapshot: { data: { reciteTrack: 'ios' } } } },
      ],
    });
    const fixture = TestBed.createComponent(PracticeListComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();

    const lastNo = component.allItems().at(-1)?.no ?? component.allItems().length;
    expect(component.indexTicks()[0]).toBe(0);
    expect(component.indexTicks()).toContain(10);
    expect(component.indexTicks()).toContain(20);
    expect(component.indexTicks().at(-1)).toBe(Math.floor(lastNo / 10) * 10);

    const tenth = component.allItems().find((item) => item.no === 10);
    expect(tenth).toBeTruthy();
    expect(component.indexTargetId(10)).toBe(tenth!.id);
    expect(component.indexTargetId(0)).toBe(component.allItems()[0].id);

    component.toggleStar(component.allItems()[0].id, new Event('click'));
    component.toggleStarredOnly();
    expect(component.indexTicks()).toEqual([0]);
  });
});

describe('builtinSeedForScope', () => {
  it('loads the merged frontend bank for recite', () => {
    const storage = new PracticeStorageService();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PracticeListComponent],
      providers: [
        { provide: PracticeStorageService, useValue: storage },
        { provide: PracticeStarredSyncService, useValue: silentStarSync },
        { provide: ActivatedRoute, useValue: { snapshot: { data: { reciteTrack: 'frontend' } } } },
      ],
    });
    const fixture = TestBed.createComponent(PracticeListComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();

    expect(component.pageTitle()).toBe('前端 背题');
    expect(component.filteredItems().length).toBe(652);
    expect(component.filteredItems()[0].question).toContain('Zone');
  });

  it('loads the merged frontend seed categories', () => {
    const items = builtinSeedForScope('frontend-learning', 1);
    expect(items.length).toBe(652);
    expect(items[0].id).toBe('angular-0001');
    expect(items[0].no).toBe(1);
    expect(items.at(-1)?.no).toBe(652);
    expect(items.some((item) => item.id === 'ng-angular-injection-token')).toBeTrue();
    expect(new Set(items.map((item) => item.tags.split(' · ')[0]))).toEqual(
      new Set(['Angular', 'JavaScript', 'TypeScript', 'RxJS']),
    );
  });

  it('returns iOS and Agent banks and empty Android seeds', () => {
    expect(builtinSeedForScope('ios-learning', 1).length).toBeGreaterThan(0);
    expect(builtinSeedForScope('agent-objective-learning', 1).length).toBeGreaterThan(0);
    expect(builtinSeedForScope('android-learning', 1).length).toBe(0);
  });

  it('copies sequential JSON numbers onto each seed item', () => {
    const items = builtinSeedForScope('ios-learning', 1);
    expect(items.map((item) => item.no)).toEqual(items.map((_, index) => index + 1));
    expect(builtinSeedForScope('ios-objective-learning', 1)[0].no).toBe(1);
  });

  it('places Codable intro questions before CodingKeys mapping', () => {
    const ids = builtinSeedForScope('ios-learning', 1).map((item) => item.id);
    const what = ids.indexOf('ios-swift-codable-what-is');
    const usage = ids.indexOf('ios-swift-codable-basic-usage');
    const mapping = ids.indexOf('ios-swift-codable-key-mapping');
    expect(what).toBeGreaterThan(-1);
    expect(usage).toBeGreaterThan(what);
    expect(mapping).toBeGreaterThan(usage);
  });
});
