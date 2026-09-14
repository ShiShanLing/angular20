import { ToolsDrawComponent } from './tools-draw.component';

describe('ToolsDrawComponent', () => {
  it('starts with red ink and medium width', () => {
    const component = new ToolsDrawComponent();
    expect(component.color()).toBe('#f5222d');
    expect(component.width()).toBe(5);
    expect(component.currentColorLabel()).toBe('红色');
    expect(component.currentToolLabel()).toBe('随意画');
  });

  it('switches brush color and width', () => {
    const component = new ToolsDrawComponent();
    component.setColor('#1677ff');
    component.setWidth(18);
    expect(component.color()).toBe('#1677ff');
    expect(component.width()).toBe(18);
  });

  it('defaults to freehand and can switch shape tools', () => {
    const component = new ToolsDrawComponent();
    expect(component.tool()).toBe('free');
    component.setTool('rect');
    expect(component.tool()).toBe('rect');
    component.setTool('circle');
    expect(component.tool()).toBe('circle');
  });

  it('uses pen to draw and eraser to erase as exclusive tools', () => {
    const component = new ToolsDrawComponent();
    component.setTool('circle');
    component.useEraser();
    expect(component.erasing()).toBeTrue();
    expect(component.tool()).toBe('eraser');
    component.usePen();
    expect(component.erasing()).toBeFalse();
    expect(component.tool()).toBe('circle');
    component.useEraser();
    component.setTool('free');
    expect(component.erasing()).toBeFalse();
    expect(component.tool()).toBe('free');
  });

  it('clears polyline chaining when leaving the line tool', () => {
    const component = new ToolsDrawComponent();
    component.setTool('line');
    expect(component.lineChaining()).toBeFalse();
    component.setTool('free');
    expect(component.tool()).toBe('free');
    expect(component.lineChaining()).toBeFalse();
  });

  it('cannot undo before any drawing', () => {
    const component = new ToolsDrawComponent();
    expect(component.canUndo()).toBeFalse();
    component.undo();
    expect(component.canUndo()).toBeFalse();
  });
});
