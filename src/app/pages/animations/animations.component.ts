import { ChangeDetectionStrategy, Component, OnDestroy, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  trigger, state, style, transition, animate, keyframes, query, stagger
} from '@angular/animations';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzDividerModule } from 'ng-zorro-antd/divider';

/** Angular Animations 演示：状态动画、关键帧、交错列表等。 */
@Component({
  selector: 'app-animations',
  imports: [NzCardModule, NzButtonModule, NzGridModule, NzTagModule, NzDividerModule, DecimalPipe],
  templateUrl: './animations.component.html',
  styleUrl: './animations.component.scss',
  animations: [
    trigger('fadeInOut', [
      state('visible', style({ opacity: 1, transform: 'scale(1)' })),
      state('hidden',  style({ opacity: 0, transform: 'scale(0.8)' })),
      transition('hidden => visible', animate('400ms ease-out')),
      transition('visible => hidden', animate('300ms ease-in')),
    ]),
    trigger('slideIn', [
      state('in',  style({ transform: 'translateX(0)', opacity: 1 })),
      state('out', style({ transform: 'translateX(-100%)', opacity: 0 })),
      transition('out => in',  animate('500ms cubic-bezier(0.35, 0, 0.25, 1)')),
      transition('in => out',  animate('400ms cubic-bezier(0.35, 0, 0.25, 1)')),
    ]),
    trigger('bounce', [
      transition('* => bounce', animate('600ms', keyframes([
        style({ transform: 'translateY(0)',    offset: 0 }),
        style({ transform: 'translateY(-30px)', offset: 0.3 }),
        style({ transform: 'translateY(0)',    offset: 0.6 }),
        style({ transform: 'translateY(-12px)', offset: 0.75 }),
        style({ transform: 'translateY(0)',    offset: 0.9 }),
        style({ transform: 'translateY(-4px)', offset: 0.95 }),
        style({ transform: 'translateY(0)',    offset: 1 }),
      ])))
    ]),
    trigger('rotate', [
      transition(':enter', animate('600ms', keyframes([
        style({ transform: 'rotate(0deg)', offset: 0 }),
        style({ transform: 'rotate(360deg)', offset: 1 }),
      ])))
    ]),
    trigger('listAnim', [
      transition('* => *', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(-10px)' }),
          stagger(80, [
            // MARK: 处理
            animate('300ms ease', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnimationsComponent implements OnDestroy {
  // Fade
  readonly fadeState = signal('hidden');
  readonly fadeActive = signal(false);
  // MARK: 切换
  toggleFade() {
    const active = !this.fadeActive();
    this.fadeState.set(active ? 'visible' : 'hidden');
    this.fadeActive.set(active);
  }

  // Slide
  readonly slideState = signal('out');
  readonly slideActive = signal(false);
  // MARK: 切换
  toggleSlide() {
    const active = !this.slideActive();
    this.slideState.set(active ? 'in' : 'out');
    this.slideActive.set(active);
  }

  // Bounce
  readonly bounceState = signal('');
  // MARK: 处理
  doBounce() { this.bounceState.set('bounce'); }
  // MARK: 事件处理
  onBounceDone() { this.bounceState.set(''); }

  // Counter
  readonly counterValue = signal(0);
  readonly counterTarget = 2568;
  readonly counterRunning = signal(false);
  private counterInterval: ReturnType<typeof setInterval> | null = null;
  // MARK: 计数
  runCounter() {
    if (this.counterRunning()) return;
    this.counterRunning.set(true);
    this.counterValue.set(0);
    const step = Math.ceil(this.counterTarget / 60);
    this.counterInterval = setInterval(() => {
      const next = Math.min(this.counterValue() + step, this.counterTarget);
      this.counterValue.set(next);
      if (next >= this.counterTarget) {
        this.clearCounterInterval();
        this.counterRunning.set(false);
      }
    }, 16);
  }

  // Stagger list
  readonly listItems = signal<string[]>([]);
  readonly listVisible = signal(false);
  // MARK: 切换
  toggleList() {
    const visible = !this.listVisible();
    this.listVisible.set(visible);
    this.listItems.set(
      visible
        ? ['Angular 19 Signals', 'ng-zorro-antd v19', 'ECharts 5.x', 'Standalone Components', 'Lazy Loading Routes', 'Reactive Forms']
        : []
    );
  }

  // Spinner
  readonly spinnerAngle = signal(0);
  readonly spinnerRunning = signal(false);
  private spinnerInterval: ReturnType<typeof setInterval> | null = null;
  // MARK: 切换
  toggleSpinner() {
    const running = !this.spinnerRunning();
    this.spinnerRunning.set(running);
    if (running) {
      this.spinnerInterval = setInterval(() => this.spinnerAngle.update((a) => a + 6), 16);
    } else {
      this.clearSpinnerInterval();
    }
  }

  // MARK: 销毁清理
  // 取消全部订阅，避免内存泄漏
  ngOnDestroy(): void {
    this.clearCounterInterval();
    this.clearSpinnerInterval();
  }

  // MARK: 清空
  private clearCounterInterval(): void {
    if (this.counterInterval === null) return;
    clearInterval(this.counterInterval);
    this.counterInterval = null;
  }

  // MARK: 清空
  private clearSpinnerInterval(): void {
    if (this.spinnerInterval === null) return;
    clearInterval(this.spinnerInterval);
    this.spinnerInterval = null;
  }
}
