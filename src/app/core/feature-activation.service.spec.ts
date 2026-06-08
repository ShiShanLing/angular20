import { TestBed } from '@angular/core/testing';
import { FeatureActivationService } from './feature-activation.service';

describe('FeatureActivationService', () => {
  const storageKey = 'app.feature.activation.codes.v1';

  beforeEach(() => {
    localStorage.removeItem(storageKey);
    TestBed.resetTestingModule();
  });

  afterEach(() => {
    localStorage.removeItem(storageKey);
  });

  it('treats features without activation code as active', () => {
    const service = TestBed.inject(FeatureActivationService);

    expect(service.isActive()).toBeTrue();
  });

  it('keeps code-locked features inactive until the code is activated', () => {
    const service = TestBed.inject(FeatureActivationService);

    expect(service.isActive('999')).toBeFalse();

    service.activate('999');

    expect(service.isActive('999')).toBeTrue();
  });

  it('loads persisted active codes', () => {
    localStorage.setItem(storageKey, JSON.stringify(['999']));

    const service = TestBed.inject(FeatureActivationService);

    expect(service.isActive('999')).toBeTrue();
  });

  it('removes active codes when deactivated', () => {
    const service = TestBed.inject(FeatureActivationService);

    service.activate('999');
    expect(service.isActive('999')).toBeTrue();

    service.deactivate('999');

    expect(service.isActive('999')).toBeFalse();
    expect(localStorage.getItem(storageKey)).toBe('[]');
  });
});
