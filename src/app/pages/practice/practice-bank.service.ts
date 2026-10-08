import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

import { AuthService } from '../../core/auth.service';
import type { PracticeHistoryTrack } from './practice-storage.service';
import { type PracticeBankRow } from './practice-bank.map';

export type PracticeBankSaveResult = 'server' | 'local-only' | 'failed';

interface BankResponse {
  questions?: PracticeBankRow[];
}

/**
 * 线上题库：页面优先读服务器上的整份题目。
 * 服务器还没有这一科时，第一次保存会把当前底稿整份写上去。
 */
@Injectable({ providedIn: 'root' })
export class PracticeBankService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  load(track: PracticeHistoryTrack): Observable<PracticeBankRow[] | null> {
    return this.http.get<BankResponse>(`/api/practice-banks/${track}`).pipe(
      map((body) => (Array.isArray(body?.questions) ? body.questions : null)),
      catchError(() => of(null)),
    );
  }

  save(input: {
    track: PracticeHistoryTrack;
    questionId: string;
    question: string;
    answer: string;
    serverReady: boolean;
    rows: PracticeBankRow[];
  }): Observable<PracticeBankSaveResult> {
    if (!this.auth.isLoggedIn()) return of('local-only');
    const patch = { question: input.question, answer: input.answer };
    if (input.serverReady) {
      return this.http
        .patch(`/api/practice-banks/${input.track}/questions/${encodeURIComponent(input.questionId)}`, patch)
        .pipe(
          map(() => 'server' as const),
          catchError(() => of('failed' as const)),
        );
    }
    const questions = input.rows.map((row) =>
      String(row['id']) === input.questionId ? { ...row, ...patch } : row,
    );
    return this.http.put(`/api/practice-banks/${input.track}`, { questions }).pipe(
      map(() => 'server' as const),
      catchError(() => of('failed' as const)),
    );
  }
}
