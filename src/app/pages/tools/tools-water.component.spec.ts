import { FormBuilder } from '@angular/forms';

import { ToolsWaterComponent } from './tools-water.component';

describe('ToolsWaterComponent', () => {
  let component: ToolsWaterComponent;
  const msgStub = {
    success: jasmine.createSpy('success'),
    error: jasmine.createSpy('error'),
  } as any;

  beforeEach(() => {
    localStorage.clear();
    component = new ToolsWaterComponent(new FormBuilder(), msgStub);
    component.ngOnInit();
  });

  it('creates component and computes default plan', () => {
    expect(component).toBeTruthy();
    expect(component.result.timesPerDay).toBeGreaterThan(0);
    expect(component.result.plannedMl).toBeGreaterThan(0);
  });

  it('sets warning status when params are incomplete', () => {
    component.form.patchValue({
      goal: 0,
      per: 250,
      timeList: '',
    });

    expect(component.result.status).toBe('warning');
    expect(component.result.hint).toContain('请设置目标');
  });

  it('parses, deduplicates and sorts time lines', () => {
    const times = (component as any).parseTimeLines('18:30\n09:30\n18:30\nbad\n11:00');
    expect(times.length).toBe(3);
    expect(times[0].raw).toBe('09:30');
    expect(times[1].raw).toBe('11:00');
    expect(times[2].raw).toBe('18:30');
  });

  it('builds ics content when params are valid', () => {
    component.form.patchValue({
      startDate: new Date('2026-01-01'),
      days: 2,
      per: 200,
      timeList: '09:30\n18:30',
      tzid: 'Asia/Shanghai',
    });

    const built = (component as any).buildIcs();
    expect(built.ok).toBeTrue();
    expect(built.ics).toContain('BEGIN:VCALENDAR');
    expect(built.ics).toContain('SUMMARY:喝水提醒 (200ml)');
    expect(built.ics).toContain('END:VCALENDAR');
  });
});

