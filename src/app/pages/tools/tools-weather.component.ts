import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NgxEchartsModule } from 'ngx-echarts';

@Component({
  selector: 'app-tools-weather',
  standalone: true,
  imports: [
    CommonModule, FormsModule, HttpClientModule,
    NzCardModule, NzInputModule, NzButtonModule, NzGridModule,
    NzSpinModule, NzTagModule, NzDividerModule, NzIconModule,
    NgxEchartsModule
  ],
  templateUrl: './tools-weather.component.html',
  styleUrl: './tools-weather.component.scss'
})
export class ToolsWeatherComponent implements OnInit {
  city: string = 'Shanghai';
  weatherData: any = null;
  loading: boolean = false;
  chartOptions: any = null;

  constructor(private http: HttpClient, private msg: NzMessageService) { }

  ngOnInit(): void {
    const savedCity = localStorage.getItem('tools_weather_city');
    if (savedCity) {
      this.city = savedCity;
    }
    this.searchWeather();
  }

  searchWeather(): void {
    if (!this.city.trim()) return;

    localStorage.setItem('tools_weather_city', this.city);

    const CACHE_KEY = `weather_cache_${this.city.trim().toLowerCase()}`;
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { timestamp, data } = JSON.parse(cached);
        const threeHours = 3 * 60 * 60 * 1000;
        if (Date.now() - timestamp < threeHours) {
          console.log('Using cached weather data for', this.city);
          this.weatherData = data;
          this.updateChartOptions();
          return;
        }
      } catch (e) {
        localStorage.removeItem(CACHE_KEY);
      }
    }

    this.loading = true;

    // 1. Geocoding: 城市转经纬度
    const geoUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(this.city)}&count=1&language=zh&format=json`;

    this.http.get(geoUrl).subscribe({
      next: (geoRes: any) => {
        if (!geoRes.results || geoRes.results.length === 0) {
          this.msg.error('未找到该城市，请尝试输入拼音或英文名');
          this.loading = false;
          return;
        }

        const location = geoRes.results[0];
        const lat = location.latitude;
        const lon = location.longitude;

        // 2. 获取 7 天预案 + 24 小时逐时数据
        const forecastUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,weathercode&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

        this.http.get(forecastUrl).subscribe({
          next: (data: any) => {
            const finalData = {
              location,
              current: data.current_weather,
              daily: data.daily,
              hourly: data.hourly
            };
            this.weatherData = finalData;

            // 存入缓存
            localStorage.setItem(CACHE_KEY, JSON.stringify({
              timestamp: Date.now(),
              data: finalData
            }));

            this.updateChartOptions();
            this.loading = false;
          },
          error: () => {
            this.msg.error('获取天气详情失败');
            this.loading = false;
          }
        });
      },
      error: () => {
        this.msg.error('地名解析失败');
        this.loading = false;
      }
    });
  }

  getForecastArray(): any[] {
    if (!this.weatherData || !this.weatherData.daily) return [];
    const daily = this.weatherData.daily;
    return daily.time.map((t: string, i: number) => ({
      date: t,
      weatherCode: daily.weathercode[i],
      maxTemp: daily.temperature_2m_max[i],
      minTemp: daily.temperature_2m_min[i]
    }));
  }

  getHourlyForecastArray(): any[] {
    if (!this.weatherData || !this.weatherData.hourly) return [];

    const hourly = this.weatherData.hourly;
    const now = new Date();
    // 找到当前小时的索引
    let startIndex = hourly.time.findIndex((t: string) => new Date(t).getHours() === now.getHours() && new Date(t).getDate() === now.getDate());
    if (startIndex === -1) startIndex = 0;

    // 取接下来的 24 小时
    const result = [];
    for (let i = startIndex; i < startIndex + 24 && i < hourly.time.length; i++) {
      result.push({
        time: hourly.time[i],
        temp: hourly.temperature_2m[i],
        weatherCode: hourly.weathercode[i]
      });
    }
    return result;
  }

  updateChartOptions(): void {
    const hourly = this.getHourlyForecastArray();
    const times = hourly.map(h => new Date(h.time).getHours() + ':00');
    const temps = hourly.map(h => h.temp);

    this.chartOptions = {
      grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
      tooltip: { trigger: 'axis', formatter: '{b}<br/>温度: {c}°C' },
      xAxis: { type: 'category', data: times, axisLabel: { interval: 3 } },
      yAxis: { type: 'value', axisLabel: { formatter: '{value}°C' }, scale: true },
      series: [{
        data: temps,
        type: 'line',
        smooth: true,
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [{ offset: 0, color: '#1890ff' }, { offset: 1, color: '#ffffff' }]
          }
        },
        lineStyle: { color: '#1890ff' },
        itemStyle: { color: '#1890ff' }
      }]
    };
  }

  getConditionIcon(code: number): string {
    // WMO Weather interpretation codes (WW)
    if (code === 0) return '🌞'; // Clear sky
    if (code >= 1 && code <= 3) return '⛅'; // Mainly clear, partly cloudy, and overcast
    if (code === 45 || code === 48) return '🌫️'; // Fog
    if (code >= 51 && code <= 55) return '🌦️'; // Drizzle
    if (code >= 61 && code <= 65) return '🌧️'; // Rain
    if (code >= 71 && code <= 77) return '❄️'; // Snow
    if (code >= 80 && code <= 82) return '🌧️'; // Rain showers
    if (code >= 85 && code <= 86) return '❄️'; // Snow showers
    if (code >= 95) return '⚡'; // Thunderstorm
    return '⛅';
  }

  getConditionDesc(code: number): string {
    const mapping: any = {
      0: '晴朗',
      1: '晴间多云', 2: '多云', 3: '阴天',
      45: '雾', 48: '沉积雾',
      51: '轻微毛毛雨', 53: '中等毛毛雨', 55: '密集毛毛雨',
      61: '轻雨', 63: '中雨', 65: '大雨',
      71: '轻雪', 73: '中雪', 75: '大雪', 77: '雪粒',
      80: '轻阵雨', 81: '中阵雨', 82: '强阵雨',
      85: '轻阵雪', 86: '强阵雪',
      95: '雷阵雨', 96: '雷阵雨伴有冰雹', 99: '强烈雷阵雨伴有冰雹'
    };
    return mapping[code] || '多云';
  }
}
