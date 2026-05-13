import { Component, OnInit } from '@angular/core';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echarts from 'echarts/core';
import { LineChart, PieChart, BarChart } from 'echarts/charts';
import {
  TitleComponent, TooltipComponent, GridComponent,
  LegendComponent, DataZoomComponent
} from 'echarts/components';
import { CanvasRenderer } from 'echarts/renderers';
import type { EChartsOption } from 'echarts';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzStatisticModule } from 'ng-zorro-antd/statistic';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';

echarts.use([
  LineChart, PieChart, BarChart,
  TitleComponent, TooltipComponent, GridComponent,
  LegendComponent, DataZoomComponent,
  CanvasRenderer
]);

/** 仪表盘示例：统计卡片 + ECharts 折线图 / 饼图。 */
@Component({
  selector: 'app-dashboard',
  imports: [
    NgxEchartsDirective,
    NzCardModule,
    NzStatisticModule,
    NzGridModule,
    NzIconModule,
    NzTagModule
  ],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  stats = [
    { title: '总用户数', value: 124560, prefix: '👥', color: '#1890ff', trend: '+12.3%' },
    { title: '本月订单', value: 8846,   prefix: '📦', color: '#52c41a', trend: '+8.6%' },
    { title: '月收入(元)', value: 358800, prefix: '💰', color: '#faad14', trend: '+5.2%' },
    { title: '待处理', value: 42,       prefix: '⏳', color: '#ff4d4f', trend: '-3.1%' },
  ];

  lineOption: EChartsOption = {};
  pieOption: EChartsOption = {};

  /** 组装示例折线图与环形饼图的 option。 */
  ngOnInit() {
    this.lineOption = {
      tooltip: { trigger: 'axis' },
      legend: { data: ['用户增长', '订单量'] },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月']
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: '用户增长',
          type: 'line',
          smooth: true,
          areaStyle: { opacity: 0.15 },
          data: [4200, 5320, 6180, 7340, 8100, 9780, 10500, 11200, 12800, 14300, 16000, 18200],
          itemStyle: { color: '#1890ff' }
        },
        {
          name: '订单量',
          type: 'line',
          smooth: true,
          areaStyle: { opacity: 0.15 },
          data: [520, 740, 890, 1100, 1345, 1580, 1930, 2100, 2480, 2900, 3200, 3800],
          itemStyle: { color: '#52c41a' }
        }
      ]
    };

    this.pieOption = {
      tooltip: { trigger: 'item', formatter: '{a} <br/>{b}: {c} ({d}%)' },
      legend: { orient: 'vertical', left: 'left' },
      series: [{
        name: '流量来源',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
        label: { show: false },
        emphasis: { label: { show: true, fontSize: 16, fontWeight: 'bold' } },
        data: [
          { value: 1048, name: '搜索引擎' },
          { value: 735,  name: '直接访问' },
          { value: 580,  name: '邮件营销' },
          { value: 484,  name: '联盟广告' },
          { value: 300,  name: '视频广告' },
        ]
      }]
    };
  }
}
