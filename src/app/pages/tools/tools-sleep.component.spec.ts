import { DatePipe } from '@angular/common';
import { FormBuilder } from '@angular/forms';

import { ToolsSleepComponent } from './tools-sleep.component';

describe('ToolsSleepComponent', () => {
  let component: ToolsSleepComponent;
  const msgStub = {
    success: jasmine.createSpy('success'),
    error: jasmine.createSpy('error'),
  } as any;

  beforeEach(() => {
    localStorage.clear();
    component = new ToolsSleepComponent(new FormBuilder(), msgStub, new DatePipe('en-US'));
    component.ngOnInit();
  });

  it('creates component and initializes form', () => {
    expect(component).toBeTruthy();
    expect(component.form).toBeTruthy();
  });

  it('records a valid sleep entry and calculates stats', () => {
    component.form.patchValue({
      recordDate: new Date('2026-01-01'),
      sleepTime: new Date('2026-01-01T23:00:00'),
      wakeTime: new Date('2026-01-02T07:00:00'),
      napDuration: 0.5,
    });
    component.submitForm();

    expect(component.records.length).toBe(1);
    expect(component.records[0].totalSleep).toBeCloseTo(8.5, 6);
    expect(component.stats).toBeTruthy();
    expect(component.stats.avgSleep).toBeCloseTo(8.5, 6);
    expect(msgStub.success).toHaveBeenCalledWith('记录成功');
  });

  it('rejects invalid time range when sleepTime >= wakeTime', () => {
    component.form.patchValue({
      recordDate: new Date('2026-01-01'),
      sleepTime: new Date('2026-01-02T08:00:00'),
      wakeTime: new Date('2026-01-02T07:00:00'),
      napDuration: 0,
    });
    component.submitForm();

    expect(component.records.length).toBe(0);
    expect(msgStub.error).toHaveBeenCalledWith('起床时间必须晚于入睡时间');
  });

  it('upserts by date string instead of duplicate insert', () => {
    component.form.patchValue({
      recordDate: new Date('2026-01-01'),
      sleepTime: new Date('2026-01-01T23:00:00'),
      wakeTime: new Date('2026-01-02T07:00:00'),
      napDuration: 0,
    });
    component.submitForm();

    component.form.patchValue({
      recordDate: new Date('2026-01-01'),
      sleepTime: new Date('2026-01-01T22:30:00'),
      wakeTime: new Date('2026-01-02T06:30:00'),
      napDuration: 1,
    });
    component.submitForm();

    expect(component.records.length).toBe(1);
    expect(component.records[0].totalSleep).toBeCloseTo(9, 6);
  });
});

