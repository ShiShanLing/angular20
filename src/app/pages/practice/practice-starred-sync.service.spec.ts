import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';

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
    });
    service = TestBed.inject(PracticeStarredSyncService);
    storage = TestBed.inject(PracticeStorageService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('merges local and server starred ids then uploads the union', fakeAsync(() => {
    storage.saveStarredIds('ios', ['local-1']);

    let pulled: string[] = [];
    service.pull('ios').subscribe((ids) => {
      pulled = ids;
    });

    const req = http.expectOne((r) => r.url === '/api/records' && r.params.get('type') === 'practice-starred');
    req.flush([
      { id: 9, data: { track: 'ios', ids: ['server-1', 'local-1'] } },
    ]);

    expect(pulled.sort()).toEqual(['local-1', 'server-1']);
    expect(storage.readStarredIds('ios').sort()).toEqual(['local-1', 'server-1']);

    service.push('ios', ['local-1', 'server-1', 'new-1']);
    tick(250);
    const save = http.expectOne('/api/records/9');
    expect(save.request.method).toBe('PUT');
    expect(save.request.body.data.ids).toEqual(['local-1', 'server-1', 'new-1']);
    save.flush({ id: 9 });
  }));
});
