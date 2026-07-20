import { CommonModule } from '@angular/common';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NgxEchartsDirective, provideEchartsCore } from 'ngx-echarts';
import * as echartsDistNs from 'echarts/dist/echarts.js';
import type { EChartsOption } from 'echarts';

type EChartsNs = typeof import('echarts');
function echartsFromDistBundle(ns: typeof echartsDistNs): EChartsNs {
  const root = ns as unknown as Record<string, unknown>;
  if (typeof root['init'] === 'function') return root as unknown as EChartsNs;
  const inner = root['default'] as Record<string, unknown> | undefined;
  if (inner && typeof inner['init'] === 'function') return inner as unknown as EChartsNs;
  throw new Error('echarts/dist/echarts.js 模块形状异常');
}
const echarts = echartsFromDistBundle(echartsDistNs);
import { MarketService, MarketReportItem, MarketReportDetail, TrendItem } from './market.service';

@Component({
  selector: 'app-market-list',
  standalone: true,
  imports: [
    CommonModule,
    NzTableModule, NzTagModule, NzSpinModule, NzEmptyModule, NzCardModule,
    NzButtonModule, NzIconModule,
    NgxEchartsDirective,
  ],
  providers: [provideEchartsCore({ echarts })],
  templateUrl: './market-list.component.html',
  styleUrl: './market-list.component.scss',
})
export class MarketListComponent implements OnInit {
  private readonly marketService = inject(MarketService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly loading = signal(true);
  readonly items = signal<MarketReportItem[]>([]);
  readonly total = signal(0);
  readonly page = signal(1);
  readonly pageSize = signal(20);
  readonly chartOptions = signal<EChartsOption | null>(null);

  // 详情视图状态
  readonly showDetail = signal(false);
  readonly detailDate = signal('');
  readonly detailLoading = signal(false);
  readonly detailError = signal('');
  readonly detailReport = signal<MarketReportDetail | null>(null);
  readonly detailSafeHtml = computed<SafeHtml | null>(() => {
    const r = this.detailReport();
    if (!r?.htmlContent) return null;
    return this.sanitizer.bypassSecurityTrustHtml(r.htmlContent);
  });

  ngOnInit(): void {
    this.loadData();
    this.loadTrend();
  }

  loadData(): void {
    this.loading.set(true);
    this.marketService.getList(this.page(), this.pageSize()).subscribe({
      next: (res) => {
        this.items.set(res.items);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  loadTrend(): void {
    const days = 30;
    this.marketService.getTrend(days).subscribe({
      next: (data) => {
        if (data.length === 0) return;
        this.chartOptions.set(this.buildChartOptions(data, days));
      },
    });
  }

  onPageChange(page: number): void {
    this.page.set(page);
    this.loadData();
  }

  openDetail(date: string): void {
    this.showDetail.set(true);
    this.detailDate.set(date);
    this.detailLoading.set(true);
    this.detailError.set('');
    this.detailReport.set(null);
    this.marketService.getDetail(date).subscribe({
      next: (data: MarketReportDetail | null) => {
        if (!data) {
          this.detailError.set(`未找到 ${date} 的报告`);
        } else {
          this.detailReport.set(data);
        }
        this.detailLoading.set(false);
      },
      error: (err: any) => {
        this.detailError.set(err.message || '加载失败');
        this.detailLoading.set(false);
      },
    });
  }

  backToList(): void {
    this.showDetail.set(false);
  }

  getIndexColor(val: number | null): string {
    if (val == null) return '#999';
    if (val < 20) return '#dc2626';
    if (val < 35) return '#ea580c';
    if (val < 50) return '#d97706';
    if (val < 65) return '#0891b2';
    return '#059669';
  }

  getLevelLabel(val: number | null): string {
    if (val == null) return '-';
    if (val < 20) return '极度恐慌';
    if (val < 35) return '恐慌';
    if (val < 50) return '偏恐慌';
    if (val < 65) return '中性';
    if (val < 80) return '偏贪婪';
    return '贪婪';
  }

  getLevelColor(val: number | null): string {
    if (val == null) return 'default';
    if (val < 20) return 'red';
    if (val < 35) return 'volcano';
    if (val < 50) return 'orange';
    if (val < 65) return 'cyan';
    return 'green';
  }

  private formatLocalDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private buildChartOptions(data: TrendItem[], days: number): EChartsOption {
    const byDate = new Map(data.map((d) => [d.date, d]));
    const filled: TrendItem[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = this.formatLocalDate(d);
      filled.push(
        byDate.get(key) ?? {
          date: key,
          aiIndex: null,
          kwIndex: null,
          panicTotal: null,
          bearFearPct: 0,
          totalPosts: 0,
        },
      );
    }

    const dates = filled.map((d) => d.date.substring(5));
    const aiValues = filled.map((d) => d.aiIndex);
    const kwValues = filled.map((d) => d.kwIndex);
    const panicValues = filled.map((d) => d.panicTotal);

    const panicNums = panicValues.filter((v): v is number => v != null);
    const panicMax = panicNums.length ? Math.max(...panicNums, 1) : 1;

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' },
      },
      legend: {
        data: ['AI 指数', '关键词指数', '恐慌词数'],
        bottom: 0,
      },
      grid: { left: 48, right: 48, bottom: '15%', top: 36, containLabel: false },
      xAxis: {
        type: 'category',
        data: dates,
        axisPointer: { type: 'shadow' },
        axisLabel: {
          fontSize: 11,
          interval: Math.max(0, Math.floor(days / 10) - 1),
        },
      },
      yAxis: [
        {
          type: 'value',
          name: '指数',
          position: 'left',
          min: 0,
          max: 100,
          interval: 20,
          axisLine: { show: true },
          axisLabel: { show: true, formatter: '{value}' },
          splitLine: { show: true, lineStyle: { type: 'dashed' } },
        },
        {
          type: 'value',
          name: '恐慌词数',
          position: 'right',
          min: 0,
          max: Math.ceil(panicMax * 1.2 / 10) * 10 || 10,
          interval: Math.max(10, Math.ceil(panicMax * 1.2 / 5 / 10) * 10),
          axisLine: { show: true },
          axisLabel: { show: true },
          splitLine: { show: false },
        },
      ],
      series: [
        {
          name: 'AI 指数',
          type: 'line',
          yAxisIndex: 0,
          smooth: true,
          connectNulls: true,
          showSymbol: true,
          symbolSize: 6,
          data: aiValues,
          itemStyle: { color: '#2563eb' },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(37,99,235,0.3)' },
                { offset: 1, color: 'rgba(37,99,235,0.02)' },
              ],
            },
          },
        },
        {
          name: '关键词指数',
          type: 'line',
          yAxisIndex: 0,
          smooth: true,
          connectNulls: true,
          showSymbol: true,
          symbolSize: 6,
          data: kwValues,
          itemStyle: { color: '#f59e0b' },
        },
        {
          name: '恐慌词数',
          type: 'bar',
          yAxisIndex: 1,
          data: panicValues,
          itemStyle: { color: 'rgba(239,68,68,0.5)' },
        },
      ],
    };
  }
}
