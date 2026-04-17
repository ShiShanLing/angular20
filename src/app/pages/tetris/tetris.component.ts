import { Component, OnDestroy, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-tetris',
  imports: [NzCardModule, NzButtonModule, NzGridModule, NzTagModule],
  templateUrl: './tetris.component.html',
  styleUrl: './tetris.component.scss'
})
export class TetrisComponent implements OnInit, OnDestroy {
  /**
   * 经典棋盘：10x20。
   * 采用纯 DOM + CSS Grid 渲染，不引入 Canvas 依赖。
   */
  readonly width = 10;
  readonly height = 20;
  /**
   * 重力 tick 间隔（毫秒）。
   * 为了保持“最小实现”，这里不做等级加速；后续需要可以按 lines/score 调整。
   */
  readonly tickMs = 520;

  state: TetrisState = newTetrisState({ width: this.width, height: this.height, seed: 1 });

  rows = Array.from({ length: this.height }, (_, i) => i);
  cols = Array.from({ length: this.width }, (_, i) => i);

  /** 渲染用的“最终棋盘颜色”（包含已锁定 board + 当前 active 叠加）。 */
  cellColors: Array<string | null> = [];

  /**
   * 下一块预览：使用一个 4x4 小网格渲染（俄罗斯方块的标准预览尺寸）。
   * - `null`：空格
   * - `string`：颜色
   */
  readonly previewSize = 4;
  previewRows = Array.from({ length: this.previewSize }, (_, i) => i);
  previewCols = Array.from({ length: this.previewSize }, (_, i) => i);
  nextPreviewColors: Array<string | null> = [];

  private intervalId: number | null = null;

  ngOnInit(): void {
    this.rebuildCellColors();
    this.rebuildNextPreview();
    this.startLoop();
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
  }

  ngOnDestroy(): void {
    this.stopLoop();
    window.removeEventListener('keydown', this.onKeyDown);
  }

  /** 重开（默认用当前时间作为 seed，保证每局颜色/方块序列不同）。 */
  restart(): void {
    this.state = restart(this.state);
    this.rebuildCellColors();
    this.rebuildNextPreview();
  }

  pauseResume(): void {
    this.state = togglePause(this.state);
  }

  /** 主循环：每次 tick 只负责“重力下落一步/锁定结算”。 */
  step(): void {
    const next = tick(this.state);
    if (next === this.state) return;
    this.state = next;
    this.rebuildCellColors();
    this.rebuildNextPreview();
  }

  left(): void {
    this.apply(moveLeft);
  }

  right(): void {
    this.apply(moveRight);
  }

  rotate(): void {
    this.apply(rotateCW);
  }

  down(): void {
    this.apply(softDrop);
  }

  drop(): void {
    this.apply(hardDrop);
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

  /**
   * 重新构建 cellColors：
   * - 先拷贝已锁定的 board
   * - 再把 active 的 4 个格子叠加上去（active 的颜色覆盖 board 的空格）
   *
   * 这样模板渲染只需要 O(1) 取数组，不需要复杂计算。
   */
  private rebuildCellColors(): void {
    const colors = this.state.board.slice();
    // 把 active 的 4 个格子叠加到最终颜色数组上（active 覆盖 board 的空格）。
    const active = this.state.active;
    for (const p of getPieceCells(active)) {
      if (p.y < 0) continue;
      if (p.x < 0 || p.x >= this.width) continue;
      if (p.y >= this.height) continue;
      colors[p.y * this.width + p.x] = active.color;
    }
    this.cellColors = colors;
  }

  /**
   * 重建下一块预览（4x4）。
   * 预览仅展示 `state.next.kind` 在 rotation=0 的形状，并用 `state.next.color` 着色。
   */
  private rebuildNextPreview(): void {
    const size = this.previewSize;
    const colors = Array.from({ length: size * size }, () => null as string | null);
    const points = getKindRelativeCells(this.state.next.kind, 0);

    // 让预览图形在 4x4 网格中“居中显示”：
    // 1) 先计算图形的包围盒（bounding box）
    // 2) 再把包围盒整体平移到预览网格中心
    //
    // 说明：不同方块的相对坐标范围不同（例如 I 是 4 格长条），
    // 直接按原坐标绘制会导致看起来偏上/偏左。
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

  /**
   * 键盘输入：
   * - ←/A：左移
   * - →/D：右移
   * - ↓/S：软降（下 1 格）
   * - ↑/W：旋转
   * - Space：硬降
   * - P：暂停/继续
   * - R：重开
   */
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
