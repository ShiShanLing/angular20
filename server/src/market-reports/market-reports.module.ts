import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketReport } from './entities/market-report.entity';
import { MarketReportsController } from './market-reports.controller';
import { MarketReportsService } from './market-reports.service';

@Module({
  imports: [TypeOrmModule.forFeature([MarketReport])],
  controllers: [MarketReportsController],
  providers: [MarketReportsService],
  exports: [MarketReportsService],
})
export class MarketReportsModule {}
