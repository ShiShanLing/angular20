import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MarketReport } from './entities/market-report.entity';
import { MarketReportsController } from './market-reports.controller';
import { MarketReportsService } from './market-reports.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [TypeOrmModule.forFeature([MarketReport]), AuthModule],
  controllers: [MarketReportsController],
  providers: [MarketReportsService],
  exports: [MarketReportsService],
})
export class MarketReportsModule {}
