import { TestBed } from '@angular/core/testing';

import { RuntimeConfigService } from '../config/runtime-config.service';
import { BusinessTimeService } from './business-time.service';

describe('BusinessTimeService', () => {
  let service: BusinessTimeService;
  let config: RuntimeConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BusinessTimeService);
    config = TestBed.inject(RuntimeConfigService);
  });

  it('formats the same instant in the configured business timezone', () => {
    config.businessTimeZone.set('America/Argentina/Buenos_Aires');
    expect(service.formatInstant('2026-08-12T13:00:00Z', 'es-ES')).toContain('10:00');

    config.businessTimeZone.set('Europe/Madrid');
    expect(service.formatInstant('2026-08-12T13:00:00Z', 'es-ES')).toContain('15:00');
  });

  it('round-trips datetime-local through the business timezone independently of the host', () => {
    config.businessTimeZone.set('America/Argentina/Buenos_Aires');

    const instant = service.localDateTimeToInstant('2026-08-12T10:00');

    expect(instant).toBe('2026-08-12T13:00:00.000Z');
    expect(service.instantToLocalDateTime(instant)).toBe('2026-08-12T10:00');
  });

  it('uses IANA daylight-saving rules instead of a fixed offset', () => {
    config.businessTimeZone.set('Europe/Madrid');

    expect(service.localDateTimeToInstant('2026-01-12T10:00')).toBe('2026-01-12T09:00:00.000Z');
    expect(service.localDateTimeToInstant('2026-08-12T10:00')).toBe('2026-08-12T08:00:00.000Z');
  });

  it('represents a nonexistent DST wall time as an invalid resolution', () => {
    config.businessTimeZone.set('Europe/Madrid');

    expect(service.resolveLocalDateTime('2026-03-29T02:30')).toEqual({ valid: false });
  });

  it('formats LocalDateTime without shifting its wall-clock fields', () => {
    config.businessTimeZone.set('America/Argentina/Buenos_Aires');
    expect(service.formatLocalDateTime('2026-08-12T23:30:00', 'es-ES')).toContain('23:30');

    config.businessTimeZone.set('Europe/Madrid');
    expect(service.formatLocalDateTime('2026-08-12T23:30:00', 'es-ES')).toContain('23:30');
  });

  it('formats fractional LocalDateTime values without shifting their wall-clock fields', () => {
    config.businessTimeZone.set('America/Argentina/Buenos_Aires');
    expect(service.formatLocalDateTime('2026-08-10T06:42:58.073728', 'en-GB')).toContain('06:42');

    config.businessTimeZone.set('Europe/Madrid');
    expect(service.formatLocalDateTime('2026-08-10T06:42:58.123456789', 'en-GB')).toContain(
      '06:42',
    );
  });
});
