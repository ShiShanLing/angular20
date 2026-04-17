export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Point {
  /**
   * 0 基坐标：列索引。
   * `x` 向右递增。
   */
  x: number;
  /**
   * 0 基坐标：行索引。
   * `y` 向下递增。
   */
  y: number;
}

export interface SnakeGameState {
  /** 棋盘宽度（单位：格）。 */
  width: number;
  /** 棋盘高度（单位：格）。 */
  height: number;
  /**
   * 蛇身坐标列表。
   * 不变式：`snake[0]` 永远是蛇头。
   */
  snake: Point[];
  /** 最近一次 tick 实际采用的移动方向。 */
  direction: Direction;
  /**
   * 缓存的“下一次 tick 要应用的方向”。
   * 这样做可以：
   * - 保证“一次 tick 最多改变一次方向”（输入节流、确定性更强）
   * - 禁止 180° 反向（经典贪吃蛇规则）
   */
  nextDirection: Direction | null;
  /** 食物坐标（在游戏有效时，保证出现在空格）。 */
  food: Point;
  /** 分数 = 吃到的食物数量。 */
  score: number;
  /** 暂停时，tick 不推进状态。 */
  isPaused: boolean;
  /** Game Over 后，tick 与输入不再生效（UI 的重开除外）。 */
  isGameOver: boolean;
  /**
   * 用于“确定性刷食物”的随机种子。
   * 把 seed 放进 state 里有几个好处：
   * - 单测可以断言完全一致的行为（可复现）
   * - 给定同一个 seed，整局游戏可重放（对调试很友好）
   */
  rngSeed: number;
}

export interface NewGameOptions {
  width: number;
  height: number;
  /** 可选 seed：用于确定性食物落点。 */
  seed?: number;
}

/**
 * 创建一局新游戏：
 * - 蛇初始长度为 1，位于棋盘中心
 * - 初始方向为向右
 * - 食物刷新在空格（如果提供 seed，则落点是确定性的）
 */
export function newGameState(options: NewGameOptions): SnakeGameState {
  // 设定最小棋盘尺寸，避免过小棋盘导致“无空位”等边界问题。
  const width = Math.max(4, Math.floor(options.width));
  const height = Math.max(4, Math.floor(options.height));
  // 使用无符号 32 位 seed；未提供则默认 1，确保行为稳定可复现。
  const rngSeed = (options.seed ?? 1) >>> 0;

  // 初始蛇头放在棋盘中心。
  const start: Point = {
    x: Math.floor(width / 2),
    y: Math.floor(height / 2)
  };

  const initial: SnakeGameState = {
    width,
    height,
    snake: [start],
    direction: 'right',
    nextDirection: null,
    food: { x: 0, y: 0 },
    score: 0,
    isPaused: false,
    isGameOver: false,
    rngSeed
  };

  return respawnFood(initial);
}

/**
 * 缓存一次方向变化，留到下一次 tick 再应用。
 *
 * 这里刻意“不立刻改变方向”，是为了避免：
 * - 同一个 tick 内多次改变方向（不稳定、难测）
 * - “瞬间反向”（例如正在向右立刻按向左）
 */
export function queueDirection(state: SnakeGameState, direction: Direction): SnakeGameState {
  // 游戏已结束则忽略输入。
  if (state.isGameOver) return state;

  // 如果已经缓存了下一方向，就以缓存方向作为“当前意图方向”。
  const current = state.nextDirection ?? state.direction;
  // 经典规则：禁止 180° 反向，避免直接撞进自己身体。
  if (isOpposite(current, direction)) return state;

  return { ...state, nextDirection: direction };
}

/** 暂停/继续。Game Over 后不再生效。 */
export function togglePause(state: SnakeGameState): SnakeGameState {
  if (state.isGameOver) return state;
  return { ...state, isPaused: !state.isPaused };
}

/**
 * 推进游戏一步（每次 tick 移动 1 格）。
 *
 * tick 的职责：
 * 1) 选择方向（优先应用缓存方向）
 * 2) 计算下一步蛇头坐标
 * 3) 边界处理（穿墙环绕）
 * 4) 判断撞自己
 *    - 关键点：如果“这一口不吃食物”，允许蛇头进入“上一帧尾巴所在格”
 *      因为尾巴会在同一 tick 同步前移（经典贪吃蛇行为）
 * 5) 应用移动（如果吃到食物则增长）
 * 6) 如果吃到食物，刷新下一颗食物
 */
export function tick(state: SnakeGameState): SnakeGameState {
  // 暂停或结束时不推进（纯函数：直接返回原引用，便于上层做引用判断）。
  if (state.isPaused || state.isGameOver) return state;

  // 有缓存方向就用缓存方向，否则沿当前方向直行。
  const direction = state.nextDirection ?? state.direction;
  const head = state.snake[0];
  const delta = directionDelta(direction);
  const movedHead = { x: head.x + delta.x, y: head.y + delta.y };
  // 边界规则：穿墙（环绕）。
  // - 从左边出去会从右边进来，反之亦然
  // - 从上边出去会从下边进来，反之亦然
  const nextHead = wrapPoint(state, movedHead);

  // 当蛇头走到食物格时，视为“吃到食物”。
  const willEat = pointsEqual(nextHead, state.food);
  // 撞自己判定：
  // - 如果“会吃到食物”，本 tick 尾巴不会前移（蛇增长），因此要对整条蛇做碰撞判定
  // - 如果“不会吃到食物”，本 tick 尾巴会被裁掉，因此允许蛇头进入“旧尾巴格”
  const collisionBody = willEat ? state.snake : state.snake.slice(0, Math.max(0, state.snake.length - 1));
  if (collisionBody.some(p => pointsEqual(p, nextHead))) {
    return { ...state, isGameOver: true, nextDirection: null };
  }

  // 应用移动：
  // - 总是先把新蛇头插到最前
  // - 如果没吃到食物则裁掉尾巴；吃到则不裁（即增长）
  const grownSnake = [nextHead, ...state.snake];
  const nextSnake = willEat ? grownSnake : grownSnake.slice(0, grownSnake.length - 1);

  // 本 tick 已应用缓存方向，清空它，让下一 tick 可以再次缓存输入。
  const baseNext: SnakeGameState = {
    ...state,
    snake: nextSnake,
    direction,
    nextDirection: null,
    score: willEat ? state.score + 1 : state.score
  };

  // 没吃到食物就结束本 tick。
  if (!willEat) return baseNext;

  // 吃到食物 => 依据确定性 RNG 在空格刷新下一颗食物。
  const afterFood = respawnFood(baseNext);
  // 蛇身占满棋盘就等于“通关”，直接 Game Over（不再刷新食物）。
  if (afterFood.food && isGridFull(afterFood)) {
    return { ...afterFood, isGameOver: true };
  }
  return afterFood;
}

/**
 * 在随机空格放置食物（由 `rngSeed` 决定，保证确定性）。
 *
 * 方法：
 * - 计算空格数量 emptyCount
 * - 用 RNG 生成一个空格索引 targetIndex
 * - 按行优先（row-major）扫描整张棋盘，数到第 targetIndex 个空格即为食物落点
 *
 * 这是最直观且确定性的做法；由于扫描中用 `some()` 判断蛇身占用，
 * 复杂度大约是 O(width*height*snakeLength)。本项目棋盘很小，因此足够快。
 */
export function respawnFood(state: SnakeGameState): SnakeGameState {
  const emptyCount = state.width * state.height - state.snake.length;
  if (emptyCount <= 0) {
    return { ...state, isGameOver: true };
  }

  // 每次刷新食物只推进 RNG 一次，保证可预测。
  const { seed, value } = nextRand(state.rngSeed);
  const targetIndex = value % emptyCount;

  // 行优先扫描，只对“空格”计数，直到数到 targetIndex。
  let seen = 0;
  for (let y = 0; y < state.height; y++) {
    for (let x = 0; x < state.width; x++) {
      const p = { x, y };
      if (state.snake.some(s => pointsEqual(s, p))) continue;
      if (seen === targetIndex) {
        return { ...state, rngSeed: seed, food: p };
      }
      seen++;
    }
  }

  // 理论上不会走到这里；兜底保证函数“总是返回一个 state”。
  return { ...state, rngSeed: seed, food: { x: 0, y: 0 } };
}

function isGridFull(state: SnakeGameState): boolean {
  return state.snake.length >= state.width * state.height;
}

function isInside(state: SnakeGameState, p: Point): boolean {
  return p.x >= 0 && p.x < state.width && p.y >= 0 && p.y < state.height;
}

function wrapPoint(state: SnakeGameState, p: Point): Point {
  const x = mod(p.x, state.width);
  const y = mod(p.y, state.height);
  return { x, y };
}

function mod(n: number, m: number): number {
  // JS 的 % 可能返回负数；这里做数学意义上的模运算。
  return ((n % m) + m) % m;
}

function pointsEqual(a: Point, b: Point): boolean {
  return a.x === b.x && a.y === b.y;
}

function directionDelta(direction: Direction): Point {
  switch (direction) {
    case 'up': return { x: 0, y: -1 };
    case 'down': return { x: 0, y: 1 };
    case 'left': return { x: -1, y: 0 };
    case 'right': return { x: 1, y: 0 };
  }
}

function isOpposite(a: Direction, b: Direction): boolean {
  return (a === 'up' && b === 'down')
    || (a === 'down' && b === 'up')
    || (a === 'left' && b === 'right')
    || (a === 'right' && b === 'left');
}

/**
 * 极小的确定性伪随机（LCG），使用无符号 32 位运算。
 * 对于“刷食物”足够用，而且不需要额外依赖。
 */
function nextRand(seed0: number): { seed: number; value: number } {
  const seed = (Math.imul(seed0, 1664525) + 1013904223) >>> 0;
  return { seed, value: seed };
}
