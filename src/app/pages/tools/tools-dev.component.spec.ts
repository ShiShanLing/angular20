import { DatePipe } from '@angular/common';

import { ToolsDevComponent } from './tools-dev.component';

describe('ToolsDevComponent', () => {
  let component: ToolsDevComponent;
  const msgStub = {
    success: jasmine.createSpy('success'),
    error: jasmine.createSpy('error'),
    warning: jasmine.createSpy('warning'),
  } as any;

  beforeEach(() => {
    localStorage.clear();
    component = new ToolsDevComponent(msgStub, new DatePipe('en-US'));
    component.ngOnInit();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('formats and compresses json', () => {
    component.jsonInput = '{"a":1,"b":{"c":2}}';
    component.formatJson();
    expect(component.jsonOutput).toContain('\n');
    expect(msgStub.success).toHaveBeenCalledWith('JSON 格式化成功');

    component.compressJson();
    expect(component.jsonOutput).toBe('{"a":1,"b":{"c":2}}');
  });

  it('encodes and decodes base64 unicode text', () => {
    component.base64Input = '你好,Angular';
    component.encodeBase64();
    const encoded = component.base64Output;
    expect(encoded.length).toBeGreaterThan(0);

    component.base64Input = encoded;
    component.decodeBase64();
    expect(component.base64Output).toBe('你好,Angular');
  });

  it('converts between timestamp and datetime', () => {
    component.inputTimestamp = '1700000000'; // seconds timestamp
    component.convertTsToTime();
    expect(component.outputTime.length).toBeGreaterThan(0);

    component.inputTime = '2026-01-01T08:00:00';
    component.convertTimeToTs();
    expect(Number(component.outputTimestamp)).toBeGreaterThan(0);
  });
});

