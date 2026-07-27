import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

/**
 * 游戏分数服务。
 * 负责贪吃蛇、俄罗斯方块等游戏的分数提交与查询。
 */
@Injectable({ providedIn: 'root' })
export class GameScoreService {
  private readonly http = inject(HttpClient);

  // MARK: 获取
  getAll(game?: string) {
    const params: any = {};
    if (game) params['game'] = game;
    return this.http.get<any[]>('/api/game-scores', { params });
  }

  // MARK: 获取
  getBest(game: string) {
    return this.http.get<{ score: number; playedAt: string | null }>('/api/game-scores/best', {
      params: { game },
    });
  }

  // MARK: 提交
  submit(game: string, score: number) {
    return this.http.post<any>('/api/game-scores', { game, score });
  }
}
