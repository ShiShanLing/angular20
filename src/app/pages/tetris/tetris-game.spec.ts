import {
  hardDrop,
  moveLeft,
  newTetrisState,
  softDrop,
  type ActivePiece,
  type TetrisState
} from './tetris-game';

function makeState(partial: Partial<TetrisState>): TetrisState {
  const base = newTetrisState({ width: 10, height: 20, seed: 1 });
  return { ...base, ...partial };
}

describe('tetris-game', () => {
  it('creates a new state with an active piece and a next preview', () => {
    const s = newTetrisState({ width: 10, height: 20, seed: 1 });
    expect(s.width).toBe(10);
    expect(s.height).toBe(20);
    expect(s.board.length).toBe(200);
    expect(s.active.kind).toBeTruthy();
    expect(s.active.color).toBeTruthy();
    expect(s.next.kind).toBeTruthy();
    expect(s.next.color).toBeTruthy();
  });

  it('does not move left when it would collide with the wall', () => {
    const active: ActivePiece = { kind: 'I', rotation: 0, x: 0, y: 0, color: '#111' };
    const s = makeState({ active });
    const next = moveLeft(s);
    expect(next).toBe(s);
  });

  it('hard drop locks the piece and clears a full line', () => {
    const width = 10;
    const height = 20;
    const board = Array.from({ length: width * height }, () => null as string | null);
    const bottomY = height - 1;

    // 先把底行的后 6 格填满，留下前 4 格给 I 横条补齐。
    for (let x = 4; x < width; x++) {
      board[bottomY * width + x] = '#aaa';
    }

    const active: ActivePiece = { kind: 'I', rotation: 0, x: 0, y: 0, color: '#f00' };
    const s = makeState({
      width,
      height,
      board,
      active,
      next: { kind: 'O', color: '#0f0' },
      rngSeed: 1,
      lastColor: null
    });

    const after = hardDrop(s);
    expect(after.lines).toBe(1);
    expect(after.score).toBe(100);
    // 消行后底行应该全空
    for (let x = 0; x < width; x++) {
      expect(after.board[bottomY * width + x]).toBeNull();
    }
  });

  it('soft drop can end the game if the piece locks above the visible area', () => {
    const width = 10;
    const height = 20;
    const board = Array.from({ length: width * height }, () => null as string | null);

    // 用一个已占用格子阻止 I 竖条继续下落，从而触发“锁定时 y < 0 => Game Over”。
    board[1 * width + 2] = '#999';

    const active: ActivePiece = { kind: 'I', rotation: 1, x: 0, y: -3, color: '#09f' };
    const s = makeState({
      width,
      height,
      board,
      active,
      next: { kind: 'O', color: '#0f0' },
      rngSeed: 1,
      lastColor: null
    });

    const after = softDrop(s);
    expect(after.isGameOver).toBeTrue();
  });
});

