import { Component, OnInit } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { LineChart, BarChart, ScatterChart, RadarChart, GaugeChart, HeatmapChart } from 'echarts/charts';
import {
  TitleComponent, TooltipComponent, GridComponent,
  LegendComponent, RadarComponent, VisualMapComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { FormsModule } from '@angular/forms';

echarts.use([
  LineChart, BarChart, ScatterChart, RadarChart, GaugeChart, HeatmapChart,
  TitleComponent, TooltipComponent, GridComponent,
  LegendComponent, RadarComponent, VisualMapComponent,
  CanvasRenderer
]);

/** ECharts 多图表演示页：折线/柱状/散点/雷达/堆叠面积/仪表盘/热力图，支持暗色开关。 */
@Component({
  selector: 'app-charts',
  imports: [
    NgxEchartsDirective,
    NzCardModule,
    NzTabsModule,
    NzGridModule,
    NzSwitchModule,
    NzIconModule,
    FormsModule
  ],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './charts.component.html',
  styleUrl: './charts.component.scss'
})
export class ChartsComponent implements OnInit {
  darkMode = false;

  lineOption: EChartsOption = {};
  barOption: EChartsOption = {};
  scatterOption: EChartsOption = {};
  radarOption: EChartsOption = {};
  stackAreaOption: EChartsOption = {};
  gaugeOption: EChartsOption = {};
  heatmapOption: EChartsOption = {};

  months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
  days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  hours = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

  /** 首次构建全部图表 option。 */
  ngOnInit() {
    this.buildCharts();
  }

  private buildHeatmapData(): Array<[number, number, number]> {
    // x: hour, y: day
    const data: Array<[number, number, number]> = [];
    for (let dayIndex = 0; dayIndex < this.days.length; dayIndex++) {
      for (let hourIndex = 0; hourIndex < this.hours.length; hourIndex++) {
        const workHourBoost = hourIndex >= 9 && hourIndex <= 18 ? 20 : 0;
        const weekendPenalty = dayIndex >= 5 ? -10 : 0;
        const base = 35 + workHourBoost + weekendPenalty;
        const noise = Math.round((Math.random() - 0.5) * 18);
        data.push([hourIndex, dayIndex, Math.max(0, Math.min(100, base + noise))]);
      }
    }
    return data;
  }

  /** 根据 `darkMode` 重建各 chart 的配色与背景。 */
  buildCharts() {
    const bg = this.darkMode ? '#1f1f1f' : 'transparent';
    const textColor = this.darkMode ? '#ccc' : '#333';

    this.lineOption = {
      backgroundColor: bg,
      tooltip: { trigger: 'axis' },
      legend: { data: ['产品A', '产品B', '产品C'], textStyle: { color: textColor } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: this.months, axisLabel: { color: textColor } },
      yAxis: { type: 'value', axisLabel: { color: textColor } },
      series: [
        { name: '产品A', type: 'line', smooth: true, data: [82, 93, 90, 114, 62, 95, 110, 89, 103, 120, 115, 140] },
        { name: '产品B', type: 'line', smooth: true, data: [60, 72, 85, 95, 78, 110, 120, 95, 88, 105, 98, 125] },
        { name: '产品C', type: 'line', smooth: true, data: [40, 55, 65, 80, 70, 90, 100, 82, 78, 92, 88, 110] },
      ]
    };

    this.barOption = {
      backgroundColor: bg,
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
      legend: { data: ['直接访问', '邮件营销', '联盟广告'], textStyle: { color: textColor } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: this.months, axisLabel: { color: textColor } },
      yAxis: { type: 'value', axisLabel: { color: textColor } },
      series: [
        { name: '直接访问', type: 'bar', data: [320, 332, 301, 334, 390, 330, 320, 340, 355, 370, 360, 380] },
        { name: '邮件营销', type: 'bar', data: [120, 132, 101, 134, 90, 230, 210, 200, 188, 170, 178, 190] },
        { name: '联盟广告', type: 'bar', data: [220, 182, 191, 234, 290, 330, 310, 290, 278, 300, 288, 310] },
      ]
    };

    this.scatterOption = {
      backgroundColor: bg,
      tooltip: { formatter: (p: any) => `(${p.data[0]}, ${p.data[1]})` },
      xAxis: { type: 'value', axisLabel: { color: textColor } },
      yAxis: { type: 'value', axisLabel: { color: textColor } },
      series: [{
        type: 'scatter',
        symbolSize: 10,
        data: Array.from({ length: 50 }, () => [
          +(Math.random() * 100).toFixed(1),
          +(Math.random() * 100).toFixed(1)
        ]),


        itemStyle: { color: '#1890ff', opacity: 0.7 }
      }, {
        type: 'scatter',
        symbolSize: 10,
        data: Array.from({ length: 50 }, () => [
          +(Math.random() * 100).toFixed(1),
          +(Math.random() * 100).toFixed(1)
        ]),
        itemStyle: { color: '#52c41a', opacity: 0.7 }
      }]
    };

    this.radarOption = {
      backgroundColor: bg,
      legend: { data: ['预算分配', '实际开销'], textStyle: { color: textColor } },
      radar: {
        indicator: [
          { name: '销售', max: 6500 },
          { name: '管理', max: 16000 },
          { name: '信息技术', max: 30000 },
          { name: '客服', max: 38000 },
          { name: '研发', max: 52000 },
          { name: '市场', max: 25000 },
        ],
        axisName: { color: textColor }
      },
      series: [{
        name: '预算 vs 开销',
        type: 'radar',
        data: [
          { value: [4200, 3000, 20000, 35000, 50000, 18000], name: '预算分配' },
          { value: [5000, 14000, 28000, 26000, 42000, 21000], name: '实际开销' },
        ]
      }]
    };
    this.stackAreaOption = {
      backgroundColor: bg,
      tooltip: { trigger: 'axis' },
      legend: { data: ['新增用户', '活跃用户', '付费用户'], textStyle: { color: textColor } },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        
        type: 'category',
        boundaryGap: false,
        data: this.months,
        axisLabel: { color: textColor }
        //拐弯不让执行扣分
      },

      yAxis: { type: 'value', axisLabel: { color: textColor } },
      series: [
        {
          name: '新增用户',
          type: 'line',
          stack: 'total',
          smooth: true,
          areaStyle: { opacity: 0.18 },
          emphasis: { focus: 'series' },
          data: [1200, 1400, 1680, 1520, 1900, 2200, 2400, 2100, 2320, 2600, 2780, 3100]
        },
        {
          name: '活跃用户',
          type: 'line',
          stack: 'total',
          smooth: true,
          areaStyle: { opacity: 0.18 },
          emphasis: { focus: 'series' },
          data: [5200, 5600, 5900, 6100, 6800, 7200, 7500, 7100, 7400, 8000, 8300, 8800]
        },
        {
          name: '付费用户',
          type: 'line',
          stack: 'total',
          smooth: true,
          areaStyle: { opacity: 0.18 },
          emphasis: { focus: 'series' },
          data: [620, 700, 760, 820, 920, 1100, 1250, 1180, 1320, 1480, 1600, 1820]
        }
      ]
    };
    /*
        
    */
    const gaugeValue = 72;
    this.gaugeOption = {
      backgroundColor: bg,
      tooltip: { formatter: '{a}<br/>{b}: {c}%' },
      series: [
        {
          name: '健康度',
          type: 'gauge',
          startAngle: 210,
          endAngle: -30,
          min: 0,
          max: 100,
          progress: { show: true, width: 14 },
          axisLine: {
            lineStyle: {
              width: 14,
              color: [
                [0.5, '#ff4d4f'],
                [0.8, '#faad14'],
                [1, '#52c41a']
              ]
            }
          },

          axisTick: { distance: -18, splitNumber: 5, lineStyle: { color: textColor, width: 1 } },
          splitLine: { distance: -22, length: 10, lineStyle: { color: textColor, width: 2 } },
          axisLabel: { color: textColor, distance: -36 },
          pointer: { length: '62%', width: 5 },
          detail: {
            valueAnimation: true,
            formatter: '{value}%',
            color: textColor,
            fontSize: 22,
            offsetCenter: [0, '42%']
          },
          title: { color: textColor, fontSize: 14, offsetCenter: [0, '70%'] },
          data: [{ value: gaugeValue, name: '系统健康度' }]
        }
      ]
    };

    const heatmapColors = this.darkMode
      ? ['#2a2a2a', '#313f7a', '#2b78c4', '#2bc5bd', '#52c41a']
      : ['#f5f5f5', '#d6e4ff', '#91caff', '#73d13d', '#52c41a'];
    this.heatmapOption = {
      backgroundColor: bg,
      tooltip: {
        position: 'top',
        formatter: (p: any) => {
          const [hourIndex, dayIndex, v] = p.data as [number, number, number];
          return `${this.days[dayIndex]} ${this.hours[hourIndex]}<br/>热度: ${v}`;
        }
      },
      /*


      ### 64. iOS GCD 是什么？sync/async、串行/并发队列、常用 API 和死锁条件分别怎么理解？

- 难度：Hard
- ID：`ios-gcd-detailed-overview`
- 口述一句话：GCD 是基于队列的任务调度 API；串行/并发管队列怎么执行，sync/async 管当前线程等不等，死锁本质是同步等待形成等待环。

**参考答案：**

GCD，全称 Grand Central Dispatch，是 Apple 提供的基于队列的多线程任务调度 API。它的核心是把任务提交到队列，系统负责在线程池里调度执行。可以先这样说：GCD 用队列管理任务，后台做耗时工作，主线程更新 UI。

GCD 的核心概念有两个：Queue 和 Task。Queue 是队列，决定任务怎么排队、能不能并发；Task 是任务，也就是提交到队列里的闭包。队列不是线程，队列是调度抽象，线程是实际执行资源，GCD 会管理线程池。

队列分为串行队列和并发队列。串行队列一次只执行一个任务，任务按顺序执行，适合保护共享资源、按顺序写文件、顺序处理任务。并发队列可以同时执行多个任务，适合多个互不依赖的下载、计算、解析任务。主队列是特殊串行队列，在主线程执行，UI 更新必须回主队列。

任务提交方式分为 async 和 sync。async 是异步提交，提交后当前线程不等待任务完成，会继续往下走。sync 是同步提交，提交后当前线程会等待 block 执行完成，再继续往下走。注意：sync 一定会阻塞调用它的当前线程，不管目标队列是串行队列还是并发队列；串行/并发决定队列内部能不能并发执行，sync/async 决定当前线程等不等。

常见写法：

```swift
DispatchQueue.global(qos: .userInitiated).async {
    let result = loadData()

    DispatchQueue.main.async {
        updateUI(result)
    }
}
```

常用能力包括：

1. main queue：主队列，在主线程执行，用于 UI 更新。

2. global queue：系统后台并发队列，可以设置 QoS，比如 userInteractive、userInitiated、utility、background。

3. asyncAfter：延迟执行，常用于延迟提示、简单防抖、延迟关闭 loading。

4. DispatchGroup：等待多个异步任务全部完成后再统一回调，适合多个接口并行请求后合并结果。

5. DispatchSemaphore：计数信号量，可以限制并发数量或做线程同步。要注意 wait/signal 成对出现，不要在主线程长时间 wait。

6. DispatchWorkItem：把任务包装成对象，可以做简单取消和防抖。cancel 不会强制杀死已经执行中的任务，只是设置取消标记。

7. barrier：栅栏任务，配合自定义并发队列实现多读单写。多个读可以并发，写操作独占。

GCD 死锁的条件可以记成一句话：同步等待 + 目标任务无法开始 + 形成互相等待。最典型的是当前执行上下文正在占着某个队列，又 sync 等这个队列执行一个新任务，而这个新任务必须等当前任务结束后才能执行。

常见死锁场景：

1. 主线程调用 DispatchQueue.main.sync。主队列是串行队列，当前代码已经在主队列执行，又同步提交新任务到主队列，新任务要等当前任务结束，当前任务又等新任务完成，于是死锁。

2. 自定义串行队列内部 sync 自己。串行队列正在执行外层任务，外层任务里又 queue.sync 提交内层任务，内层任务必须等外层任务结束，外层任务又等待内层任务完成，于是死锁。

3. 两个串行队列互相 sync，形成等待环。

4. 并发队列的 barrier 内部 sync 同一个队列。barrier 正在独占队列，内层 sync 任务要等 barrier 结束，barrier 又在等 sync 完成，也可能死锁。

5. 主线程 wait 信号量，而 signal 又需要回主线程执行。主线程被 wait 阻塞，signal block 无法在主队列执行，于是卡死。

要特别区分：串行队列 sync 本身不一定死锁。如果你在主线程对一个自定义串行队列 sync，只是主线程等待任务完成，不会必然死锁；只有在同一个串行队列内部 sync 自己，或者形成等待环，才会死锁。并发队列 sync 自己通常不容易死锁，但 sync 仍然会阻塞调用线程。

避免 GCD 死锁和卡顿的原则：不要在主线程 DispatchQueue.main.sync；不要在队列内部 sync 自己；避免多个串行队列互相 sync；不要在主线程 semaphore.wait；不要为了把异步变同步而阻塞主线程；UI 更新回主线程；复杂共享状态可以考虑 actor、锁或串行队列统一保护。

GCD 和 Swift Concurrency 的关系：GCD 更偏底层任务派发，关注把闭包提交到队列；async/await、Task、TaskGroup、actor、MainActor 是 Swift 的语言级并发模型，关注把异步流程写得更清楚，并集成取消、错误处理和结构化并发。现代业务异步流程通常优先 async/await 和 Task；老项目、底层队列控制、barrier、semaphore、一些系统 API 和面试里仍然需要理解 GCD。

面试收口：GCD 是基于队列的任务调度 API。串行/并发决定队列内部一次执行几个任务，sync/async 决定当前线程是否等待。常用能力有 main/global queue、asyncAfter、DispatchGroup、Semaphore、WorkItem、barrier。GCD 死锁的本质是同步等待形成等待环，最常见是主队列 sync 主队列、串行队列里 sync 自己、主线程 wait 等一个回主线程 signal 的任务。

---


      */

      grid: { left: 70, right: 30, top: 20, bottom: 40 },
      xAxis: {
        type: 'category',
        data: this.hours,
        axisLabel: { color: textColor, interval: 2 }
      },
      yAxis: {
        type: 'category',
        data: this.days,
        axisLabel: { color: textColor }
      },

      visualMap: {
        min: 0,
        max: 100,
        calculable: true,
        orient: 'horizontal',
        left: 'center',
        bottom: 0,
        textStyle: { color: textColor },
        inRange: { color: heatmapColors }
      },
      series: [
        {
          type: 'heatmap',
          data: this.buildHeatmapData(),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.25)'
            }
          }
        }
      ]
    };
  }


  onThemeChange() {
    this.buildCharts();
  }
}
