import { ToolsTextComponent } from './tools-text.component';

describe('ToolsTextComponent', () => {
  let component: ToolsTextComponent;
  const msgStub = {
    success: jasmine.createSpy('success'),
    warning: jasmine.createSpy('warning'),
  } as any;

  beforeEach(() => {
    localStorage.clear();
    component = new ToolsTextComponent(msgStub);
    component.ngOnInit();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('converts punctuation to Chinese and back to English', () => {
    component.sourceText = 'Hello, world!';
    component.replacePunctuation(true);
    expect(component.sourceText).toBe('Hello， world！');

    component.replacePunctuation(false);
    expect(component.sourceText).toBe('Hello, world!');
  });

  it('removes empty lines and adds numbering', () => {
    component.sourceText = 'alpha\n\nbeta\n';
    component.removeEmptyLines();
    expect(component.sourceText).toBe('alpha\nbeta\n');

    component.addBatchNumbering();
    expect(component.sourceText).toContain('1. alpha');
    expect(component.sourceText).toContain('2. beta');
  });

  it('generates markdown table from csv text', () => {
    component.sourceText = 'name,age\nAlice,20';
    component.generateMarkdownTable();
    expect(component.sourceText).toContain('| name | age |');
    expect(component.sourceText).toContain('|---|---|');
    expect(component.sourceText).toContain('| Alice | 20 |');
  });
});

