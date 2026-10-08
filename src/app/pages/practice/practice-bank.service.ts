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

interface ImportResponse {
  added?: number;
  skipped?: number;
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

  create(input: {
    track: PracticeHistoryTrack;
    question: string;
    answer: string;
    sort: number;
  }): Observable<{ status: PracticeBankSaveResult; row?: PracticeBankRow }> {
    if (!this.auth.isLoggedIn()) return of({ status: 'local-only' });
    return this.http
      .post<PracticeBankRow>(`/api/practice-banks/${input.track}/questions`, {
        question: input.question,
        answer: input.answer,
        sort: input.sort,
      })
      .pipe(
        map((row) => ({ status: 'server' as const, row })),
        catchError(() => of({ status: 'failed' as const })),
      );
  }

  importQuestions(
    track: PracticeHistoryTrack,
    questions: PracticeBankRow[],
  ): Observable<{ status: PracticeBankSaveResult; added: number; skipped: number }> {
    if (!this.auth.isLoggedIn()) return of({ status: 'local-only', added: 0, skipped: 0 });
    return this.http.post<ImportResponse>(`/api/practice-banks/${track}/import`, { questions }).pipe(
      map((body) => ({
        status: 'server' as const,
        added: body?.added ?? 0,
        skipped: body?.skipped ?? 0,
      })),
      catchError(() => of({ status: 'failed' as const, added: 0, skipped: 0 })),
    );
  }
}
