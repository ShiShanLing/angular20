import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MarketReport } from './entities/market-report.entity';
import { CreateMarketReportDto } from './dto/create-market-report.dto';

@Injectable()
export class MarketReportsService {
  constructor(
    @InjectRepository(MarketReport)
    private readonly repo: Repository<MarketReport>,
  ) {}

  /**
   * 分页列表（不含 htmlContent）
   */
  async findAll(page = 1, pageSize = 20) {
    const [items, total] = await this.repo.findAndCount({
      select: [
        'id', 'date', 'aiIndex', 'kwIndex', 'totalPosts',
        'bullish', 'bearish', 'fear', 'greed', 'neutral',
        'bearFearPct', 'panicTotal', 'createdAt',
      ],
      order: { date: 'DESC' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });
    return { items, total, page, pageSize };
  }

  /**
   * 单条详情（含 htmlContent）
   */
  async findByDate(date: string) {
    return this.repo.findOne({ where: { date } });
  }

  /**
   * 趋势数据（最近 N 天）
   */
  async getTrend(days = 30) {
    return this.repo.find({
      select: ['date', 'aiIndex', 'kwIndex', 'panicTotal', 'bearFearPct', 'totalPosts'],
      order: { date: 'ASC' },
      take: days,
    });
  }

  /**
   * 插入或更新（按 date 去重）
   */
  async upsert(dto: CreateMarketReportDto) {
    const existing = await this.repo.findOne({ where: { date: dto.date } });
    if (existing) {
      Object.assign(existing, dto);
      return this.repo.save(existing);
    }
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }
}
