import {
  Controller, Get, Post, Body, Query, Param, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MarketReportsService } from './market-reports.service';
import { AuthGuard } from '../auth/auth.guard';
import { CreateMarketReportDto } from './dto/create-market-report.dto';

@ApiTags('market-reports')
@ApiBearerAuth()
@Controller('market-reports')
@UseGuards(AuthGuard)
export class MarketReportsController {
  constructor(private readonly service: MarketReportsService) {}

  @Get()
  @ApiOperation({ summary: '分页查询市场情绪报告列表' })
  @ApiQuery({ name: 'page', required: false, description: '页码，默认 1' })
  @ApiQuery({ name: 'pageSize', required: false, description: '每页条数，默认 20' })
  findAll(
    @Query('page') page?: number,
    @Query('pageSize') pageSize?: number,
  ) {
    return this.service.findAll(page || 1, pageSize || 20);
  }

  @Get('trend')
  @ApiOperation({ summary: '获取趋势数据' })
  @ApiQuery({ name: 'days', required: false, description: '最近天数，默认 30' })
  getTrend(@Query('days') days?: number) {
    return this.service.getTrend(days || 30);
  }

  @Get(':date')
  @ApiOperation({ summary: '查询某日详情（含 HTML）' })
  findByDate(@Param('date') date: string) {
    return this.service.findByDate(date);
  }

  @Post()
  @ApiOperation({ summary: '入库/更新市场情绪报告' })
  upsert(@Body() dto: CreateMarketReportDto) {
    return this.service.upsert(dto);
  }
}
