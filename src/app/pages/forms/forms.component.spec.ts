import { FormBuilder } from '@angular/forms';
import { FormsComponent } from './forms.component';

describe('FormsComponent', () => {
  let component: FormsComponent;
  const msgStub = {
    success: jasmine.createSpy('success'),
    error: jasmine.createSpy('error'),
  } as any;

  beforeEach(() => {
    msgStub.success.calls.reset();
    msgStub.error.calls.reset();
    component = new FormsComponent(new FormBuilder(), msgStub);
  });

  it('creates component with a form group', () => {
    expect(component).toBeTruthy();
    expect(component.form).toBeTruthy();
  });

  it('form is invalid when required fields are empty', () => {
    expect(component.form.invalid).toBeTrue();
  });

  it('submitForm with invalid form calls msg.error and does not set submitted', () => {
    component.submitForm();
    expect(msgStub.error).toHaveBeenCalled();
    expect(component.submitted).toBeFalse();
  });

  it('submitForm with valid form sets submitted=true and formValues', () => {
    component.form.patchValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'developer',
    });
    component.submitForm();
    expect(component.submitted).toBeTrue();
    expect(component.formValues).toBeTruthy();
    expect(component.formValues.username).toBe('testuser');
    expect(msgStub.success).toHaveBeenCalled();
  });

  it('resetForm clears submitted and formValues', () => {
    component.form.patchValue({
      username: 'testuser',
      email: 'test@example.com',
      password: 'password123',
      role: 'developer',
    });
    component.submitForm();
    expect(component.submitted).toBeTrue();

    component.resetForm();
    expect(component.submitted).toBeFalse();
    expect(component.formValues).toBeNull();
  });

  it('resetForm resets form to default values', () => {
    component.form.patchValue({ role: 'admin', level: 80 });
    component.resetForm();
    expect(component.form.value.role).toBe('developer');
    expect(component.form.value.level).toBe(50);
  });

  it('addSkill adds new skill', () => {
    const initialLength = component.skills.length;
    component.addSkill('TypeScript');
    expect(component.skills.length).toBe(initialLength + 1);
    expect(component.skills).toContain('TypeScript');
  });

  it('addSkill does not add duplicate skills', () => {
    component.addSkill('Angular');
    const countBefore = component.skills.filter(s => s === 'Angular').length;
    component.addSkill('Angular');
    const countAfter = component.skills.filter(s => s === 'Angular').length;
    expect(countAfter).toBe(countBefore);
  });

  it('formatter returns value as percentage string', () => {
    expect(component.formatter(75)).toBe('75%');
    expect(component.formatter(0)).toBe('0%');
  });
});
