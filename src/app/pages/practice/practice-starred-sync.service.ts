import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { RecordService } from '../../services/record.service';
import { PracticeStorageService, type PracticeHistoryTrack } from './practice-storage.service';

export const PRACTICE_STARRED_RECORD_TYPE = 'practice-starred';

interface StarredRecordRow {
  id?: number;
  data?: {
    track?: string;
    ids?: unknown;
  };
}

/**
 * 背题标星多端同步：本机 localStorage 立刻生效，登录账号再写入 records 表。
 */
@Injectable({ providedIn: 'root' })
export class PracticeStarredSyncService {
  private readonly records = inject(RecordService);
  private readonly storage = inject(PracticeStorageService);
  private readonly serverRowId = new Map<PracticeHistoryTrack, number>();
  private pushTimer: ReturnType<typeof setTimeout> | null = null;
  private pending: { track: PracticeHistoryTrack; ids: string[] } | null = null;

  pull(track: PracticeHistoryTrack): Observable<string[]> {
    const localIds = this.storage.readStarredIds(track);
    return this.records.getAll(PRACTICE_STARRED_RECORD_TYPE).pipe(
      map((rows) => this.mergeFromServer(track, localIds, Array.isArray(rows) ? rows : [])),
      catchError(() => of(localIds)),
    );
  }

  push(track: PracticeHistoryTrack, ids: string[]): void {
    this.pending = { track, ids };
    if (this.pushTimer) clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => this.flush(), 250);
  }

  private mergeFromServer(track: PracticeHistoryTrack, localIds: string[], rows: StarredRecordRow[]): string[] {
    const row = rows.find((item) => item?.data?.track === track);
    if (typeof row?.id === 'number' && row.id > 0) {
      this.serverRowId.set(track, row.id);
    }
    const serverIds = Array.isArray(row?.data?.ids)
      ? row.data.ids.filter((id): id is string => typeof id === 'string' && !!id)
      : [];
    const merged = [...new Set([...serverIds, ...localIds])];
    this.storage.saveStarredIds(track, merged);
    if (!this.sameIds(merged, serverIds)) {
      this.push(track, merged);
    }
    return merged;
  }

  private flush(): void {
    const job = this.pending;
    this.pending = null;
    this.pushTimer = null;
    if (!job) return;

    const data = { track: job.track, ids: job.ids };
    const rowId = this.serverRowId.get(job.track);
    const req$ =
      rowId && rowId > 0
        ? this.records.update(rowId, data)
        : this.records.create(PRACTICE_STARRED_RECORD_TYPE, data);

    req$.pipe(catchError(() => of(null))).subscribe((row) => {
      const id = (row as StarredRecordRow | null)?.id;
      if (typeof id === 'number' && id > 0) {
        this.serverRowId.set(job.track, id);
      }
    });
  }

  private sameIds(a: string[], b: string[]): boolean {
    if (a.length !== b.length) return false;
    const left = [...a].sort();
    const right = [...b].sort();
    return left.every((id, index) => id === right[index]);
  }
}
