import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTagModule } from 'ng-zorro-antd/tag';
import {
  hardDrop,
  getKindRelativeCells,
  getPieceCells,
  moveLeft,
  moveRight,
  newTetrisState,
  restart,
  rotateCW,
  softDrop,
  tick,
  togglePause,
  type TetrisState
} from './tetris-game';
import { GameScoreService } from '../../services/game-score.service';

/** 俄罗斯方块：10×20 棋盘 DOM 渲染，逻辑在 `tetris-game.ts`。 */
@Component({
  selector: 'app-tetris',
  imports: [NzCardModule, NzButtonModule, NzGridModule, NzTagModule],
  templateUrl: './tetris.component.html',
  styleUrl: './tetris.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TetrisComponent implements OnInit, OnDestroy {
  private readonly scoreService = inject(GameScoreService);

  readonly width = 10;
  readonly height = 20;
  readonly tickMs = 520;

  readonly state = signal<TetrisState>(newTetrisState({ width: this.width, height: this.height, seed: 1 }));

  readonly rows = Array.from({ length: this.height }, (_, i) => i);
  readonly cols = Array.from({ length: this.width }, (_, i) => i);

  readonly cellColors = computed<Array<string | null>>(() => {
    const state = this.state();
    const colors = state.board.slice();
    const active = state.active;
    for (const p of getPieceCells(active)) {
      if (p.y < 0) continue;
      if (p.x < 0 || p.x >= this.width) continue;
      if (p.y >= this.height) continue;
      colors[p.y * this.width + p.x] = active.color;
    }
    return colors;
  });

  readonly previewSize = 4;
  readonly previewRows = Array.from({ length: this.previewSize }, (_, i) => i);
  readonly previewCols = Array.from({ length: this.previewSize }, (_, i) => i);
  readonly nextPreviewColors = computed<Array<string | null>>(() => {
    const size = this.previewSize;
    const colors = Array.from({ length: size * size }, () => null as string | null);
    const next = this.state().next;
    const points = getKindRelativeCells(next.kind, 0);

    let minX = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const p of points) {
      minX = Math.min(minX, p.x);
      maxX = Math.max(maxX, p.x);
      minY = Math.min(minY, p.y);
      maxY = Math.max(maxY, p.y);
    }

    const shapeW = (maxX - minX) + 1;
    const shapeH = (maxY - minY) + 1;
    const offsetX = Math.floor((size - shapeW) / 2) - minX;
    const offsetY = Math.floor((size - shapeH) / 2) - minY;

    for (const p of points) {
      const x = p.x + offsetX;
      const y = p.y + offsetY;
      if (x < 0 || x >= size) continue;
      if (y < 0 || y >= size) continue;
      colors[y * size + x] = next.color;
    }

    return colors;
  });

  readonly bestScore = signal(0);
  private intervalId: number | null = null;

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
  restart(): void {
    this.state.update((s) => restart(s));
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
      this.scoreService.submit('tetris', next.score).subscribe({
        next: () => this.loadBestScore(),
        error: () => {}
      });
    }
  }

  // MARK: 处理
  left(): void { this.apply(moveLeft); }
  // MARK: 处理
  right(): void { this.apply(moveRight); }
  // MARK: 旋转
  rotate(): void { this.apply(rotateCW); }
  // MARK: 处理
  down(): void { this.apply(softDrop); }
  // MARK: 下落
  drop(): void { this.apply(hardDrop); }

  // MARK: 加载
  loadBestScore(): void {
    this.scoreService.getBest('tetris').subscribe({
      next: (res) => { this.bestScore.set(res?.score || 0); },
      error: () => {}
    });
  }

  // MARK: 应用
  private apply(fn: (s: TetrisState) => TetrisState): void {
    this.state.update((s) => fn(s));
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
    if (key === 'arrowleft' || key === 'a') { e.preventDefault(); this.left(); }
    else if (key === 'arrowright' || key === 'd') { e.preventDefault(); this.right(); }
    else if (key === 'arrowdown' || key === 's') { e.preventDefault(); this.down(); }
    else if (key === 'arrowup' || key === 'w') { e.preventDefault(); this.rotate(); }
    else if (key === ' ') { e.preventDefault(); this.drop(); }
    else if (key === 'p') { e.preventDefault(); this.pauseResume(); }
    else if (key === 'r') { e.preventDefault(); this.restart(); }
  };
}
