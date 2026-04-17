import { FormBuilder } from '@angular/forms';

import { ToolsSalaryComponent } from './tools-salary.component';

describe('ToolsSalaryComponent', () => {
  let component: ToolsSalaryComponent;

  beforeEach(() => {
    localStorage.clear();
    const messageStub = {
      success: jasmine.createSpy('success'),
    } as any;
    component = new ToolsSalaryComponent(new FormBuilder(), messageStub);
    component.ngOnInit();
  });

  it('creates component and computes base result', () => {
    expect(component).toBeTruthy();
    expect(component.result).toBeTruthy();
    expect(component.result.netPay).toBeGreaterThan(0);
  });

  it('calculates monthly payroll deductions and net pay', () => {
    component.form.patchValue({
      grossPay: 10000,
      socialBase: 10000,
      housingBase: 10000,
      housingRatio: 7,
      specialDeduction: 0,
      threshold: 5000,
      bonusMonths: 0,
      monthlyExpense: 0,
    });

    expect(component.result.pension).toBeCloseTo(800, 6);
    expect(component.result.medical).toBeCloseTo(200, 6);
    expect(component.result.unemployment).toBeCloseTo(50, 6);
    expect(component.result.housing).toBeCloseTo(700, 6);
    expect(component.result.taxable).toBeCloseTo(3250, 6);
    expect(component.result.tax).toBeCloseTo(115, 6);
    expect(component.result.netPay).toBeCloseTo(8135, 6);
  });

  it('builds 12-month cumulative projection with expected shape', () => {
    component.form.patchValue({
      grossPay: 12000,
      socialBase: 12000,
      housingBase: 12000,
      housingRatio: 7,
      specialDeduction: 1000,
      threshold: 5000,
    });

    expect(component.monthlyProjection.length).toBe(12);
    expect(component.monthlyProjection[0].month).toBe('1月');
    expect(component.monthlyProjection[11].month).toBe('12月');
    expect(component.monthlyProjection[0].netPay).toBeGreaterThan(0);
  });

  it('handles modal state toggles', () => {
    component.showModal();
    expect(component.isModalVisible).toBeTrue();
    component.handleCancel();
    expect(component.isModalVisible).toBeFalse();
  });
});

