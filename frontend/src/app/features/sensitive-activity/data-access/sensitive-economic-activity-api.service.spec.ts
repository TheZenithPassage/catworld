import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { MalformedSensitiveActivityError } from '../models/sensitive-economic-activity';
import { SensitiveEconomicActivityApiService } from './sensitive-economic-activity-api.service';

describe('SensitiveEconomicActivityApiService', () => {
  let service: SensitiveEconomicActivityApiService;
  let http: HttpTestingController;
  const rateEvent = {
    eventId: 'event-1',
    eventType: 'NIGHTLY_RATE_CHANGED',
    occurredAt: '2026-08-01T12:00:00Z',
    actor: { id: 'actor-1', username: 'admin' },
    affectedContext: null,
    category: 'ONE_CAT',
    previousRate: null,
    newRate: '9999999999999999999.123456789',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SensitiveEconomicActivityApiService);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => http.verify());

  it('encodes the exact page and all applied filters and preserves exact money', () => {
    let result: unknown;
    service
      .getActivity(
        {
          actorId: 'actor-1',
          occurredFrom: '2026-08-01T13:00:00.000Z',
          occurredTo: '2026-08-02T14:30:00.000Z',
          eventType: 'NIGHTLY_RATE_CHANGED',
          ownerId: 'owner-1',
          catId: 'cat-1',
          stayId: 'stay-1',
          stayFrom: '2026-08-10',
          stayTo: '2026-08-12',
        },
        3,
      )
      .subscribe((page) => (result = page));
    const request = http.expectOne((candidate) =>
      candidate.url.endsWith('/sensitive-economic-activity'),
    );
    expect(
      Object.fromEntries(
        request.request.params.keys().map((key) => [key, request.request.params.get(key)]),
      ),
    ).toEqual({
      page: '3',
      actorId: 'actor-1',
      occurredFrom: '2026-08-01T13:00:00.000Z',
      occurredTo: '2026-08-02T14:30:00.000Z',
      eventType: 'NIGHTLY_RATE_CHANGED',
      ownerId: 'owner-1',
      catId: 'cat-1',
      stayId: 'stay-1',
      stayFrom: '2026-08-10',
      stayTo: '2026-08-12',
    });
    request.flush({ items: [rateEvent], page: 3, pageSize: 10, totalElements: 31 });
    expect(result).toEqual({
      items: [expect.objectContaining({ previousRate: null, newRate: rateEvent.newRate })],
      page: 3,
      pageSize: 10,
      totalElements: 31,
    });
  });

  it.each([
    [],
    { items: [], page: 0, pageSize: 5, totalElements: 0 },
    { items: [], page: -1, pageSize: 10, totalElements: 0 },
    { items: [], page: 0, pageSize: 10, totalElements: -1 },
    { items: [], page: 1, pageSize: 10, totalElements: 0 },
    { items: [{ ...rateEvent, eventType: 'UNKNOWN' }], page: 0, pageSize: 10, totalElements: 1 },
    { items: [{ ...rateEvent, newRate: 42 }], page: 0, pageSize: 10, totalElements: 1 },
  ])('rejects malformed envelopes and events', (payload) => {
    let error: unknown;
    service
      .getActivity({
        actorId: '',
        occurredFrom: '',
        occurredTo: '',
        eventType: '',
        ownerId: '',
        catId: '',
        stayId: '',
      })
      .subscribe({ error: (value) => (error = value) });
    http
      .expectOne((candidate) => candidate.url.endsWith('/sensitive-economic-activity'))
      .flush(payload);
    expect(error).toBeInstanceOf(MalformedSensitiveActivityError);
  });
});
