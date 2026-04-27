import { AnimationsComponent } from './animations.component';

describe('AnimationsComponent', () => {
  let component: AnimationsComponent;

  beforeEach(() => {
    component = new AnimationsComponent();
    jasmine.clock().install();
  });

  afterEach(() => {
    jasmine.clock().uninstall();
    if (component.spinnerRunning) component.toggleSpinner();
  });
  
  it('创建组件，初始状态正确', () => {
    expect(component).toBeTruthy();
    expect(component.fadeState).toBe('hidden');
    expect(component.slideState).toBe('out');
    expect(component.counterValue).toBe(0);
    expect(component.listItems).toEqual([]);
  });
  
  describe('toggleFade', () => {
    it('首次调用切换为 visible', () => {
      component.toggleFade();
      expect(component.fadeState).toBe('visible');
      expect(component.fadeActive).toBeTrue();
    });

    it('再次调用切换回 hidden', () => {
      component.toggleFade();
      component.toggleFade();
      expect(component.fadeState).toBe('hidden');
      expect(component.fadeActive).toBeFalse();
    });
  });

  describe('toggleSlide', () => {
    it('首次调用切换为 in', () => {
      component.toggleSlide();
      expect(component.slideState).toBe('in');
      expect(component.slideActive).toBeTrue();
    });

    it('再次调用切换回 out', () => {
      component.toggleSlide();
      component.toggleSlide();
      expect(component.slideState).toBe('out');
      expect(component.slideActive).toBeFalse();
    });
  });

  describe('doBounce / onBounceDone', () => {
    it('doBounce 设置 bounceState 为 bounce', () => {
      component.doBounce();
      expect(component.bounceState).toBe('bounce');
    });

    it('onBounceDone 重置 bounceState', () => {
      component.doBounce();
      component.onBounceDone();
      expect(component.bounceState).toBe('');
    });
  });

  describe('runCounter', () => {
    it('从 0 递增到 counterTarget', () => {
      component.runCounter();
      expect(component.counterRunning).toBeTrue();
      expect(component.counterValue).toBe(0);

      jasmine.clock().tick(2000);
      expect(component.counterValue).toBe(component.counterTarget);
      expect(component.counterRunning).toBeFalse();
    });

    it('运行中重复调用不重置', () => {
      component.runCounter();
      jasmine.clock().tick(200);
      const mid = component.counterValue;
      component.runCounter(); // 应被忽略
      expect(component.counterValue).toBe(mid);
    });
  });

  describe('toggleList', () => {
    it('首次显示列表项', () => {
      component.toggleList();
      expect(component.listVisible).toBeTrue();
      expect(component.listItems.length).toBeGreaterThan(0);
    });

    it('再次调用清空列表', () => {
      component.toggleList();
      component.toggleList();
      expect(component.listVisible).toBeFalse();
      expect(component.listItems).toEqual([]);
    });
  });

  describe('toggleSpinner', () => {
    it('启动后 spinnerRunning 为 true', () => {
      component.toggleSpinner();
      expect(component.spinnerRunning).toBeTrue();
    });

    it('旋转角度随时间增加', () => {
      component.toggleSpinner();
      jasmine.clock().tick(100);
      expect(component.spinnerAngle).toBeGreaterThan(0);
    });

    it('再次调用停止旋转', () => {
      component.toggleSpinner();
      jasmine.clock().tick(100);
      component.toggleSpinner();
      expect(component.spinnerRunning).toBeFalse();
      const angleStopped = component.spinnerAngle;
      jasmine.clock().tick(200);
      expect(component.spinnerAngle).toBe(angleStopped);
    });
  });
});
