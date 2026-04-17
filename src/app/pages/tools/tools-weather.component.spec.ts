import { ToolsWeatherComponent } from './tools-weather.component';

describe('ToolsWeatherComponent', () => {
  let component: ToolsWeatherComponent;

  beforeEach(() => {
    localStorage.clear();
    const httpStub = {} as any;
    const msgStub = {
      error: jasmine.createSpy('error'),
    } as any;
    component = new ToolsWeatherComponent(httpStub, msgStub);
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('maps weather code to icon and description', () => {
    expect(component.getConditionIcon(0)).toBe('🌞');
    expect(component.getConditionDesc(0)).toBe('晴朗');
    expect(component.getConditionIcon(95)).toBe('⚡');
    expect(component.getConditionDesc(95)).toBe('雷阵雨');
  });

  it('returns forecast arrays from weatherData', () => {
    component.weatherData = {
      daily: {
        time: ['2026-01-01', '2026-01-02'],
        weathercode: [0, 61],
        temperature_2m_max: [10, 11],
        temperature_2m_min: [1, 2],
      },
      hourly: {
        time: Array.from({ length: 30 }, (_, i) => `2026-01-01T${String(i % 24).padStart(2, '0')}:00`),
        temperature_2m: Array.from({ length: 30 }, (_, i) => i),
        weathercode: Array.from({ length: 30 }, () => 0),
      },
    };

    const daily = component.getForecastArray();
    expect(daily.length).toBe(2);
    expect(daily[1].maxTemp).toBe(11);

    const hourly = component.getHourlyForecastArray();
    expect(hourly.length).toBeLessThanOrEqual(24);
    expect(hourly.length).toBeGreaterThan(0);
  });

  it('builds chart options from hourly forecast', () => {
    component.weatherData = {
      hourly: {
        time: ['2026-01-01T00:00', '2026-01-01T01:00', '2026-01-01T02:00'],
        temperature_2m: [1, 2, 3],
        weathercode: [0, 0, 0],
      },
    };

    component.updateChartOptions();
    expect(component.chartOptions).toBeTruthy();
    expect(component.chartOptions.series[0].data.length).toBe(3);
  });
});

