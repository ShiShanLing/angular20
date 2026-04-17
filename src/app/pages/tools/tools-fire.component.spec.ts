import { FormBuilder } from '@angular/forms';

import { ToolsFireComponent } from './tools-fire.component';

describe('ToolsFireComponent', () => {
  let component: ToolsFireComponent;

  beforeEach(() => {
    localStorage.clear();
    component = new ToolsFireComponent(new FormBuilder());
    component.ngOnInit();
  });

  it('creates component and initializes summary', () => {
    expect(component).toBeTruthy();
    expect(component.summary).toBeTruthy();
    expect(component.rows.length).toBeGreaterThan(0);
  });

  it('treats retirementAge equal currentAge as immediate retirement', () => {
    component.form.patchValue({
      currentSavings: 500000,
      nominalReturnPct: 5,
      inflationPct: 2,
      annualSpendingYear1: 50000,
      currentAge: 30,
      retirementAge: 30,
      gender: 'male',
    });

    expect(component.summary).toBeTruthy();
    expect(component.summary!.yearsPreRetirement).toBe(0);
    expect(component.summary!.balanceAtRetirement).toBe(500000);
    expect(component.summary!.retirementCalendarYear).toBe(component.currentCalendarYear);
  });

  it('marks depletion year when spending exceeds balance immediately', () => {
    component.form.patchValue({
      currentSavings: 1000,
      nominalReturnPct: 0,
      inflationPct: 0,
      annualSpendingYear1: 50000,
      currentAge: 60,
      retirementAge: 60,
      gender: 'female',
    });

    expect(component.summary).toBeTruthy();
    expect(component.summary!.depletionCalendarYear).toBe(component.currentCalendarYear);
    expect(component.summary!.depletionAge).toBe(60);
    expect(component.rows[0].depletedThisYear).toBeTrue();
    expect(component.rows[0].balanceEnd).toBe(0);
  });

  it('persists valid form values to localStorage', () => {
    component.form.patchValue({
      currentSavings: 123456,
      nominalReturnPct: 4,
      inflationPct: 2,
      annualSpendingYear1: 40000,
      currentAge: 40,
      retirementAge: 45,
      gender: 'male',
    });

    const saved = localStorage.getItem('tools_fire_sim_v1');
    expect(saved).toBeTruthy();
    expect(saved!).toContain('"currentSavings":123456');
  });
});

