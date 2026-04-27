import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;

  beforeEach(() => {
    component = new DashboardComponent();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('initializes stats array with 4 entries', () => {
    expect(component.stats.length).toBe(4);
  });

  it('stats entries have required fields', () => {
    for (const s of component.stats) {
      expect(typeof s.title).toBe('string');
      expect(typeof s.value).toBe('number');
      expect(typeof s.trend).toBe('string');
    }
  });

  it('ngOnInit populates lineOption and pieOption', () => {
    component.ngOnInit();
    expect(component.lineOption).toBeTruthy();
    expect((component.lineOption as any).series).toBeTruthy();
    expect(component.pieOption).toBeTruthy();
    expect((component.pieOption as any).series).toBeTruthy();
  });

  it('lineOption xAxis contains 12 month labels', () => {
    component.ngOnInit();
    const xAxis = (component.lineOption as any).xAxis;
    expect(xAxis.data.length).toBe(12);
  });

  it('pieOption series has 5 traffic-source entries', () => {
    component.ngOnInit();
    const series = (component.pieOption as any).series[0];
    expect(series.data.length).toBe(5);
  });
});
