import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameScore } from './entities/game-score.entity';

@Injectable()
export class GameScoresService {
  constructor(
    @InjectRepository(GameScore)
    private readonly scoreRepo: Repository<GameScore>,
  ) {}

  async findAll(userId: number, game?: string) {
    const where: any = { userId };
    if (game) where.game = game;
    return this.scoreRepo.find({
      where,
      order: { score: 'DESC', playedAt: 'DESC' },
    });
  }

  async getBest(userId: number, game: string) {
    const best = await this.scoreRepo.findOne({
      where: { userId, game },
      order: { score: 'DESC' },
    });
    return best ? { score: best.score, playedAt: best.playedAt } : { score: 0, playedAt: null };
  }

  async create(userId: number, game: string, score: number) {
    const entity = this.scoreRepo.create({ userId, game, score });
    return this.scoreRepo.save(entity);
  }
}
