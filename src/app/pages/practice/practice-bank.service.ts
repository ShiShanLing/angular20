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
 * 线上题库按题存放。保存只提交这一道题。
 */
@Injectable({ providedIn: 'root' })
export class PracticeBankService {
  private readonly http = inject(HttpClient);
  private readonly auth = inject(AuthService);

  load(track: PracticeHistoryTrack): Observable<PracticeBankRow[] | null> {
    return this.http.get<BankResponse>(`/api/practice-banks/${track}`).pipe(
      map((body) => (Array.isArray(body?.questions) ? body.questions : [])),
      catchError(() => of(null)),
    );
  }

  save(input: {
    track: PracticeHistoryTrack;
    questionId: string;
    question: string;
    answer: string;
  }): Observable<PracticeBankSaveResult> {
    if (!this.auth.isLoggedIn()) return of('local-only');
    return this.http
      .patch(`/api/practice-banks/${input.track}/questions/${encodeURIComponent(input.questionId)}`, {
        question: input.question,
        answer: input.answer,
      })
      .pipe(
        map(() => 'server' as const),
        catchError(() => of('failed' as const)),
      );
  }
}
