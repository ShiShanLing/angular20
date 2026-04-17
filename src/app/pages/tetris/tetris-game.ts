export type TetrominoKind = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export interface Point {
  x: number;
  y: number;
}

export interface ActivePiece {
  /** 方块类型（7 种）。 */
  kind: TetrominoKind;
  /** 旋转状态索引（0-3）。 */
  rotation: number;
  /**
   * 当前方块在棋盘上的“原点”位置（0 基坐标）。
   * 真正占用的格子 = origin + shapePoints(rotation)
   */
  x: number;
  y: number;
  /** 当前方块颜色（同一块的 4 个小格子同色）。 */
  color: string;
}

export interface TetrisState {
  width: number;
  height: number;
  /**
   * 已锁定到棋盘上的格子颜色（行优先一维数组）。
   * - `null`：空格
   * - `string`：颜色（例如 '#52c41a'）
   */
  board: Array<string | null>;
  /** 当前下落方块。 */
  active: ActivePiece;
  /** 下一个方块（预览）。 */
  next: { kind: TetrominoKind; color: string };
  /** 分数（依据消行数量累加）。 */
  score: number;
  /** 已消除行数。 */
  lines: number;
  /** 是否暂停。 */
  isPaused: boolean;
  /** 是否结束（无法生成新方块或锁定越界）。 */
  isGameOver: boolean;
  /**
   * RNG 种子（确定性）：
   * - 用于随机方块类型
   * - 用于随机颜色（并尽量避免连续两块颜色相同）
   */
  rngSeed: number;
  /** 用于避免颜色连续重复的“上一块颜色”。 */
  lastColor: string | null;
}

export interface NewTetrisOptions {
  width?: number;
  height?: number;
  seed?: number;
}

/**
 * 创建一局新俄罗斯方块。
 *
 * 设计目标：
 * - 规则逻辑全部放在纯函数里，便于单测
 * - “随机”全部由 state.rngSeed 决定，做到可复现
 * - UI 只负责渲染与把输入转换成调用这些纯函数
 */
export function newTetrisState(options: NewTetrisOptions = {}): TetrisState {
  const width = Math.max(6, Math.floor(options.width ?? 10));
  const height = Math.max(10, Math.floor(options.height ?? 20));
  const rngSeed = (options.seed ?? 1) >>> 0;

  // 先生成 next，然后把 next 作为第一块 active（这样预览逻辑天然成立）。
  const emptyBoard = Array.from({ length: width * height }, () => null as string | null);
  const base: Omit<TetrisState, 'active' | 'next'> = {
    width,
    height,
    board: emptyBoard,
    score: 0,
    lines: 0,
    isPaused: false,
    isGameOver: false,
    rngSeed,
    lastColor: null
  };

  const { seed: seedAfterNext, next } = rollNextFrom(base.rngSeed, base.lastColor);
  const withNext: TetrisState = {
    ...(base as unknown as TetrisState),
    // 先塞一个占位 active（马上会被 spawnFromNext 覆盖）
    active: { kind: 'O', rotation: 0, x: 0, y: 0, color: 'transparent' },
    next,
    rngSeed: seedAfterNext
  };

  const spawned = spawnFromNext(withNext);
  return spawned;
}

/** 暂停/继续。Game Over 后不再生效。 */
export function togglePause(state: TetrisState): TetrisState {
  if (state.isGameOver) return state;
  return { ...state, isPaused: !state.isPaused };
}

/**
 * 游戏主循环：推进一帧“重力下落”。
 * - 能下落：active.y + 1
 * - 不能下落：锁定到 board，消行，然后生成新方块
 */
export function tick(state: TetrisState): TetrisState {
  if (state.isPaused || state.isGameOver) return state;

  const moved = tryMove(state, 0, 1);
  if (moved !== state) return moved;

  // 不能再下落 => 锁定并结算
  return lockAndContinue(state);
}

/** 左移一格（如果可行）。 */
export function moveLeft(state: TetrisState): TetrisState {
  return state.isPaused || state.isGameOver ? state : tryMove(state, -1, 0);
}

/** 右移一格（如果可行）。 */
export function moveRight(state: TetrisState): TetrisState {
  return state.isPaused || state.isGameOver ? state : tryMove(state, 1, 0);
}

/**
 * 软降一格（等价于“尝试下落 1 格”）。
 * - 如果已经触底/被挡住：会直接锁定（更接近常见手感）
 */
export function softDrop(state: TetrisState): TetrisState {
  if (state.isPaused || state.isGameOver) return state;
  const moved = tryMove(state, 0, 1);
  return moved !== state ? moved : lockAndContinue(state);
}

/**
 * 硬降：一直下落到不能再下落，然后锁定。
 * 这属于经典玩法常见能力（不加额外动画，保持 UI 简单）。
 */
export function hardDrop(state: TetrisState): TetrisState {
  if (state.isPaused || state.isGameOver) return state;

  let s = state;
  while (true) {
    const moved = tryMove(s, 0, 1);
    if (moved === s) break;
    s = moved;
  }
  return lockAndContinue(s);
}

/**
 * 顺时针旋转 90°。
 *
 * 这里实现一个“最小可用”的简化 wall-kick：
 * - 如果原地旋转冲突，则尝试左右平移 1/2 格，最后尝试上移 1 格
 * - 不是严格的 SRS，但足够可玩且实现简单、可测试
 */
export function rotateCW(state: TetrisState): TetrisState {
  if (state.isPaused || state.isGameOver) return state;

  const nextRotation = (state.active.rotation + 1) % 4;
  const kicks: Array<{ dx: number; dy: number }> = [
    { dx: 0, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
    { dx: -2, dy: 0 },
    { dx: 2, dy: 0 },
    { dx: 0, dy: -1 }
  ];

  for (const k of kicks) {
    const candidate: ActivePiece = {
      ...state.active,
      rotation: nextRotation,
      x: state.active.x + k.dx,
      y: state.active.y + k.dy
    };
    if (!collides(state, candidate)) {
      return { ...state, active: candidate };
    }
  }

  // 无法旋转则保持不变
  return state;
}

/** 重开一局（seed 可用于复现）。 */
export function restart(state: TetrisState, seed = (Date.now() >>> 0)): TetrisState {
  return newTetrisState({ width: state.width, height: state.height, seed });
}

/**
 * 获取某个方块当前旋转状态下的 4 个绝对坐标（用于渲染/调试/测试）。
 * 注意：这里不会做任何碰撞判定。
 */
export function getPieceCells(piece: ActivePiece): Point[] {
  return pieceCells(piece);
}

/**
 * 获取某种方块在指定旋转状态下的“相对坐标”（不包含 x/y 平移）。
 * 用途：预览下一块、UI 展示、调试等。
 */
export function getKindRelativeCells(kind: TetrominoKind, rotation: number = 0): Point[] {
  const r = ((rotation % 4) + 4) % 4;
  return shapes[kind][r].map(p => ({ x: p.x, y: p.y }));
}

function tryMove(state: TetrisState, dx: number, dy: number): TetrisState {
  const candidate: ActivePiece = { ...state.active, x: state.active.x + dx, y: state.active.y + dy };
  if (collides(state, candidate)) return state;
  return { ...state, active: candidate };
}

function lockAndContinue(state: TetrisState): TetrisState {
  const locked = lockPiece(state);
  if (locked.isGameOver) return locked;

  const cleared = clearLines(locked);
  const spawned = spawnFromNext(cleared);
  return spawned;
}

function lockPiece(state: TetrisState): TetrisState {
  const cells = pieceCells(state.active);
  const nextBoard = state.board.slice();

  // 只要锁定时有格子在 y < 0（可视区域上方），就视为失败（堆到顶了）。
  let lockedAboveTop = false;

  for (const p of cells) {
    if (p.y < 0) {
      lockedAboveTop = true;
      continue;
    }
    if (p.y >= state.height) continue;
    const idx = boardIndex(state, p.x, p.y);
    nextBoard[idx] = state.active.color;
  }

  return { ...state, board: nextBoard, isGameOver: lockedAboveTop };
}

function clearLines(state: TetrisState): TetrisState {
  const { width, height } = state;

  const rows: Array<Array<string | null>> = [];
  for (let y = 0; y < height; y++) {
    const row: Array<string | null> = [];
    for (let x = 0; x < width; x++) {
      row.push(state.board[boardIndex(state, x, y)]);
    }
    rows.push(row);
  }

  const remaining: Array<Array<string | null>> = [];
  let cleared = 0;
  for (const row of rows) {
    if (row.every(c => c !== null)) cleared++;
    else remaining.push(row);
  }

  if (cleared === 0) return state;

  while (remaining.length < height) {
    remaining.unshift(Array.from({ length: width }, () => null));
  }

  const nextBoard: Array<string | null> = [];
  for (const row of remaining) nextBoard.push(...row);

  const gained = scoreForClears(cleared);
  return {
    ...state,
    board: nextBoard,
    lines: state.lines + cleared,
    score: state.score + gained
  };
}

function scoreForClears(cleared: number): number {
  // 常见计分：1/2/3/4 行分别给 100/300/500/800。
  switch (cleared) {
    case 1: return 100;
    case 2: return 300;
    case 3: return 500;
    case 4: return 800;
    default: return cleared * 100;
  }
}

function spawnFromNext(state: TetrisState): TetrisState {
  const spawnX = Math.floor(state.width / 2) - 2;
  const spawnY = -2; // 允许部分在可视区上方生成

  const active: ActivePiece = {
    kind: state.next.kind,
    color: state.next.color,
    rotation: 0,
    x: spawnX,
    y: spawnY
  };

  // 当前 active 的颜色成为 lastColor，用于避免下一块随机出同色。
  const withActive = { ...state, active, lastColor: active.color };
  const afterRoll = rollNextInState(withActive);
  // 刚生成就碰撞 => 直接 Game Over（棋盘堆满了）
  if (collides(afterRoll, afterRoll.active)) {
    return { ...afterRoll, isGameOver: true };
  }
  return afterRoll;
}

function rollNextInState(state: TetrisState): TetrisState {
  const { seed, next } = rollNextFrom(state.rngSeed, state.lastColor);
  return { ...state, rngSeed: seed, next };
}

function rollNextFrom(seed0: number, lastColor: string | null): { seed: number; next: { kind: TetrominoKind; color: string } } {
  // 用 seed 推进两次：一次决定方块类型，一次决定颜色。
  const { seed: seed1, value: v1 } = nextRand(seed0);
  const kind = kinds[v1 % kinds.length];

  const { seed: seed2, value: v2 } = nextRand(seed1);
  const color = randomColor(v2, lastColor);

  return { seed: seed2, next: { kind, color } };
}

function randomColor(rand: number, lastColor: string | null): string {
  // 颜色生成策略：
  // - 用一个 0-359 的色相（hue）做 HSL，饱和度/亮度固定，观感一致
  // - 尽量避免与上一块颜色相同（相同则对 hue 做一次偏移）
  const hue = rand % 360;
  const base = `hsl(${hue} 70% 50%)`;
  if (lastColor !== null && base === lastColor) {
    return `hsl(${(hue + 37) % 360} 70% 50%)`;
  }
  return base;
}

function collides(state: TetrisState, piece: ActivePiece): boolean {
  for (const p of pieceCells(piece)) {
    // 左右越界/下越界都算碰撞；上越界（y < 0）允许（生成/旋转时常见）。
    if (p.x < 0 || p.x >= state.width) return true;
    if (p.y >= state.height) return true;
    if (p.y < 0) continue;

    const idx = boardIndex(state, p.x, p.y);
    if (state.board[idx] !== null) return true;
  }
  return false;
}

function pieceCells(piece: ActivePiece): Point[] {
  const shape = shapes[piece.kind][piece.rotation];
  return shape.map(p => ({ x: piece.x + p.x, y: piece.y + p.y }));
}

function boardIndex(state: Pick<TetrisState, 'width'>, x: number, y: number): number {
  return y * state.width + x;
}

const kinds: TetrominoKind[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

/**
 * 7 种方块的 4 个旋转状态（0/90/180/270）。
 * 每个旋转状态用 4 个格子的相对坐标表示。
 *
 * 说明：
 * - 这里采用最简单的坐标描述，不做复杂的旋转中心计算
 * - 旋转体验靠 rotateCW 的简化 wall-kick 来改善
 */
const shapes: Record<TetrominoKind, Point[][]> = {
  I: [
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 3, y: 1 }],
    [{ x: 2, y: 0 }, { x: 2, y: 1 }, { x: 2, y: 2 }, { x: 2, y: 3 }],
    [{ x: 0, y: 2 }, { x: 1, y: 2 }, { x: 2, y: 2 }, { x: 3, y: 2 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 1, y: 3 }],
  ],
  O: [
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
  ],
  T: [
    [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
    [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  ],
  S: [
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
    [{ x: 1, y: 1 }, { x: 2, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
    [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  ],
  Z: [
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 2, y: 0 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 1, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
    [{ x: 1, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 0, y: 2 }],
  ],
  J: [
    [{ x: 0, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 2, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 2, y: 2 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 0, y: 2 }, { x: 1, y: 2 }],
  ],
  L: [
    [{ x: 2, y: 0 }, { x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }],
    [{ x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }, { x: 2, y: 2 }],
    [{ x: 0, y: 1 }, { x: 1, y: 1 }, { x: 2, y: 1 }, { x: 0, y: 2 }],
    [{ x: 0, y: 0 }, { x: 1, y: 0 }, { x: 1, y: 1 }, { x: 1, y: 2 }],
  ]
};

/**
 * 极小的确定性伪随机（LCG），使用无符号 32 位运算。
 * 对于“随机方块 + 随机颜色”足够用，而且不需要额外依赖。
 */
function nextRand(seed0: number): { seed: number; value: number } {
  const seed = (Math.imul(seed0, 1664525) + 1013904223) >>> 0;
  return { seed, value: seed };
}
