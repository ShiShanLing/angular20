import { ToolsCalendarComponent } from './tools-calendar.component';

describe('ToolsCalendarComponent', () => {
  let component: ToolsCalendarComponent;

  beforeEach(() => {
    component = new ToolsCalendarComponent();
    component.ngOnInit();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
    expect(component.selectedDate).toBeTruthy();
  });

  it('navigates to previous and next month', () => {
    component.selectedDate = new Date('2026-06-15');
    component.prevMonth();
    expect(component.selectedDate.getMonth()).toBe(4); // May

    component.nextMonth();
    expect(component.selectedDate.getMonth()).toBe(5); // Jun
  });

  it('returns holiday info by date mapping', () => {
    const holiday = component.getHolidayInfo(new Date('2026-10-01'));
    expect(holiday).toBeTruthy();
    expect(holiday.name).toBe('国庆');
    expect(holiday.type).toBe('holiday');
  });

  it('returns undefined for unmapped dates', () => {
    const holiday = component.getHolidayInfo(new Date('2026-11-11'));
    expect(holiday).toBeUndefined();
  });
});

