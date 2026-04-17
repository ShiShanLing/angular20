import { newGameState, queueDirection, respawnFood, tick, type SnakeGameState } from './snake-game';

function makeState(partial: Partial<SnakeGameState>): SnakeGameState {
  const base = newGameState({ width: 10, height: 10, seed: 1 });
  return { ...base, ...partial };
}

describe('snake-game', () => {
  it('moves one cell per tick in current direction', () => {
    const state = makeState({
      width: 5,
      height: 5,
      snake: [{ x: 2, y: 2 }],
      direction: 'right',
      nextDirection: null,
      food: { x: 0, y: 0 },
      isPaused: false,
      isGameOver: false
    });

    const next = tick(state);
    expect(next.snake[0]).toEqual({ x: 3, y: 2 });
  });

  it('prevents reversing direction in a single move', () => {
    const state = makeState({
      width: 6,
      height: 6,
      snake: [{ x: 3, y: 3 }, { x: 2, y: 3 }],
      direction: 'right',
      nextDirection: null,
      food: { x: 0, y: 0 }
    });

    const queued = queueDirection(state, 'left');
    const next = tick(queued);
    expect(next.snake[0]).toEqual({ x: 4, y: 3 });
  });

  it('grows and increases score when eating food', () => {
    const state = makeState({
      width: 10,
      height: 10,
      snake: [{ x: 2, y: 0 }, { x: 1, y: 0 }],
      direction: 'right',
      nextDirection: null,
      food: { x: 3, y: 0 },
      score: 7,
      rngSeed: 123
    });

    const next = tick(state);
    expect(next.score).toBe(8);
    expect(next.snake.length).toBe(3);
    expect(next.snake[0]).toEqual({ x: 3, y: 0 });
    expect(next.food).not.toEqual({ x: 3, y: 0 });
    expect(next.snake.some(p => p.x === next.food.x && p.y === next.food.y)).toBeFalse();
  });

  it('wraps around horizontally when crossing a wall', () => {
    const state = makeState({
      width: 4,
      height: 4,
      snake: [{ x: 3, y: 1 }],
      direction: 'right',
      nextDirection: null,
      food: { x: 0, y: 0 }
    });

    const next = tick(state);
    expect(next.isGameOver).toBeFalse();
    expect(next.snake[0]).toEqual({ x: 0, y: 1 });
  });

  it('wraps around vertically when crossing a wall', () => {
    const state = makeState({
      width: 4,
      height: 4,
      snake: [{ x: 2, y: 0 }],
      direction: 'up',
      nextDirection: null,
      food: { x: 3, y: 3 }
    });

    const next = tick(state);
    expect(next.isGameOver).toBeFalse();
    expect(next.snake[0]).toEqual({ x: 2, y: 3 });
  });

  it('allows moving into the previous tail cell when not growing', () => {
    const state = makeState({
      width: 5,
      height: 5,
      snake: [
        { x: 2, y: 1 }, // head
        { x: 2, y: 2 },
        { x: 1, y: 2 },
        { x: 1, y: 1 } // tail
      ],
      direction: 'left',
      nextDirection: null,
      food: { x: 4, y: 4 }
    });

    const next = tick(state);
    expect(next.isGameOver).toBeFalse();
    expect(next.snake[0]).toEqual({ x: 1, y: 1 });
    expect(next.snake.length).toBe(4);
  });

  it('ends the game when colliding with the body', () => {
    const state = makeState({
      width: 5,
      height: 5,
      snake: [
        { x: 2, y: 1 }, // head
        { x: 2, y: 2 },
        { x: 1, y: 2 },
        { x: 1, y: 1 }
      ],
      direction: 'down',
      nextDirection: null,
      food: { x: 4, y: 4 }
    });

    const next = tick(state);
    expect(next.isGameOver).toBeTrue();
  });

  it('respawns food into an empty cell (deterministic)', () => {
    const state = makeState({
      width: 3,
      height: 3,
      snake: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 2, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 },
        { x: 2, y: 1 },
        { x: 0, y: 2 },
        { x: 1, y: 2 }
      ],
      rngSeed: 1,
      food: { x: 0, y: 0 }
    });

    const next = respawnFood(state);
    expect(next.food).toEqual({ x: 2, y: 2 });
  });

  it('marks game over when there is no empty cell for food', () => {
    const state = makeState({
      width: 2,
      height: 2,
      snake: [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
        { x: 1, y: 1 }
      ],
      rngSeed: 1,
      food: { x: 0, y: 0 }
    });

    const next = respawnFood(state);
    expect(next.isGameOver).toBeTrue();
  });
});
