import { FormBuilder } from '@angular/forms';

import { ToolsTimeComponent } from './tools-time.component';

describe('ToolsTimeComponent', () => {
  let component: ToolsTimeComponent;
  const msgStub = {
    success: jasmine.createSpy('success'),
    warning: jasmine.createSpy('warning'),
    error: jasmine.createSpy('error'),
  } as any;
  const modalStub = {
    info: jasmine.createSpy('info'),
    confirm: jasmine.createSpy('confirm'),
  } as any;

  beforeEach(() => {
    localStorage.clear();
    spyOn(window, 'setInterval').and.returnValue(0 as any);
    component = new ToolsTimeComponent(new FormBuilder(), msgStub, modalStub);
    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
    expect(component.deadlineForm).toBeTruthy();
  });

  it('handles todo add/toggle/delete flow', () => {
    component.newTodoText = 'write tests';
    component.addTodo();
    expect(component.todoList.length).toBe(1);
    expect(component.todoList[0].done).toBeFalse();

    component.toggleTodo(component.todoList[0]);
    expect(component.todoList[0].done).toBeTrue();

    const id = component.todoList[0].id;
    component.deleteTodo(id);
    expect(component.todoList.length).toBe(0);
  });

  it('computes schedule when deadline exists', () => {
    const future = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
    component.deadlineForm.patchValue({
      deadline: future,
      totalHours: 30,
      doneHours: 6,
      hoursPerDay: 10,
      workdaysOnly: 'no',
    });
    component.computeSchedule();

    expect(component.scheduleResult.remainHours).toBe(24);
    expect(component.scheduleResult.remainDays).toBeGreaterThan(0);
    expect(component.scheduleResult.countdownStr).toContain('天');
  });

  it('marks overdue deadline as impossible', () => {
    const past = new Date(Date.now() - 24 * 60 * 60 * 1000);
    component.deadlineForm.patchValue({
      deadline: past,
      totalHours: 10,
      doneHours: 0,
    });
    component.computeSchedule();

    expect(component.scheduleResult.countdownStr).toBe('已到期');
    expect(component.scheduleResult.feasible).toBe('来不及');
  });

  it('switches pomodoro modes and formats time', () => {
    component.setPomoMode('work');
    expect(component.pomoRemainingSec).toBe(25 * 60);

    component.nextPomo();
    expect(component.pomoMode).toBe('break');

    expect(component.formatTime(65)).toBe('01:05');
  });
});

