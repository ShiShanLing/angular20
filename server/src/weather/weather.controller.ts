import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';

/**
 * 天气 API 代理：
 * 前端直接调用 open-meteo 外网 API 会因 CORS/代理问题失败，
 * 由后端服务端代理请求，前端只调 /api/weather/*。
 */
@ApiTags('weather')
@Controller('weather')
export class WeatherController {
  private readonly GEO_BASE = 'https://geocoding-api.open-meteo.com/v1/search';
  private readonly FORECAST_BASE = 'https://api.open-meteo.com/v1/forecast';

  @Get('geocode')
  @ApiOperation({ summary: '地名解析为经纬度' })
  @ApiQuery({ name: 'name', description: '城市名称（中文/拼音/英文均可）', example: 'Shanghai' })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        results: [{ id: 1796236, name: '上海', latitude: 31.2222, longitude: 121.4581, country: '中国', admin1: '上海' }],
      },
    },
  })
  async geocode(@Query('name') name: string) {
    const url = `${this.GEO_BASE}?name=${encodeURIComponent(name)}&count=5&language=zh&format=json`;
    const res = await fetch(url);
    return res.json();
  }

  @Get('forecast')
  @ApiOperation({ summary: '获取天气预报（当前天气 + 7天 + 24小时逐时）' })
  @ApiQuery({ name: 'latitude', description: '纬度', example: 31.2222 })
  @ApiQuery({ name: 'longitude', description: '经度', example: 121.4581 })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        current_weather: { temperature: 32.5, weathercode: 1, windspeed: 12, winddirection: 180 },
        daily: { time: ['2026-07-17'], weathercode: [1], temperature_2m_max: [34], temperature_2m_min: [26], precipitation_sum: [0] },
        hourly: { time: ['2026-07-17T00:00'], temperature_2m: [27.2], weathercode: [0] },
      },
    },
  })
  async forecast(
    @Query('latitude') latitude: number,
    @Query('longitude') longitude: number,
  ) {
    const url = `${this.FORECAST_BASE}?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;
    const res = await fetch(url);
    return res.json();
  }
}
