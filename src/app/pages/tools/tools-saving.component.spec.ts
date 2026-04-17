import { FormBuilder } from '@angular/forms';

import { ToolsSavingComponent } from './tools-saving.component';

describe('ToolsSavingComponent', () => {
  let component: ToolsSavingComponent;

  beforeEach(() => {
    localStorage.clear();
    component = new ToolsSavingComponent(new FormBuilder());
    component.ngOnInit();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
    expect(component.result).toBeTruthy();
  });

  it('calculates target progress and gap correctly', () => {
    component.form.patchValue({
      targetAmount: 100000,
      months: 12,
      monthlyInvest: 5000,
      currentSaved: 10000,
    });

    expect(component.result.finalAmount).toBe(70000);
    expect(component.result.gap).toBe(30000);
    expect(component.result.progress).toBe(70);
    expect(component.result.requiredMonthly).toBe(7500);
    expect(component.result.extraMonthly).toBe(2500);
    expect(component.result.finishMonths).toBe(18);
  });

  it('caps progress at 100 when forecast exceeds target', () => {
    component.form.patchValue({
      targetAmount: 100000,
      months: 12,
      monthlyInvest: 10000,
      currentSaved: 50000,
    });

    expect(component.result.finalAmount).toBe(170000);
    expect(component.result.progress).toBe(100);
    expect(component.result.gap).toBeLessThan(0);
  });

  it('handles impossible finish when monthly invest is zero and target not reached', () => {
    component.form.patchValue({
      targetAmount: 100000,
      months: 12,
      monthlyInvest: 0,
      currentSaved: 1000,
    });

    expect(component.result.finishMonths).toBe(-1);
  });
});

