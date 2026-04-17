import { FormBuilder } from '@angular/forms';

import { ToolsMortgageComponent } from './tools-mortgage.component';

describe('ToolsMortgageComponent', () => {
  let component: ToolsMortgageComponent;

  beforeEach(() => {
    localStorage.clear();
    component = new ToolsMortgageComponent(new FormBuilder());
    component.ngOnInit();
  });

  it('creates component and initializes result', () => {
    expect(component).toBeTruthy();
    expect(component.result).toBeTruthy();
    expect(component.result.totalMonthly).toBeGreaterThanOrEqual(0);
  });

  it('uses fullDown plan with zero commercial loan', () => {
    component.form.patchValue({
      housePrice: 1_200_000,
      gjjMax: 700_000,
      plan: 'fullDown',
      years: 30,
      gjjRate: 2.6,
      bizRate: 3.2,
      gjjBalance: 0,
      gjjMonthlyIn: 0,
    });

    expect(component.result.gjjPrincipal).toBe(700000);
    expect(component.result.bizPrincipal).toBe(0);
    expect(component.result.downPayment).toBe(500000);
  });

  it('uses combo plan and splits gjj + business loan', () => {
    component.form.patchValue({
      housePrice: 1_200_000,
      downPct: 30,
      gjjMax: 700_000,
      plan: 'combo',
      years: 30,
      gjjRate: 2.6,
      bizRate: 3.2,
      gjjBalance: 72_000,
      gjjMonthlyIn: 2_000,
    });

    // needLoan = 1_200_000 - 360_000 = 840_000
    expect(component.result.downPayment).toBe(360000);
    expect(component.result.gjjPrincipal).toBe(700000);
    expect(component.result.bizPrincipal).toBe(140000);
    expect(component.result.totalMonthly).toBeGreaterThan(0);
  });

  it('returns long support duration when monthly out is zero', () => {
    component.form.patchValue({
      housePrice: 1_000_000,
      gjjMax: 0,
      plan: 'fullDown',
      years: 30,
      gjjRate: 0,
      bizRate: 0,
      gjjBalance: 5000,
      gjjMonthlyIn: 1000,
    });

    expect(component.result.totalMonthly).toBe(0);
    expect(component.result.supportMonths).toBe(999);
  });
});

