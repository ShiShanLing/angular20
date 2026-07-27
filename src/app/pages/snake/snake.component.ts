import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Direction, newGameState, queueDirection, SnakeGameState, tick, togglePause } from './snake-game';
import { GameScoreService } from '../../services/game-score.service';

@Component({
  selector: 'app-snake',
  imports: [NzCardModule, NzButtonModule, NzGridModule, NzTagModule],
  templateUrl: './snake.component.html',
  styleUrl: './snake.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SnakeComponent implements OnInit, OnDestroy {
  private readonly scoreService = inject(GameScoreService);

  readonly width = 20;
  readonly height = 20;
  readonly tickMs = 140;

  readonly state = signal<SnakeGameState>(newGameState({ width: this.width, height: this.height, seed: 1 }));

  readonly rows = Array.from({ length: this.height }, (_, i) => i);
  readonly cols = Array.from({ length: this.width }, (_, i) => i);

  private intervalId: number | null = null;
  readonly snakeKeySet = computed(() => new Set(this.state().snake.map(p => this.cellKey(p.x, p.y))));
  readonly headKey = computed(() => {
    const head = this.state().snake[0];
    return this.cellKey(head.x, head.y);
  });
  readonly foodKey = computed(() => this.cellKey(this.state().food.x, this.state().food.y));
  readonly bestScore = signal(0);

  // MARK: 初始化
  // 组件初始化：同步移动端断点、订阅视口变化与路由事件
  ngOnInit(): void {
    this.startLoop();
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    this.loadBestScore();
  }

  // MARK: 销毁清理
  // 取消全部订阅，避免内存泄漏
  ngOnDestroy(): void {
    this.stopLoop();
    window.removeEventListener('keydown', this.onKeyDown);
  }

  // MARK: 重新开始
  restart(seed = (Date.now() >>> 0)): void {
    this.state.set(newGameState({ width: this.width, height: this.height, seed }));
  }

  // MARK: 暂停
  pauseResume(): void {
    this.state.update((s) => togglePause(s));
  }

  // MARK: 步进
  step(): void {
    const current = this.state();
    const prevGameOver = current.isGameOver;
    const next = tick(current);
    if (next === current) return;
    this.state.set(next);

    // 游戏刚结束时提交分数
    if (!prevGameOver && next.isGameOver && next.score > 0) {
      this.scoreService.submit('snake', next.score).subscribe({
        next: () => this.loadBestScore(),
        error: () => {} // 静默失败
      });
    }
  }

  // MARK: 移动
  move(direction: Direction): void {
    this.state.update((s) => queueDirection(s, direction));
  }

  // MARK: 格子
  cellKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  // MARK: 判断
  isSnakeCell(x: number, y: number): boolean {
    return this.snakeKeySet().has(this.cellKey(x, y));
  }

  // MARK: 判断
  isHeadCell(x: number, y: number): boolean {
    return this.headKey() === this.cellKey(x, y);
  }

  // MARK: 判断
  isFoodCell(x: number, y: number): boolean {
    return this.foodKey() === this.cellKey(x, y);
  }

  // MARK: 加载
  loadBestScore(): void {
    this.scoreService.getBest('snake').subscribe({
      next: (res) => { this.bestScore.set(res?.score || 0); },
      error: () => {}
    });
  }

  // MARK: 开始
  private startLoop(): void {
    this.stopLoop();
    this.intervalId = window.setInterval(() => this.step(), this.tickMs);
  }

  // MARK: 停止
  private stopLoop(): void {
    if (this.intervalId === null) return;
    window.clearInterval(this.intervalId);
    this.intervalId = null;
  }

  // MARK: 按键处理
  private onKeyDown = (e: KeyboardEvent) => {
    const key = e.key.toLowerCase();
    if (key === 'arrowup' || key === 'w') { e.preventDefault(); this.move('up'); }
    else if (key === 'arrowdown' || key === 's') { e.preventDefault(); this.move('down'); }
    else if (key === 'arrowleft' || key === 'a') { e.preventDefault(); this.move('left'); }
    else if (key === 'arrowright' || key === 'd') { e.preventDefault(); this.move('right'); }
    else if (key === ' ') { e.preventDefault(); this.pauseResume(); }
    else if (key === 'r') { e.preventDefault(); this.restart(); }
  };
}
