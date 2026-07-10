import { Module } from '@nestjs/common';
import { RecordsModule } from '../records/records.module';
import { GameScoresModule } from '../game-scores/game-scores.module';
import { ExportController } from './export.controller';
import { ExportService } from './export.service';

@Module({
  imports: [RecordsModule, GameScoresModule],
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
