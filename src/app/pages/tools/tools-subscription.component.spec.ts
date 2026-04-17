import { DatePipe } from '@angular/common';
import { FormBuilder } from '@angular/forms';

import { ToolsSubscriptionComponent } from './tools-subscription.component';

describe('ToolsSubscriptionComponent', () => {
  let component: ToolsSubscriptionComponent;
  const msgStub = {
    success: jasmine.createSpy('success'),
  } as any;

  beforeEach(() => {
    localStorage.clear();
    msgStub.success.calls.reset();
    component = new ToolsSubscriptionComponent(new FormBuilder(), msgStub, new DatePipe('en-US'));
    component.ngOnInit();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
    expect(component.form).toBeTruthy();
  });

  it('keeps invalid form from generating ics', () => {
    component.form.patchValue({
      serviceName: null,
      amount: null,
      expiryDate: null,
    });

    component.generateICS();
    expect(component.form.invalid).toBeTrue();
    expect(msgStub.success).not.toHaveBeenCalled();
  });

  it('generates ics and emits success message for valid data', () => {
    const clickSpy = jasmine.createSpy('click');
    spyOn(document, 'createElement').and.returnValue({
      href: '',
      download: '',
      click: clickSpy,
    } as any);
    spyOn(document.body, 'appendChild').and.callFake(() => null as any);
    spyOn(document.body, 'removeChild').and.callFake(() => null as any);
    spyOn(URL, 'createObjectURL').and.returnValue('blob:test');

    component.form.patchValue({
      serviceName: 'ChatGPT Plus',
      amount: 20,
      cycle: 'monthly',
      expiryDate: new Date('2026-01-01'),
      remarks: 'test',
    });

    component.generateICS();
    expect(clickSpy).toHaveBeenCalled();
    expect(msgStub.success).toHaveBeenCalledWith('ICS 文件已导出，请导入到系统日历');
  });
});

