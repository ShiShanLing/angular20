import { Component, OnDestroy, OnInit, inject } from '@angular/core';
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
  styleUrl: './snake.component.scss'
})
export class SnakeComponent implements OnInit, OnDestroy {
  private scoreService = inject(GameScoreService);

  readonly width = 20;
  readonly height = 20;
  readonly tickMs = 140;

  state: SnakeGameState = newGameState({ width: this.width, height: this.height, seed: 1 });

  rows = Array.from({ length: this.height }, (_, i) => i);
  cols = Array.from({ length: this.width }, (_, i) => i);

  private intervalId: number | null = null;
  private snakeKeySet = new Set<string>();
  headKey = '';
  foodKey = '';
  bestScore = 0;

  ngOnInit(): void {
    this.rebuildDerivedKeys();
    this.startLoop();
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
    this.loadBestScore();
  }

  ngOnDestroy(): void {
    this.stopLoop();
    window.removeEventListener('keydown', this.onKeyDown);
  }

  restart(seed = (Date.now() >>> 0)): void {
    this.state = newGameState({ width: this.width, height: this.height, seed });
    this.rebuildDerivedKeys();
  }

  pauseResume(): void {
    this.state = togglePause(this.state);
  }

  step(): void {
    const prevGameOver = this.state.isGameOver;
    const next = tick(this.state);
    if (next === this.state) return;
    this.state = next;
    this.rebuildDerivedKeys();

    // 游戏刚结束时提交分数
    if (!prevGameOver && next.isGameOver && next.score > 0) {
      this.scoreService.submit('snake', next.score).subscribe({
        next: () => this.loadBestScore(),
        error: () => {} // 静默失败
      });
    }
  }

  move(direction: Direction): void {
    const next = queueDirection(this.state, direction);
    if (next === this.state) return;
    this.state = next;
  }

  cellKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  isSnakeCell(x: number, y: number): boolean {
    return this.snakeKeySet.has(this.cellKey(x, y));
  }

  isHeadCell(x: number, y: number): boolean {
    return this.headKey === this.cellKey(x, y);
  }

  isFoodCell(x: number, y: number): boolean {
    return this.foodKey === this.cellKey(x, y);
  }

  loadBestScore(): void {
    this.scoreService.getBest('snake').subscribe({
      next: (res) => { this.bestScore = res?.score || 0; },
      error: () => {}
    });
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

  private rebuildDerivedKeys(): void {
    this.snakeKeySet = new Set(this.state.snake.map(p => this.cellKey(p.x, p.y)));
    const head = this.state.snake[0];
    this.headKey = this.cellKey(head.x, head.y);
    this.foodKey = this.cellKey(this.state.food.x, this.state.food.y);
  }

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
