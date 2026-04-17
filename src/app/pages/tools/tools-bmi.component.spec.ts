import { FormBuilder } from '@angular/forms';

import { ToolsBmiComponent } from './tools-bmi.component';

describe('ToolsBmiComponent', () => {
  let component: ToolsBmiComponent;

  beforeEach(() => {
    localStorage.clear();
    component = new ToolsBmiComponent(new FormBuilder());
    component.ngOnInit();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('calculates BMI and category from form values', () => {
    component.form.patchValue({
      height: 170,
      weight: 65,
      age: 30,
      sex: 'male',
    });

    const expectedBmi = 65 / Math.pow(1.7, 2);
    expect(component.result.bmi).toBeCloseTo(expectedBmi, 4);
    expect(component.result.category).toBe('正常');
    expect(component.result.categoryColor).toBe('success');
  });

  it('loads persisted state and uses it for calculation', () => {
    localStorage.setItem(
      'tools_bmi_state',
      JSON.stringify({ height: 160, weight: 40, age: 22, sex: 'female' }),
    );

    component = new ToolsBmiComponent(new FormBuilder());
    component.ngOnInit();

    expect(component.form.value.height).toBe(160);
    expect(component.form.value.weight).toBe(40);
    expect(component.result.category).toBe('偏瘦');
  });
});

