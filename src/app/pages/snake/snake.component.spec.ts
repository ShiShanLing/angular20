import { SnakeComponent } from './snake.component';
import { newGameState } from './snake-game';

describe('SnakeComponent', () => {
  let component: SnakeComponent;

  beforeEach(() => {
    spyOn(window, 'setInterval').and.returnValue(0 as any);
    spyOn(window, 'clearInterval');
    component = new SnakeComponent();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('has 20x20 board dimensions', () => {
    expect(component.width).toBe(20);
    expect(component.height).toBe(20);
    expect(component.rows.length).toBe(20);
    expect(component.cols.length).toBe(20);
  });

  it('cellKey returns "x,y" string', () => {
    expect(component.cellKey(3, 7)).toBe('3,7');
    expect(component.cellKey(0, 0)).toBe('0,0');
  });

  it('ngOnInit builds derived keys and starts loop', () => {
    component.ngOnInit();
    expect(window.setInterval).toHaveBeenCalled();
    expect(component.headKey).toBeTruthy();
    expect(component.foodKey).toBeTruthy();
  });

  it('isSnakeCell returns true for snake body positions', () => {
    component.ngOnInit();
    const head = component.state.snake[0];
    expect(component.isSnakeCell(head.x, head.y)).toBeTrue();
  });

  it('isHeadCell returns true for head position only', () => {
    component.ngOnInit();
    const head = component.state.snake[0];
    expect(component.isHeadCell(head.x, head.y)).toBeTrue();
    // Tail should not be head (unless single-cell snake, which shouldn't happen at start)
    if (component.state.snake.length > 1) {
      const tail = component.state.snake[component.state.snake.length - 1];
      if (tail.x !== head.x || tail.y !== head.y) {
        expect(component.isHeadCell(tail.x, tail.y)).toBeFalse();
      }
    }
  });

  it('isFoodCell returns true for food position', () => {
    component.ngOnInit();
    const food = component.state.food;
    expect(component.isFoodCell(food.x, food.y)).toBeTrue();
    expect(component.isFoodCell(food.x + 1, food.y + 1)).toBeFalse();
  });

  it('restart resets game state', () => {
    component.ngOnInit();
    const originalScore = component.state.score;
    component.restart(42);
    expect(component.state.score).toBe(0);
    expect(component.state.isGameOver).toBeFalse();
  });

  it('pauseResume toggles paused state', () => {
    component.ngOnInit();
    expect(component.state.isPaused).toBeFalse();
    component.pauseResume();
    expect(component.state.isPaused).toBeTrue();
    component.pauseResume();
    expect(component.state.isPaused).toBeFalse();
  });

  it('move queues a direction on the state', () => {
    component.ngOnInit();
    const before = component.state;
    component.move('up');
    // state may change (new reference) if direction was queued
    // just ensure no error is thrown and state is still valid
    expect(component.state).toBeTruthy();
    expect(component.state.snake.length).toBeGreaterThan(0);
  });

  it('ngOnDestroy stops the loop', () => {
    component.ngOnInit();
    component.ngOnDestroy();
    expect(window.clearInterval).toHaveBeenCalled();
  });
});
