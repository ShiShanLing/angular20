import { Component, OnDestroy, OnInit } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { Direction, newGameState, queueDirection, SnakeGameState, tick, togglePause } from './snake-game';

@Component({
  selector: 'app-snake',
  imports: [NzCardModule, NzButtonModule, NzGridModule, NzTagModule],
  templateUrl: './snake.component.html',
  styleUrl: './snake.component.scss'
})
export class SnakeComponent implements OnInit, OnDestroy {
  /**
   * 棋盘尺寸（单位：格）。
   * 这里保持较小，避免用 Canvas/额外依赖，直接用 DOM 也能流畅渲染。
   */
  readonly width = 20;
  readonly height = 20;
  /**
   * Tick 间隔（毫秒）。
   * 每次 tick 恰好移动 1 格（经典“离散网格”移动）。
   */
  readonly tickMs = 140;

  /**
   * 游戏完整状态都放在这里，并且只通过 `tick()` 推进。
   * 具体规则是纯函数，集中在 `snake-game.ts`，便于单测与复用。
   */
  state: SnakeGameState = newGameState({ width: this.width, height: this.height, seed: 1 });

  /**
   * 预先构建的行/列索引数组，用于模板循环。
   * 因为棋盘尺寸固定，所以这两组数组也固定。
   */
  rows = Array.from({ length: this.height }, (_, i) => i);
  cols = Array.from({ length: this.width }, (_, i) => i);

  /**
   * 经典贪吃蛇循环的 `setInterval` id。
   * “计时/循环”刻意放在组件层；纯逻辑模块只负责状态推进。
   */
  private intervalId: number | null = null;

  /**
   * 渲染用的派生索引结构：
   * 模板会对每个格子问：“是不是蛇/是不是头/是不是食物？”
   * 用 `Set` 可以 O(1) 判断，避免每格都遍历 snake 数组。
   */
  private snakeKeySet = new Set<string>();

  /**
   * 缓存蛇头与食物的 key，减少模板里重复拼字符串的成本。
   */
  headKey = '';
  foodKey = '';

  ngOnInit(): void {
    // 首次渲染前先把派生渲染数据算好。
    this.rebuildDerivedKeys();
    // 启动 tick 循环。
    this.startLoop();
    // 键盘控制（方向键 + WASD + Space + R）。
    // 因为要对方向键/空格调用 `preventDefault()`（防止页面滚动），所以必须 `passive: false`。
    window.addEventListener('keydown', this.onKeyDown, { passive: false });
  }

  ngOnDestroy(): void {
    // 页面离开时停止定时器和事件监听，避免后台继续跑。
    this.stopLoop();
    window.removeEventListener('keydown', this.onKeyDown);
  }

  /**
   * 重开一局。
   * 允许传入 seed 以复现同样的食物刷新序列；UI 默认用当前时间作为 seed。
   */
  restart(seed = (Date.now() >>> 0)): void {
    this.state = newGameState({ width: this.width, height: this.height, seed });
    this.rebuildDerivedKeys();
  }

  /** 暂停/继续。 */
  pauseResume(): void {
    this.state = togglePause(this.state);
  }

  /**
   * 推进一步，并刷新派生渲染数据。
   * 由定时器循环调用。
   */
  step(): void {
    const next = tick(this.state);
    if (next === this.state) return;
    this.state = next;
    this.rebuildDerivedKeys();
  }

  /**
   * 缓存一次方向变化。
   * “禁止反向 + 一次 tick 只吃一个输入”之类规则由纯逻辑模块处理。
   */
  move(direction: Direction): void {
    const next = queueDirection(this.state, direction);
    if (next === this.state) return;
    this.state = next;
  }

  /**
   * 格子 key（稳定字符串），用于 Set 查询。
   * 这个规模用字符串足够快，也能保持实现简单。
   */
  cellKey(x: number, y: number): string {
    return `${x},${y}`;
  }

  /** 当前格是否被蛇身占用（包含蛇头）。 */
  isSnakeCell(x: number, y: number): boolean {
    return this.snakeKeySet.has(this.cellKey(x, y));
  }

  /** 当前格是否为蛇头。 */
  isHeadCell(x: number, y: number): boolean {
    return this.headKey === this.cellKey(x, y);
  }

  /** 当前格是否为食物。 */
  isFoodCell(x: number, y: number): boolean {
    return this.foodKey === this.cellKey(x, y);
  }

  private startLoop(): void {
    this.stopLoop();
    // 经典玩法：固定时间间隔 tick。不做插值/动画。
    this.intervalId = window.setInterval(() => this.step(), this.tickMs);
  }

  private stopLoop(): void {
    if (this.intervalId === null) return;
    window.clearInterval(this.intervalId);
    this.intervalId = null;
  }

  /**
   * 在任何会影响渲染的状态变化后，重建派生 key。
   * 这样模板绑定会非常轻量（主要是 O(1) 查询）。
   */
  private rebuildDerivedKeys(): void {
    this.snakeKeySet = new Set(this.state.snake.map(p => this.cellKey(p.x, p.y)));
    const head = this.state.snake[0];
    this.headKey = this.cellKey(head.x, head.y);
    this.foodKey = this.cellKey(this.state.food.x, this.state.food.y);
  }

  /**
   * 键盘输入处理。
   *
   * 键位映射：
   * - 方向键 / WASD：改变方向
   * - Space：暂停/继续
   * - R：重开
   *
   * 对方向键/空格调用 `preventDefault()`，避免游玩时触发页面滚动。
   */
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
