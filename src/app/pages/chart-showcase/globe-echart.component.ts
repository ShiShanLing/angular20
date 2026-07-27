import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  input,
} from '@angular/core';
import type { ECharts, EChartsOption } from 'echarts';

/** 与 package.json 对齐 */
const ECHARTS_UMD = 'https://cdn.jsdelivr.net/npm/echarts@5.6.0/dist/echarts.min.js';
const ECHARTS_GL_UMD = 'https://cdn.jsdelivr.net/npm/echarts-gl@2.0.9/dist/echarts-gl.min.js';

const SCRIPT_ECHARTS_ID = 'app-globe-echarts-umd';
const SCRIPT_GL_ID = 'app-globe-echarts-gl-umd';

let echartsGlGlobalReady: Promise<void> | null = null;

// MARK: 注入脚本
// 同一 URL 只插入一次；若标签已存在仍在加载，则等待其 load/error。
function injectScriptOnce(id: string, src: string): Promise<void> {
  const existing = document.getElementById(id) as HTMLScriptElement | null;
  if (existing?.dataset['appLoaded'] === '1') {
    return Promise.resolve();
  }
  if (existing && !existing.dataset['appLoaded']) {
    return new Promise((resolve, reject) => {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error(`脚本加载失败：${src}`)), {
        once: true,
      });
    });
  }
  
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.id = id;
    s.src = src;
    s.async = true;
    s.onload = () => {
      s.dataset['appLoaded'] = '1';
      resolve();
    };
    s.onerror = () => reject(new Error(`脚本加载失败：${src}`));
    document.head.appendChild(s);
  });
}

// MARK: 加载图表
function ensureEchartsGlGlobal(): Promise<void> {
  if (!echartsGlGlobalReady) {
    echartsGlGlobalReady = (async () => {
      const g = globalThis as unknown as { echarts?: { init?: unknown } };
      if (!g.echarts || typeof g.echarts.init !== 'function') {
        await injectScriptOnce(SCRIPT_ECHARTS_ID, ECHARTS_UMD);
      }
      await injectScriptOnce(SCRIPT_GL_ID, ECHARTS_GL_UMD);
    })().catch((err) => {
      echartsGlGlobalReady = null;
      throw err;
    });
  }
  return echartsGlGlobalReady;
}

/**
 * 通过 CDN UMD 注入，保证 echarts-gl 与 `echarts.init` 使用同一全局对象，避免 Unknown series。
 */
@Component({
  selector: 'app-globe-echart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<div #host class="globe-host-inner"></div>',
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        height: 520px;
        min-height: 380px;
        border-radius: 10px;
        overflow: hidden;
        background: #020617;
      }
      .globe-host-inner {
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class GlobeEchartComponent implements AfterViewInit, OnDestroy {
  @ViewChild('host', { static: true }) hostRef!: ElementRef<HTMLDivElement>;

  readonly options = input<EChartsOption>({});

  private chart: ECharts | null = null;

  // MARK: 构造注入
  // options 变化时同步到图表
  constructor() {
    effect(() => {
      const next = this.options();
      if (!this.chart || !next || Object.keys(next).length === 0) {
        return;
      }
      this.chart.setOption(next, { notMerge: true });
    });
  }

  // MARK: 获取
  private getEcharts(): typeof import('echarts') | null {
    const g = globalThis as unknown as { echarts?: typeof import('echarts') };
    const ec = g.echarts;
    return ec && typeof ec.init === 'function' ? ec : null;
  }

  // MARK: 视图就绪
  // 加载 ECharts GL 并初始化实例
  async ngAfterViewInit(): Promise<void> {
    try {
      await ensureEchartsGlGlobal();
    } catch (e) {
      console.error('[app-globe-echart] 无法加载 ECharts / echarts-gl（检查网络或 CSP）', e);
      return;
    }
    const ec = this.getEcharts();
    if (!ec) {
      console.error('[app-globe-echart] globalThis.echarts 仍不可用');
      return;
    }
    this.chart = ec.init(this.hostRef.nativeElement);
    queueMicrotask(() => this.chart?.resize());
    const next = this.options();
    if (next && Object.keys(next).length > 0) {
      this.chart.setOption(next, { notMerge: true });
    }
  }

  // MARK: 销毁清理
  // 释放图表实例
  ngOnDestroy(): void {
    this.chart?.dispose();
    this.chart = null;
  }
}
