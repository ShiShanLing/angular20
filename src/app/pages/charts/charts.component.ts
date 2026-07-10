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
