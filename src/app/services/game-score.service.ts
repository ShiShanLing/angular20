import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class GameScoreService {
  constructor(private http: HttpClient) {}

  getAll(game?: string) {
    const params: any = {};
    if (game) params['game'] = game;
    return this.http.get<any[]>('/api/game-scores', { params });
  }

  getBest(game: string) {
    return this.http.get<{ score: number; playedAt: string | null }>('/api/game-scores/best', {
      params: { game },
    });
  }

  submit(game: string, score: number) {
    return this.http.post<any>('/api/game-scores', { game, score });
  }
}
