import { DatePipe } from '@angular/common';
import { FormBuilder } from '@angular/forms';

import { ToolsWeightComponent } from './tools-weight.component';

describe('ToolsWeightComponent', () => {
  let component: ToolsWeightComponent;
  const msgStub = {
    success: jasmine.createSpy('success'),
    warning: jasmine.createSpy('warning'),
  } as any;

  beforeEach(() => {
    localStorage.clear();
    component = new ToolsWeightComponent(new FormBuilder(), msgStub, new DatePipe('en-US'));
    component.ngOnInit();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
    expect(component.records).toEqual([]);
  });

  it('adds new record and builds chart', () => {
    component.form.patchValue({
      date: new Date('2026-01-01'),
      weight: 70.5,
    });
    component.submitForm();

    expect(component.records.length).toBe(1);
    expect(component.reversedRecords.length).toBe(1);
    expect(msgStub.success).toHaveBeenCalledWith('记录成功');
    expect(component.chartOption).toBeTruthy();
  });

  it('overrides record with same date instead of adding duplicate', () => {
    component.form.patchValue({ date: new Date('2026-01-01'), weight: 70 });
    component.submitForm();
    component.form.patchValue({ date: new Date('2026-01-01'), weight: 69.2 });
    component.submitForm();

    expect(component.records.length).toBe(1);
    expect(component.records[0].weight).toBe(69.2);
  });

  it('builds moving average data after 7 records', () => {
    const start = new Date('2026-01-01');
    for (let i = 0; i < 7; i++) {
      const d = new Date(start.getTime());
      d.setDate(start.getDate() + i);
      component.form.patchValue({ date: d, weight: 70 + i });
      component.submitForm();
    }

    const series = (component.chartOption as any).series;
    expect(series[1].name).toBe('7日均线');
    // first 6 are null, 7th has value
    expect(series[1].data[5]).toBeNull();
    expect(series[1].data[6]).toBe(73);
  });
});

