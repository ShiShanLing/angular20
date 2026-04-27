import { TableComponent } from './table.component';

describe('TableComponent', () => {
  let component: TableComponent;
  const modalStub = { confirm: jasmine.createSpy('confirm'), info: jasmine.createSpy('info') } as any;
  const msgStub = { success: jasmine.createSpy('success'), error: jasmine.createSpy('error') } as any;

  beforeEach(() => {
    component = new TableComponent(modalStub, msgStub);
    component.ngOnInit();
  });

  it('creates component', () => {
    expect(component).toBeTruthy();
  });

  it('generates 20 users on init', () => {
    expect(component.allData.length).toBe(20);
    expect(component.displayData.length).toBe(20);
  });

  it('filters by name using searchText', () => {
    const firstName = component.allData[0].name;
    component.searchText = firstName;
    component.applyFilter();
    expect(component.displayData.some(u => u.name === firstName)).toBeTrue();
    expect(component.displayData.every(u => u.name.includes(firstName) || u.email.includes(firstName) || u.role.includes(firstName))).toBeTrue();
  });

  it('filters by email keyword', () => {
    component.searchText = 'user1@';
    component.applyFilter();
    expect(component.displayData.length).toBeGreaterThan(0);
    expect(component.displayData.every(u => u.email.includes('user1@'))).toBeTrue();
  });

  it('returns empty displayData when no user matches search', () => {
    component.searchText = 'zzz_no_match_xyz';
    component.applyFilter();
    expect(component.displayData.length).toBe(0);
  });

  it('sorts by score ascending', () => {
    component.onSort({ key: 'score', value: 'ascend' });
    const scores = component.displayData.map(u => u.score);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeGreaterThanOrEqual(scores[i - 1]);
    }
  });

  it('sorts by score descending', () => {
    component.onSort({ key: 'score', value: 'descend' });
    const scores = component.displayData.map(u => u.score);
    for (let i = 1; i < scores.length; i++) {
      expect(scores[i]).toBeLessThanOrEqual(scores[i - 1]);
    }
  });

  it('deleteUser triggers modal confirm', () => {
    modalStub.confirm.calls.reset();
    const user = component.allData[0];
    component.deleteUser(user);
    expect(modalStub.confirm).toHaveBeenCalledTimes(1);
  });
  
  it('deleteUser nzOnOk removes user from allData', () => {
    modalStub.confirm.calls.reset();
    const user = component.allData[0];
    const originalLength = component.allData.length;
    component.deleteUser(user);

    const config = modalStub.confirm.calls.mostRecent().args[0];
    config.nzOnOk();

    expect(component.allData.length).toBe(originalLength - 1);
    expect(component.allData.find(u => u.id === user.id)).toBeUndefined();
  });
});
