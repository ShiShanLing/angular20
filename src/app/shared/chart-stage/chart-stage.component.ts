import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import * as echartsCore from 'echarts/core';
import * as echartsDistNs from 'echarts/dist/echarts.js';

type FsElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  mozRequestFullScreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

type FsDocument = Document & {
  webkitFullscreenElement?: Element | null;
  mozFullScreenElement?: Element | null;
  msFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
  mozCancelFullScreen?: () => Promise<void> | void;
  msExitFullscreen?: () => Promise<void> | void;
};

type EChartsLike = {
  getInstanceByDom?: (dom: HTMLElement) => { resize: () => void } | undefined;
};

// chart-showcase 用的是 echarts/dist 全量包，与 echarts/core 实例表不互通
function distEcharts(): EChartsLike {
  const root = echartsDistNs as unknown as Record<string, unknown>;
  if (typeof root['getInstanceByDom'] === 'function') {
    return root as unknown as EChartsLike;
  }
  const inner = root['default'] as Record<string, unknown> | undefined;
  if (inner && typeof inner['getInstanceByDom'] === 'function') {
    return inner as unknown as EChartsLike;
  }
  return {};
}

/**
 * 图表舞台：系统 Fullscreen API（占满显示器）。
 * 全屏后主动 resize（兼容 ngx-echarts / echarts.dist 两套实例表），避免 geo 地图卡在原尺寸。
 */
@Component({
  selector: 'app-chart-stage',
  imports: [NzIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <div
      #stage
      class="chart-stage"
      [class.chart-stage--fs]="isFullscreen()"
    >
      <div class="chart-stage__body">
        <ng-content />
      </div>
      <button
        type="button"
        class="chart-stage__btn"
        [attr.title]="isFullscreen() ? '退出全屏 (Esc)' : '全屏（占满整个屏幕）'"
        [attr.aria-label]="isFullscreen() ? '退出全屏' : '全屏'"
        (click)="toggleFullscreen()"
      >
        <span nz-icon [nzType]="isFullscreen() ? 'compress' : 'expand'" nzTheme="outline"></span>
      </button>
    </div>
  `,
  styles: [
    `
      app-chart-stage {
        display: block;
        width: 100%;
      }

      .chart-stage {
        position: relative;
        display: block;
        width: 100%;
      }

      .chart-stage__body {
        width: 100%;
        height: 100%;
      }

      .chart-stage__btn {
        position: absolute;
        right: 10px;
        bottom: 10px;
        z-index: 6;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: 36px;
        height: 36px;
        padding: 0;
        border: 1px solid rgba(15, 23, 42, 0.12);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.9);
        color: #334155;
        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.12);
        cursor: pointer;
        backdrop-filter: blur(8px);
        transition:
          background 0.15s ease,
          color 0.15s ease,
          transform 0.15s ease;
      }

      .chart-stage__btn:hover {
        background: #fff;
        color: #0f172a;
        transform: translateY(-1px);
      }

      .chart-stage__btn:focus-visible {
        outline: 2px solid #1677ff;
        outline-offset: 2px;
      }

      .chart-stage:fullscreen,
      .chart-stage:-webkit-full-screen {
        box-sizing: border-box;
        width: 100vw;
        height: 100vh;
        width: 100dvw;
        height: 100dvh;
        margin: 0;
        padding: 12px;
        background: #0b1220;
        overflow: hidden;
      }

      .chart-stage:fullscreen .chart-stage__body,
      .chart-stage:-webkit-full-screen .chart-stage__body {
        width: 100%;
        height: 100%;
        min-height: 0;
      }

      .chart-stage:fullscreen .chart-stage__btn,
      .chart-stage:-webkit-full-screen .chart-stage__btn {
        right: 20px;
        bottom: 20px;
        background: rgba(15, 23, 42, 0.75);
        border-color: rgba(148, 163, 184, 0.35);
        color: #e2e8f0;
      }

      /* 覆盖业务页里 .echart--geo-flight { height:460px } 等固定高度 */
      .chart-stage:fullscreen .chart-stage__body .echart,
      .chart-stage:fullscreen .chart-stage__body .chart-area,
      .chart-stage:fullscreen .chart-stage__body app-globe-echart,
      .chart-stage:-webkit-full-screen .chart-stage__body .echart,
      .chart-stage:-webkit-full-screen .chart-stage__body .chart-area,
      .chart-stage:-webkit-full-screen .chart-stage__body app-globe-echart {
        width: 100% !important;
        height: 100% !important;
        min-height: 100% !important;
        max-height: none !important;
        border-radius: 0 !important;
      }
    `,
  ],
})
export class ChartStageComponent {
  private readonly destroyRef = inject(DestroyRef);
  private readonly message = inject(NzMessageService);
  private readonly stageRef = viewChild.required<ElementRef<HTMLElement>>('stage');

  readonly isFullscreen = signal(false);

  constructor() {
    const sync = () => {
      const stage = this.stageRef().nativeElement;
      const active = this.getFullscreenElement();
      const on = active === stage;
      this.isFullscreen.set(on);
      this.applyChartBoxStyles(on);
      this.resizeChartsSoon();
    };
    document.addEventListener('fullscreenchange', sync);
    document.addEventListener('webkitfullscreenchange', sync as EventListener);
    document.addEventListener('mozfullscreenchange', sync as EventListener);
    document.addEventListener('MSFullscreenChange', sync as EventListener);
    this.destroyRef.onDestroy(() => {
      document.removeEventListener('fullscreenchange', sync);
      document.removeEventListener('webkitfullscreenchange', sync as EventListener);
      document.removeEventListener('mozfullscreenchange', sync as EventListener);
      document.removeEventListener('MSFullscreenChange', sync as EventListener);
    });
  }

  // MARK: 切换系统全屏
  async toggleFullscreen(): Promise<void> {
    const stage = this.stageRef().nativeElement as FsElement;
    try {
      if (this.getFullscreenElement()) {
        await this.exitFullscreen();
        return;
      }
      await this.enterFullscreen(stage);
    } catch {
      this.message.warning('当前浏览器不允许全屏，请检查权限或改用 Chrome / Edge');
    }
  }

  private getFullscreenElement(): Element | null {
    const doc = document as FsDocument;
    return (
      document.fullscreenElement ||
      doc.webkitFullscreenElement ||
      doc.mozFullScreenElement ||
      doc.msFullscreenElement ||
      null
    );
  }

  private async enterFullscreen(el: FsElement): Promise<void> {
    if (el.requestFullscreen) {
      await el.requestFullscreen({ navigationUI: 'hide' });
      return;
    }
    if (el.webkitRequestFullscreen) {
      await el.webkitRequestFullscreen();
      return;
    }
    if (el.mozRequestFullScreen) {
      await el.mozRequestFullScreen();
      return;
    }
    if (el.msRequestFullscreen) {
      await el.msRequestFullscreen();
      return;
    }
    throw new Error('Fullscreen API not supported');
  }

  private async exitFullscreen(): Promise<void> {
    const doc = document as FsDocument;
    if (document.exitFullscreen) {
      await document.exitFullscreen();
      return;
    }
    if (doc.webkitExitFullscreen) {
      await doc.webkitExitFullscreen();
      return;
    }
    if (doc.mozCancelFullScreen) {
      await doc.mozCancelFullScreen();
      return;
    }
    if (doc.msExitFullscreen) {
      await doc.msExitFullscreen();
    }
  }

  /** 全屏时用内联样式压过页面固定高度，退出时清掉 */
  private applyChartBoxStyles(on: boolean): void {
    const stage = this.stageRef().nativeElement;
    const boxes = stage.querySelectorAll<HTMLElement>(
      '.echart, .chart-area, app-globe-echart, .globe-host-inner',
    );
    boxes.forEach((el) => {
      if (on) {
        el.style.setProperty('width', '100%', 'important');
        el.style.setProperty('height', '100%', 'important');
        el.style.setProperty('min-height', '100%', 'important');
        el.style.setProperty('max-height', 'none', 'important');
      } else {
        el.style.removeProperty('width');
        el.style.removeProperty('height');
        el.style.removeProperty('min-height');
        el.style.removeProperty('max-height');
      }
    });
  }

  private resizeChartsSoon(): void {
    const run = () => this.resizeChartsNow();
    requestAnimationFrame(() => {
      run();
      setTimeout(run, 50);
      setTimeout(run, 160);
      setTimeout(run, 320);
    });
  }

  private resizeChartsNow(): void {
    const stage = this.stageRef().nativeElement;
    const apis: EChartsLike[] = [echartsCore as EChartsLike, distEcharts()];

    const doms = new Set<HTMLElement>();
    stage.querySelectorAll<HTMLElement>('[_echarts_instance_]').forEach((el) => doms.add(el));
    stage.querySelectorAll<HTMLElement>('.echart, .chart-area, .globe-host-inner').forEach((el) => {
      doms.add(el);
    });

    doms.forEach((dom) => {
      for (const api of apis) {
        try {
          api.getInstanceByDom?.(dom)?.resize();
        } catch {
          // 不同打包副本互不识别，忽略
        }
      }
      // 轻推一像素，确保 ngx-echarts 的 ResizeObserver 也会触发
      const h = dom.clientHeight;
      if (h > 0) {
        const prev = dom.style.getPropertyValue('height');
        const prevPriority = dom.style.getPropertyPriority('height');
        dom.style.setProperty('height', `${h + 1}px`);
        void dom.offsetHeight;
        if (prev) {
          dom.style.setProperty('height', prev, prevPriority);
        } else {
          dom.style.removeProperty('height');
        }
      }
    });
  }
}
