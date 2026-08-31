import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GameScore } from './entities/game-score.entity';
import { GameScoresController } from './game-scores.controller';
import { GameScoresService } from './game-scores.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([GameScore]), AuthModule],
  controllers: [GameScoresController],
  providers: [GameScoresService],
  exports: [GameScoresService],
})
export class GameScoresModule {}
