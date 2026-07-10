import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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

/** 调用天气 API：当前气象与 ECharts 趋势（需有效后端/密钥配置）。 */
@Component({
  selector: 'app-tools-weather',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
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
  
  /*



  */
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
    // 找到当前小时的索引,
    let startIndex = hourly.time.findIndex((t: string) => new Date(t).getHours() === now.getHours() && new Date(t).getDate() === now.getDate());
    if (startIndex === -1) startIndex = 0;
    console.log('startIndex', startIndex);
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
        //
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
 /*

iOS 列表滚动优化怎么做？UITableView/UICollectionView 可能遇到哪些问题？

iOS 列表滚动优化主要针对 UITableView 和 UICollectionView。核心目标是让滑动时每一帧都足够轻，不能让主线程、图片解码、布局计算和渲染管线被 Cell 拖慢。简单列表可能很少出问题，但图文混排、动态高度、大量图片、复杂 Cell、频繁刷新和数据量大的列表很容易出现滚动问题。

常见问题可以这样分类：

1. 滑动掉帧：表现是快速滑动时一卡一卡、手势不跟手、图片加载时突然卡一下。常见原因是 cellForRow/cellForItem 里做复杂计算、同步文件读取、主线程图片解码、复杂 Auto Layout、频繁计算动态高度。


//滑动掉帧,离屏渲染
2. 图片错乱：表现是 A 用户头像显示到 B 用户 Cell 上，滑动快时旧图片闪一下。原因是 Cell 复用后，旧图片请求回来又设置到了新 Cell 上。解决方式是复用时取消旧请求，设置 placeholder，图片回来时校验 URL，或者使用 SDWebImage、Kingfisher 这类成熟图片库。

3. 复用状态残留：表现是按钮选中状态、进度条、开关、Label、图片还保留上一个 model 的状态。解决方式是在 prepareForReuse 清理旧状态，并在 configure(model:) 里完整设置所有 UI 状态。

```swift
override func prepareForReuse() {
    super.prepareForReuse()
    avatarImageView.image = UIImage(named: "avatar_placeholder")
    titleLabel.text = nil
    progressView.progress = 0
}
```


4. Cell 高度跳动：表现是滑动时高度突然变化、内容展开收起时列表抖动、滚动条位置跳。常见原因是 estimatedRowHeight 不准确、动态高度计算不稳定、图片异步回来后改变高度、约束不完整。解决方式是给合理 estimated height，必要时缓存高度，图片区域预留固定尺寸或固定比例，约束写完整。

5. 首次进入列表慢：表现是进入页面白屏、首次 reloadData 卡一下。常见原因是一次性解析大量数据、一次性创建复杂 Cell、同步加载本地资源、首屏等待太多网络数据。解决方式是分页加载、后台解析、先展示缓存或骨架屏、首屏优先、分批插入。

6. 内存上涨：表现是滑动一会儿内存越来越高，加载很多图片后内存升高。常见原因是图片太大、缓存无限增长、Cell 持有大对象、闭包强引用 VC、预加载过度。解决方式是使用缩略图、限制缓存大小、复用时清理状态、弱引用 self、控制预加载数量。

7. 频繁 reloadData：表现是数据一变化就整表刷新，滑动时突然卡一下，动画不自然。优化方式是优先局部刷新、insert/delete/reload rows、performBatchUpdates、Diffable Data Source 或差量更新。

8. Auto Layout 太复杂：表现是 Cell 内容复杂时滑动不顺。优化方式是减少 view 层级、减少约束数量、避免 StackView 深层嵌套、缓存高度，极复杂高频列表可以考虑手动布局。

9. 渲染压力大：圆角、阴影、mask、透明混合、模糊效果都可能增加渲染成本。阴影可以设置 shadowPath，圆角和阴影尽量避免同时依赖 masksToBounds，复杂背景可以预渲染。

10. 数据源更新和 UI 不一致：表现是 Invalid update 崩溃、插入删除动画异常。原因通常是 dataSource 数量和 UI 更新不匹配，或者多线程改数据源。解决方式是先更新数据源，再更新 UI，UI 操作放主线程，复杂 diff 用 Diffable Data Source。

列表优化的常用做法：

第一，Cell 复用要正确。register/dequeue 只是基础，关键是 prepareForReuse 清旧状态，configure(model:) 完整设置新状态，不要依赖上一次 Cell 的状态。

第二，cellForRow/cellForItem 不做重活。不要在里面做网络请求、同步读文件、图片解码、复杂文本计算、大量 DateFormatter 创建或复杂高度计算。这些应提前算、缓存或异步处理。

第三，图片异步加载并能取消。复用时取消旧请求、设置 placeholder，避免旧请求回调污染新 Cell。SDWebImage、Kingfisher 这类库通常已经处理了缓存、取消和异步解码等问题。

```swift
override func prepareForReuse() {
    super.prepareForReuse()
    avatarImageView.sd_cancelCurrentImageLoad()
    avatarImageView.image = UIImage(named: "avatar_placeholder")
}
```

第四，高度要稳定。动态高度可以用 automaticDimension，但 estimatedRowHeight 要尽量合理；高度计算复杂时可以缓存；图片区域不要等图片回来后才撑开，最好预留固定高度或固定比例。

第五，减少全量刷新。不要动不动 reloadData，优先局部刷新、批量更新或 diff。全量刷新会导致更多 Cell 重新配置、重新布局和可能的滚动位置跳动。

第六，合理使用预加载。UITableViewDataSourcePrefetching 和 UICollectionViewDataSourcePrefetching 可以提前加载下一屏数据或图片，但要实现 cancelPrefetching，避免浪费网络和内存。

第七，控制布局和渲染成本。减少层级、减少透明重叠、避免复杂圆角阴影和模糊效果，必要时设置 shadowPath 或预渲染。

排查工具：Time Profiler 看主线程耗时和 cell 配置成本；Core Animation 看 FPS、掉帧和渲染压力；View Debugger 看 Cell 层级是否过深、约束是否复杂；Allocations 看滑动时对象是否大量创建；Memory Graph 看 Cell/VC 是否泄漏；卡住时可以暂停并用 LLDB thread backtrace all 看主线程栈。

收口：列表滚动优化 = Cell 轻量 + 复用正确 + 图片异步可取消 + 高度稳定 + 局部刷新 + 布局渲染简单。真实项目中最容易遇到的是滑动掉帧、图片错乱、复用状态残留、动态高度跳动、内存上涨、频繁 reloadData 和数据源更新不一致。
 */

//

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
