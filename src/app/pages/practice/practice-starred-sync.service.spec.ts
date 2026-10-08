import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { AuthService } from '../../core/auth.service';
import { PracticeStorageService } from './practice-storage.service';
import { PracticeStarredSyncService } from './practice-starred-sync.service';

describe('PracticeStarredSyncService', () => {
  let service: PracticeStarredSyncService;
  let storage: PracticeStorageService;
  let http: HttpTestingController;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [{ provide: AuthService, useValue: { isLoggedIn: () => true } }],
    });
    service = TestBed.inject(PracticeStarredSyncService);
    storage = TestBed.inject(PracticeStorageService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('merges local stars into the per-question table', () => {
    storage.saveStarredIds('ios', ['local-1']);

    let pulled: string[] = [];
    service.pull('ios').subscribe((ids) => {
      pulled = ids;
    });

    const load = http.expectOne('/api/practice-stars/ios');
    expect(load.request.method).toBe('GET');
    load.flush({ ids: ['server-1'] });

    const save = http.expectOne('/api/practice-stars/ios');
    expect(save.request.method).toBe('POST');
    expect(save.request.body.ids).toEqual(['local-1']);
    save.flush({ ids: ['server-1', 'local-1'] });

    expect(pulled.sort()).toEqual(['local-1', 'server-1']);
    expect(storage.readStarredIds('ios').sort()).toEqual(['local-1', 'server-1']);

    service.setStarred('ios', 'new-1', true);
    const add = http.expectOne('/api/practice-stars/ios/new-1');
    expect(add.request.method).toBe('PUT');
    add.flush({ ids: ['server-1', 'local-1', 'new-1'] });

    service.setStarred('ios', 'local-1', false);
    const remove = http.expectOne('/api/practice-stars/ios/local-1');
    expect(remove.request.method).toBe('DELETE');
    remove.flush({ ids: ['server-1', 'new-1'] });
  });
});
