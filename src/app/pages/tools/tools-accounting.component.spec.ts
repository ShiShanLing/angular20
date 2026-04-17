import { DatePipe } from '@angular/common';
import { FormBuilder } from '@angular/forms';

import { ToolsAccountingComponent } from './tools-accounting.component';

describe('ToolsAccountingComponent', () => {
  let component: ToolsAccountingComponent;
  const msgStub = {
    success: jasmine.createSpy('success'),
    warning: jasmine.createSpy('warning'),
  } as any;

  beforeEach(() => {
    localStorage.clear();
    component = new ToolsAccountingComponent(new FormBuilder(), msgStub, new DatePipe('en-US'));
    component.ngOnInit();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
    expect(component.records).toEqual([]);
  });

  it('adds a record and rebuilds chart', () => {
    component.form.patchValue({
      amount: 88,
      category: '餐饮',
      remarks: 'lunch',
      date: new Date('2026-01-01T12:00:00'),
    });
    component.submitForm();

    expect(component.records.length).toBe(1);
    expect(component.records[0].amount).toBe(88);
    expect(msgStub.success).toHaveBeenCalledWith('记录成功');
    expect(component.chartOption).toBeTruthy();
  });

  it('aggregates category sums in chart data', () => {
    component.records = [
      { id: '1', amount: 10, category: '餐饮', remarks: '', date: new Date().toISOString() },
      { id: '2', amount: 20, category: '餐饮', remarks: '', date: new Date().toISOString() },
      { id: '3', amount: 5, category: '交通', remarks: '', date: new Date().toISOString() },
    ];
    component.buildChart('week');

    const seriesData = (component.chartOption as any).series[0].data;
    const dining = seriesData.find((x: any) => x.name === '餐饮');
    const traffic = seriesData.find((x: any) => x.name === '交通');
    expect(dining.value).toBe(30);
    expect(traffic.value).toBe(5);
  });

  it('deletes a record', () => {
    component.records = [
      { id: '1', amount: 10, category: '餐饮', remarks: '', date: new Date().toISOString() },
      { id: '2', amount: 20, category: '交通', remarks: '', date: new Date().toISOString() },
    ];
    component.deleteRecord('1');

    expect(component.records.length).toBe(1);
    expect(component.records[0].id).toBe('2');
    expect(msgStub.success).toHaveBeenCalledWith('删除成功');
  });
});

