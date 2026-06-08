import { TestBed } from '@angular/core/testing';
import { FeatureActivationService } from './feature-activation.service';
import { MenuAccessService } from './menu-access.service';

describe('MenuAccessService activation gate', () => {
  beforeEach(() => {
    localStorage.removeItem('app.feature.activation.codes.v1');
    localStorage.removeItem('app.menu.hidden.paths.v1');
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    localStorage.removeItem('app.feature.activation.codes.v1');
    localStorage.removeItem('app.menu.hidden.paths.v1');
  });

  it('blocks practice routes before activation', () => {
    const service = TestBed.inject(MenuAccessService);

    expect(service.hasAccessToPath('/practice')).toBeFalse();
    expect(service.hasAccessToPath('/ios-learning')).toBeFalse();
    expect(service.hasAccessToPath('/angular-learning')).toBeFalse();
  });

  it('allows practice routes after activating code 999', () => {
    const activation = TestBed.inject(FeatureActivationService);
    const service = TestBed.inject(MenuAccessService);

    activation.activate('999');

    expect(service.hasAccessToPath('/practice')).toBeTrue();
    expect(service.hasAccessToPath('/ios-learning')).toBeTrue();
    expect(service.hasAccessToPath('/angular-learning')).toBeTrue();
  });

  it('blocks practice routes again after deactivating code 999', () => {
    const activation = TestBed.inject(FeatureActivationService);
    const service = TestBed.inject(MenuAccessService);

    activation.activate('999');
    activation.deactivate('999');

    expect(service.hasAccessToPath('/practice')).toBeFalse();
    expect(service.hasAccessToPath('/ios-learning')).toBeFalse();
    expect(service.hasAccessToPath('/angular-learning')).toBeFalse();
  });

  it('keeps unrelated routes accessible without activation', () => {
    const service = TestBed.inject(MenuAccessService);

    expect(service.hasAccessToPath('/tools/qrcode')).toBeTrue();
  });
});
