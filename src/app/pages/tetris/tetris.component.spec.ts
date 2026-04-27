import { TetrisComponent } from './tetris.component';

describe('TetrisComponent', () => {
  let component: TetrisComponent;

  beforeEach(() => {
    spyOn(window, 'setInterval').and.returnValue(0 as any);
    spyOn(window, 'clearInterval');
    component = new TetrisComponent();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('has 10x20 board dimensions', () => {
    expect(component.width).toBe(10);
    expect(component.height).toBe(20);
    expect(component.rows.length).toBe(20);
    expect(component.cols.length).toBe(10);
  });

  it('ngOnInit starts loop and builds cell colors', () => {
    component.ngOnInit();
    expect(window.setInterval).toHaveBeenCalled();
    expect(component.cellColors.length).toBe(component.width * component.height);
  });

  it('cellColors has correct length after init', () => {
    component.ngOnInit();
    expect(component.cellColors.length).toBe(200);
  });

  it('nextPreviewColors has 4x4=16 entries', () => {
    component.ngOnInit();
    expect(component.nextPreviewColors.length).toBe(16);
  });

  it('restart resets score to 0 and game is not over', () => {
    component.ngOnInit();
    component.restart();
    expect(component.state.score).toBe(0);
    expect(component.state.isGameOver).toBeFalse();
    expect(component.state.isPaused).toBeFalse();
  });

  it('pauseResume toggles paused state', () => {
    component.ngOnInit();
    expect(component.state.isPaused).toBeFalse();
    component.pauseResume();
    expect(component.state.isPaused).toBeTrue();
    component.pauseResume();
    expect(component.state.isPaused).toBeFalse();
  });

  it('left/right/rotate/down/drop do not throw and maintain valid state', () => {
    component.ngOnInit();
    expect(() => {
      component.left();
      component.right();
      component.rotate();
      component.down();
      component.drop();
    }).not.toThrow();
    expect(component.cellColors.length).toBe(200);
  });

  it('state.board has correct size', () => {
    component.ngOnInit();
    expect(component.state.board.length).toBe(component.width * component.height);
  });

  it('ngOnDestroy stops the loop', () => {
    component.ngOnInit();
    component.ngOnDestroy();
    expect(window.clearInterval).toHaveBeenCalled();
  });
});
