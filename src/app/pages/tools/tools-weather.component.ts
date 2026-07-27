import { DecimalPipe, DatePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

interface RecentCity {
  id: number;
  name: string;
  lat: number;
  lon: number;
  country?: string;
  admin1?: string;
}

/** 天气预报：地名解析、预报查询、历史城市管理（均走后端 /api/weather）。 */
@Component({
  selector: 'app-tools-weather',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DecimalPipe,
    DatePipe,
    NzCardModule,
    NzInputModule,
    NzButtonModule,
    NzGridModule,
    NzSpinModule,
    NzTagModule,
    NzDividerModule,
    NzIconModule,
    NgxEchartsModule,
  ],
  templateUrl: './tools-weather.component.html',
  styleUrl: './tools-weather.component.scss',
})
export class ToolsWeatherComponent {
  private readonly http = inject(HttpClient);
  private readonly msg = inject(NzMessageService);

  readonly city = signal(localStorage.getItem('tools_weather_city') || 'Shanghai');
  readonly weatherData = signal<any>(null);
  readonly loading = signal(false);
  readonly chartOptions = signal<any>(null);
  readonly recentCities = signal<RecentCity[]>([]);
  readonly geocodeResults = signal<any[]>([]);
  readonly showGeocodePicker = signal(false);

  readonly forecastDays = computed(() => {
    const data = this.weatherData();
    if (!data?.daily) return [];
    const daily = data.daily;
    return daily.time.map((t: string, i: number) => ({
      date: t,
      weatherCode: daily.weathercode[i],
      maxTemp: daily.temperature_2m_max[i],
      minTemp: daily.temperature_2m_min[i],
    }));
  });

  readonly hourlyForecast = computed(() => {
    const data = this.weatherData();
    if (!data?.hourly) return [];

    const hourly = data.hourly;
    const now = new Date();
    let startIndex = hourly.time.findIndex(
      (t: string) => new Date(t).getHours() === now.getHours() && new Date(t).getDate() === now.getDate(),
    );
    if (startIndex === -1) startIndex = 0;

    const result = [];
    for (let i = startIndex; i < startIndex + 24 && i < hourly.time.length; i++) {
      result.push({
        time: hourly.time[i],
        temp: hourly.temperature_2m[i],
        weatherCode: hourly.weathercode[i],
      });
    }
    return result;
  });

  // MARK: 构造注入
  // 加载历史城市并按上次城市搜索
  constructor() {
    this.loadRecentCities();
    this.searchWeather();
  }

  // MARK: 搜索
  // 按城市名搜索天气（先 geocoding 再拉取预报）
  searchWeather(): void {
    const cityName = this.city().trim();
    if (!cityName) return;

    localStorage.setItem('tools_weather_city', cityName);
    this.loading.set(true);
    this.showGeocodePicker.set(false);
    this.geocodeResults.set([]);

    const geoUrl = `/api/weather/geocode?name=${encodeURIComponent(cityName)}`;
    this.http.get(geoUrl).subscribe({
      next: (geoRes: any) => {
        if (!geoRes.results || geoRes.results.length === 0) {
          this.msg.error('未找到该城市，请尝试输入拼音或英文名');
          this.loading.set(false);
          return;
        }

        if (geoRes.results.length > 1) {
          this.geocodeResults.set(geoRes.results);
          this.showGeocodePicker.set(true);
          this.loading.set(false);
          return;
        }

        this.fetchWeather(geoRes.results[0]);
      },
      error: () => {
        this.msg.error('地名解析失败');
        this.loading.set(false);
      },
    });
  }

  // MARK: 选地理码
  // 从多个 geocoding 结果中选择城市
  pickGeocodeResult(location: any): void {
    this.showGeocodePicker.set(false);
    this.geocodeResults.set([]);
    this.city.set(location.name);
    this.fetchWeather(location);
  }

  // MARK: 拉取
  // 通过经纬度获取天气数据（含本地缓存）
  fetchWeather(location: any): void {
    const lat = location.latitude;
    const lon = location.longitude;
    const CACHE_KEY = `weather_cache_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const { timestamp, data } = JSON.parse(cached);
        const threeHours = 3 * 60 * 60 * 1000;
        if (Date.now() - timestamp < threeHours) {
          this.weatherData.set(data);
          this.updateChartOptions();
          this.loading.set(false);
          return;
        }
      } catch {
        localStorage.removeItem(CACHE_KEY);
      }
    }

    this.loading.set(true);
    const forecastUrl = `/api/weather/forecast?latitude=${lat}&longitude=${lon}`;
    this.http.get(forecastUrl).subscribe({
      next: (data: any) => {
        const finalData = {
          location,
          current: data.current_weather,
          daily: data.daily,
          hourly: data.hourly,
        };
        this.weatherData.set(finalData);
        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify({
            timestamp: Date.now(),
            data: finalData,
          }),
        );
        this.addRecentCity(location);
        this.updateChartOptions();
        this.loading.set(false);
      },
      error: () => {
        this.msg.error('获取天气详情失败');
        this.loading.set(false);
      },
    });
  }

  // MARK: 加载
  // 加载历史城市列表（从后端 API）
  loadRecentCities(): void {
    this.http.get<any[]>('/api/weather/history').subscribe({
      next: (list) => {
        this.recentCities.set(
          list.map((h) => ({
            id: h.id,
            name: h.name,
            lat: h.lat,
            lon: h.lon,
            country: h.country,
            admin1: h.admin1,
          })),
        );
      },
      error: () => this.recentCities.set([]),
    });
  }

  // MARK: 添加
  // 添加成功搜索的城市到历史（通过后端 API）
  addRecentCity(location: any): void {
    const params = new URLSearchParams({
      name: location.name,
      lat: String(location.latitude),
      lon: String(location.longitude),
      country: location.country || '',
      admin1: location.admin1 || '',
    });
    this.http.post(`/api/weather/history?${params.toString()}`, {}).subscribe({
      next: () => this.loadRecentCities(),
      error: () => {},
    });
  }

  // MARK: 选择
  // 从历史列表选择城市并直接拉取预报
  selectRecentCity(city: RecentCity): void {
    this.city.set(city.name);
    localStorage.setItem('tools_weather_city', city.name);
    this.loading.set(true);

    const forecastUrl = `/api/weather/forecast?latitude=${city.lat}&longitude=${city.lon}`;
    this.http.get(forecastUrl).subscribe({
      next: (data: any) => {
        const location = { ...city, latitude: city.lat, longitude: city.lon };
        this.weatherData.set({
          location,
          current: data.current_weather,
          daily: data.daily,
          hourly: data.hourly,
        });
        this.updateChartOptions();
        this.loading.set(false);
      },
      error: () => {
        this.msg.error('获取天气详情失败');
        this.loading.set(false);
      },
    });
  }

  // MARK: 移除
  // 从历史列表中移除城市（通过后端 API）
  removeRecentCity(cityId: number, event: Event): void {
    event.stopPropagation();
    this.http.delete(`/api/weather/history/${cityId}`).subscribe({
      next: () => {
        this.recentCities.update((list) => list.filter((c) => c.id !== cityId));
      },
      error: () => this.msg.error('删除失败'),
    });
  }

  // MARK: 更新
  // 根据逐小时数据刷新图表配置
  updateChartOptions(): void {
    const hourly = this.hourlyForecast();
    const times = hourly.map((h) => new Date(h.time).getHours() + ':00');
    const temps = hourly.map((h) => h.temp);

    this.chartOptions.set({
      grid: { left: '3%', right: '4%', bottom: '3%', top: '15%', containLabel: true },
      tooltip: { trigger: 'axis', formatter: '{b}<br/>温度: {c}°C' },
      xAxis: { type: 'category', data: times, axisLabel: { interval: 3 } },
      yAxis: { type: 'value', axisLabel: { formatter: '{value}°C' }, scale: true },
      series: [
        {
          data: temps,
          type: 'line',
          smooth: true,
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#1890ff' },
                { offset: 1, color: '#ffffff' },
              ],
            },
          },
          lineStyle: { color: '#1890ff' },
          itemStyle: { color: '#1890ff' },
        },
      ],
    });
  }

  // MARK: 天气图标
  getConditionIcon(code: number): string {
    if (code === 0) return '🌞';
    if (code >= 1 && code <= 3) return '⛅';
    if (code === 45 || code === 48) return '🌫️';
    if (code >= 51 && code <= 55) return '🌦️';
    if (code >= 61 && code <= 65) return '🌧️';
    if (code >= 71 && code <= 77) return '❄️';
    if (code >= 80 && code <= 82) return '🌧️';
    if (code >= 85 && code <= 86) return '❄️';
    if (code >= 95) return '⚡';
    return '⛅';
  }

  // MARK: 天气文案
  getConditionDesc(code: number): string {
    const mapping: Record<number, string> = {
      0: '晴朗',
      1: '晴间多云',
      2: '多云',
      3: '阴天',
      45: '雾',
      48: '沉积雾',
      51: '轻微毛毛雨',
      53: '中等毛毛雨',
      55: '密集毛毛雨',
      61: '轻雨',
      63: '中雨',
      65: '大雨',
      71: '轻雪',
      73: '中雪',
      75: '大雪',
      77: '雪粒',
      80: '轻阵雨',
      81: '中阵雨',
      82: '强阵雨',
      85: '轻阵雪',
      86: '强阵雪',
      95: '雷阵雨',
      96: '雷阵雨伴有冰雹',
      99: '强烈雷阵雨伴有冰雹',
    };
    return mapping[code] || '多云';
  }
}
