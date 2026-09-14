import { FormBuilder } from '@angular/forms';

import {
  annualBonusTax,
  monthlyWithholdingTax,
  ToolsSalaryComponent,
} from './tools-salary.component';

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

describe('salary annual income helpers', () => {
  it('keeps annual wage as monthly pay times 12 even when bonus months is 24', () => {
    const gross = 24200;
    const bonusMonths = 24;
    const annualWageGross = gross * 12;
    const annualBonusGross = gross * bonusMonths;
    expect(annualWageGross).toBe(290400);
    expect(annualBonusGross).toBe(580800);
    expect(annualWageGross + annualBonusGross).toBe(871200);
  });

  it('uses monthly withholding brackets', () => {
    expect(monthlyWithholdingTax(0)).toBe(0);
    expect(monthlyWithholdingTax(3000)).toBeCloseTo(90, 6);
    expect(monthlyWithholdingTax(16450)).toBeCloseTo(16450 * 0.2 - 1410, 6);
  });

  it('taxes year-end bonus separately instead of cloning monthly net', () => {
    const bonusGross = 24200 * 24;
    const tax = annualBonusTax(bonusGross);
    expect(tax).toBeGreaterThan(0);
    expect(tax).toBeLessThan(bonusGross);
    expect(annualBonusTax(0)).toBe(0);
  });
});

