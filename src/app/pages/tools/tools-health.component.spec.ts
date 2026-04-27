import { ToolsHealthComponent } from './tools-health.component';

describe('ToolsHealthComponent', () => {
  it('creates component and sets trusted URL via sanitizer', () => {
    const sanitizerStub = {
      bypassSecurityTrustResourceUrl: (url: string) => url,
    } as any;

    const component = new ToolsHealthComponent(sanitizerStub);
    expect(component).toBeTruthy();
    expect(component.url).toBe('./health-tools.html');
  });

  it('uses bypassSecurityTrustResourceUrl to wrap the url', () => {
    const spy = jasmine.createSpy('bypassSecurityTrustResourceUrl').and.returnValue('trusted-url');
    const sanitizerStub = { bypassSecurityTrustResourceUrl: spy } as any;

    new ToolsHealthComponent(sanitizerStub);

    expect(spy).toHaveBeenCalledOnceWith('./health-tools.html');
  });
});
