import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameScore } from './entities/game-score.entity';
import { GameScoresController } from './game-scores.controller';
import { GameScoresService } from './game-scores.service';

@Module({
  imports: [TypeOrmModule.forFeature([GameScore])],
  controllers: [GameScoresController],
  providers: [GameScoresService],
  exports: [GameScoresService],
})
export class GameScoresModule {}
