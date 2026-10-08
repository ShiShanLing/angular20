import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';

import { AuthService } from '../../core/auth.service';
import { PracticeStorageService, type PracticeHistoryTrack } from './practice-storage.service';

interface StarResponse {
  ids?: unknown;
}

/**
 * 背题标星：本机立刻生效。登录后每个星是收藏表里的一行。
 */
@Injectable({ providedIn: 'root' })
export class PracticeStarredSyncService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);
  private readonly storage = inject(PracticeStorageService);

  pull(track: PracticeHistoryTrack): Observable<string[]> {
    const localIds = this.storage.readStarredIds(track);
    if (!this.auth.isLoggedIn()) return of(localIds);
    return this.http.get<StarResponse>(`/api/practice-stars/${track}`).pipe(
      switchMap((body) => {
        const serverIds = this.cleanIds(body?.ids);
        const merged = [...new Set([...serverIds, ...localIds])];
        this.storage.saveStarredIds(track, merged);
        const missing = merged.filter((id) => !serverIds.includes(id));
        if (!missing.length) return of(merged);
        return this.http.post<StarResponse>(`/api/practice-stars/${track}`, { ids: missing }).pipe(
          map((saved) => {
            const ids = this.cleanIds(saved?.ids);
            return ids.length ? ids : merged;
          }),
          tap((ids) => this.storage.saveStarredIds(track, ids)),
          catchError(() => of(merged)),
        );
      }),
      catchError(() => of(localIds)),
    );
  }

  setStarred(track: PracticeHistoryTrack, questionId: string, starred: boolean): void {
    if (!this.auth.isLoggedIn()) return;
    const url = `/api/practice-stars/${track}/${encodeURIComponent(questionId)}`;
    const request = starred ? this.http.put(url, {}) : this.http.delete(url);
    request.pipe(catchError(() => of(null))).subscribe();
  }

  private cleanIds(ids: unknown): string[] {
    if (!Array.isArray(ids)) return [];
    return ids.filter((id): id is string => typeof id === 'string' && !!id);
  }
}
