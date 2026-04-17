import { FormBuilder } from '@angular/forms';

import { ToolsAnhuiPensionComponent } from './tools-anhui-pension.component';

describe('ToolsAnhuiPensionComponent', () => {
  let component: ToolsAnhuiPensionComponent;

  beforeEach(() => {
    localStorage.clear();
    component = new ToolsAnhuiPensionComponent(new FormBuilder());
    component.ngOnInit();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('calculates monthly pension and payback period', () => {
    component.form.patchValue({
      personalAccountTotal: 13900,
      basicPension: 200,
    });

    expect(component.result).toBeTruthy();
    expect(component.result!.accountPart).toBeCloseTo(100, 6);
    expect(component.result!.monthlyPension).toBeCloseTo(300, 6);
    expect(component.result!.paybackMonths).toBeCloseTo(46.3333, 3);
    expect(component.result!.paybackYears).toBeCloseTo(3.8611, 3);
  });

  it('returns null result while form is invalid', () => {
    component.form.patchValue({
      personalAccountTotal: null,
      basicPension: 200,
    });
    component.calculate();

    expect(component.form.invalid).toBeTrue();
    expect(component.result).toBeNull();
  });
});

