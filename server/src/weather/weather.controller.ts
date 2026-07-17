import { Controller, Get, Post, Delete, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WeatherHistory } from './entities/weather-history.entity';
import { AuthGuard } from '../auth/auth.guard';
import { searchLocalCity } from './china-cities';

/**
 * 天气 API 代理 + 搜索历史管理
 */
@ApiTags('weather')
@Controller('weather')
export class WeatherController {
  private readonly GEO_BASE = 'https://geocoding-api.open-meteo.com/v1/search';
  private readonly FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast';
  private readonly MAX_HISTORY = 10;

  constructor(
    @InjectRepository(WeatherHistory)
    private readonly historyRepo: Repository<WeatherHistory>,
  ) {}

  @Get('geocode')
  @ApiOperation({ summary: '地名解析为经纬度' })
  @ApiQuery({ name: 'name', description: '城市名称（中文/拼音/英文均可）', example: 'Shanghai' })
  async geocode(@Query('name') name: string) {
    // 1. 优先查本地中国城市库
    const localResults = searchLocalCity(name).map(c => ({
      name: c.name,
      latitude: c.lat,
      longitude: c.lon,
      country: '中国',
      admin1: c.admin1,
      admin2: c.admin2,
      _source: 'local',
    }));

    // 2. 同时查询 Open-Meteo
    const url = `${this.GEO_BASE}?name=${encodeURIComponent(name)}&count=5&language=zh&format=json`;
    let remoteResults: any[] = [];
    try {
      const res = await fetch(url);
      const data = await res.json();
      remoteResults = (data.results || []).map((r: any) => ({ ...r, _source: 'remote' }));
    } catch {}

    // 3. 合并：本地优先，去重（按经纬度近似去重）
    const merged = [...localResults];
    const seenCoords = new Set(merged.map(r => `${r.latitude.toFixed(1)}_${r.longitude.toFixed(1)}`));
    for (const r of remoteResults) {
      const key = `${r.latitude.toFixed(1)}_${r.longitude.toFixed(1)}`;
      if (!seenCoords.has(key)) {
        merged.push(r);
        seenCoords.add(key);
      }
    }

    return { results: merged };
  }

  @Get('forecast')
  @ApiOperation({ summary: '获取天气预报（当前天气 + 7天 + 24小时逐时）' })
  @ApiQuery({ name: 'latitude', description: '纬度', example: 31.2222 })
  @ApiQuery({ name: 'longitude', description: '经度', example: 121.4581 })
  async forecast(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
  ) {
    const url = `${this.FORECAST_BASE}?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
    const res = await fetch(url);
    return res.json();
  }

  // ========== 搜索历史（需登录） ==========

  @Get('history')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '获取当前用户的搜索历史城市列表' })
  @ApiResponse({
    status: 200,
    schema: {
      example: [
        { id: 1, name: '上海', lat: 31.2222, lon: 121.4581, country: '中国', admin1: '上海市' },
      ],
    },
  })
  async getHistory(@Request() req: any) {
    return this.historyRepo.find({
      where: { userId: req.user.userId },
      order: { createdAt: 'DESC' },
      take: this.MAX_HISTORY,
    });
  }

  @Post('history')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '添加城市到搜索历史（重复则置顶）' })
  async addHistory(@Request() req: any, @Query('name') name: string, @Query('lat') lat: number, @Query('lon') lon: number, @Query('country') country?: string, @Query('admin1') admin1?: string) {
    const userId = req.user.userId;
    // 移除已存在的相同城市
    await this.historyRepo.delete({ userId, lat, lon });
    // 插入新记录到头部
    const entry = this.historyRepo.create({ userId, name, lat, lon, country: country || '', admin1: admin1 || '' });
    await this.historyRepo.save(entry);
    // 超过上限则删除最旧的
    const all = await this.historyRepo.find({ where: { userId }, order: { createdAt: 'DESC' } });
    if (all.length > this.MAX_HISTORY) {
      const toDelete = all.slice(this.MAX_HISTORY);
      await this.historyRepo.delete(toDelete.map(h => h.id));
    }
    return { success: true };
  }

  @Delete('history/:id')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '从搜索历史中删除指定城市' })
  async removeHistory(@Request() req: any, @Param('id') id: number) {
    await this.historyRepo.delete({ id, userId: req.user.userId });
    return { success: true };
  }
}
