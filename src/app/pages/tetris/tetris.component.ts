import { Component, OnDestroy, OnInit, inject } from '@angular/core';
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
  styleUrl: './tetris.component.scss'
})
export class TetrisComponent implements OnInit, OnDestroy {
  private scoreService = inject(GameScoreService);

  readonly width = 10;
  readonly height = 20;
  readonly tickMs = 520;

  state: TetrisState = newTetrisState({ width: this.width, height: this.height, seed: 1 });

  rows = Array.from({ length: this.height }, (_, i) => i);
  cols = Array.from({ length: this.width }, (_, i) => i);

  cellColors: Array<string | null> = [];

  readonly previewSize = 4;
  previewRows = Array.from({ length: this.previewSize }, (_, i) => i);
  previewCols = Array.from({ length: this.previewSize }, (_, i) => i);
  nextPreviewColors: Array<string | null> = [];

  bestScore = 0;
  private intervalId: number | null = null;

  ngOnInit(): void {
    this.rebuildCellColors();
    this.rebuildNextPreview();
    this.startLoop();
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    this.loadBestScore();
  }

  ngOnDestroy(): void {
    this.stopLoop();
    window.removeEventListener('keydown', this.onKeyDown);
  }

  restart(): void {
    this.state = restart(this.state);
    this.rebuildCellColors();
    this.rebuildNextPreview();
  }

  pauseResume(): void {
    this.state = togglePause(this.state);
  }

  step(): void {
    const prevGameOver = this.state.isGameOver;
    const next = tick(this.state);
    if (next === this.state) return;
    this.state = next;
    this.rebuildCellColors();
    this.rebuildNextPreview();

    // 游戏刚结束时提交分数
    if (!prevGameOver && next.isGameOver && next.score > 0) {
      this.scoreService.submit('tetris', next.score).subscribe({
        next: () => this.loadBestScore(),
        error: () => {}
      });
    }
  }

  left(): void { this.apply(moveLeft); }
  right(): void { this.apply(moveRight); }
  rotate(): void { this.apply(rotateCW); }
  down(): void { this.apply(softDrop); }
  drop(): void { this.apply(hardDrop); }

  loadBestScore(): void {
    this.scoreService.getBest('tetris').subscribe({
      next: (res) => { this.bestScore = res?.score || 0; },
      error: () => {}
    });
  }

  private apply(fn: (s: TetrisState) => TetrisState): void {
    const next = fn(this.state);
    if (next === this.state) return;
    this.state = next;
    this.rebuildCellColors();
    this.rebuildNextPreview();
  }

  private startLoop(): void {
    this.stopLoop();
    this.intervalId = window.setInterval(() => this.step(), this.tickMs);
  }

  private stopLoop(): void {
    if (this.intervalId === null) return;
    window.clearInterval(this.intervalId);
    this.intervalId = null;
  }

  private rebuildCellColors(): void {
    const colors = this.state.board.slice();
    const active = this.state.active;
    for (const p of getPieceCells(active)) {
      if (p.y < 0) continue;
      if (p.x < 0 || p.x >= this.width) continue;
      if (p.y >= this.height) continue;
      colors[p.y * this.width + p.x] = active.color;
    }
    this.cellColors = colors;
  }

  private rebuildNextPreview(): void {
    const size = this.previewSize;
    const colors = Array.from({ length: size * size }, () => null as string | null);
    const points = getKindRelativeCells(this.state.next.kind, 0);

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
      colors[y * size + x] = this.state.next.color;
    }

    this.nextPreviewColors = colors;
  }

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
