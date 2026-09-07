import { TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { PracticeListComponent } from './practice-list.component';
import { PracticeStorageService } from './practice-storage.service';
import { builtinSeedForScope } from './practice-builtin-seed';

describe('PracticeListComponent recite mode', () => {
  it('loads the iOS bank and expands one question like an accordion', () => {
    const storage = new PracticeStorageService();
    TestBed.configureTestingModule({
      imports: [PracticeListComponent],
      providers: [
        { provide: PracticeStorageService, useValue: storage },
        { provide: ActivatedRoute, useValue: { snapshot: { data: { reciteTrack: 'ios' } } } },
      ],
    });
    const fixture = TestBed.createComponent(PracticeListComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();

    expect(component.reciteMode).toBeTrue();
    expect(component.pageTitle()).toBe('iOS 背题');
    expect(component.allItems().length).toBe(
      builtinSeedForScope('ios-learning', 1).length +
        builtinSeedForScope('ios-objective-learning', 1).length
    );
    expect(component.filteredItems().length).toBe(component.allItems().length);

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

  it('loads every Agent short-answer and objective question in one recite list', () => {
    const storage = new PracticeStorageService();
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      imports: [PracticeListComponent],
      providers: [
        { provide: PracticeStorageService, useValue: storage },
        { provide: ActivatedRoute, useValue: { snapshot: { data: { reciteTrack: 'agent' } } } },
      ],
    });
    const fixture = TestBed.createComponent(PracticeListComponent);
    const component = fixture.componentInstance;
    component.ngOnInit();

    expect(component.pageTitle()).toBe('Agent 背题');
    expect(component.allItems().length).toBe(
      builtinSeedForScope('agent-learning', 1).length +
        builtinSeedForScope('agent-objective-learning', 1).length
    );
  });
});

describe('builtinSeedForScope', () => {
  it('returns iOS and Agent banks and empty Android seeds', () => {
    expect(builtinSeedForScope('ios-learning', 1).length).toBeGreaterThan(0);
    expect(builtinSeedForScope('agent-objective-learning', 1).length).toBeGreaterThan(0);
    expect(builtinSeedForScope('android-learning', 1).length).toBe(0);
  });
});
