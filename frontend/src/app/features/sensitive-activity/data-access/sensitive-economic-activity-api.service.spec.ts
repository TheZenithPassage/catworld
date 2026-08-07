import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/config/api.config';
import { MalformedSensitiveActivityError } from '../models/sensitive-economic-activity';
import { SensitiveEconomicActivityApiService } from './sensitive-economic-activity-api.service';

describe('SensitiveEconomicActivityApiService', () => {
  let service: SensitiveEconomicActivityApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(SensitiveEconomicActivityApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('serializes all filters and preserves exact nullable money', () => {
    let result: unknown;
    service
      .getActivity({
        actorId: 'actor-1',
        occurredFrom: '2026-08-01T10:00',
        occurredTo: '2026-08-02T11:30',
        eventType: 'NIGHTLY_RATE_CHANGED',
        ownerId: 'owner-1',
        catId: 'cat-1',
        stayId: 'stay-1',
      })
      .subscribe((events) => (result = events));
    const request = http.expectOne((candidate) =>
      candidate.url.endsWith('/sensitive-economic-activity'),
    );
    expect(request.request.params.keys().sort()).toEqual(
      ['actorId', 'occurredFrom', 'occurredTo', 'eventType', 'ownerId', 'catId', 'stayId'].sort(),
    );
    expect(request.request.params.get('occurredFrom')).toContain('2026-08-01T');
    request.flush([
      {
        eventId: 'event-1',
        eventType: 'NIGHTLY_RATE_CHANGED',
        occurredAt: '2026-08-01T12:00:00Z',
        actor: { id: 'actor-1', username: 'admin' },
        affectedContext: null,
        category: 'ONE_CAT',
        previousRate: null,
        newRate: '9999999999999999999',
      },
    ]);
    expect(result).toEqual([
      expect.objectContaining({ previousRate: null, newRate: '9999999999999999999' }),
    ]);
  });

  it('accepts each approved discriminator without reordering', () => {
    let types: string[] = [];
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
      .subscribe((events) => (types = events.map((event) => event.eventType)));
    const common = {
      occurredAt: '2026-08-01T12:00:00Z',
      actor: { id: 'a', username: 'admin' },
    };
    const affectedContext = {
      stayId: 's',
      startAt: '2026-08-01T10:00:00',
      endAt: '2026-08-03T10:00:00',
      cancelledAt: null,
      owner: { id: 'o', fullName: 'Owner' },
      cats: [{ id: 'c', name: 'Cat' }],
    };
    const payment = {
      paymentId: 'p',
      paymentDate: '2026-08-01',
      note: null,
      registeredBy: common.actor,
      registeredAt: common.occurredAt,
      reason: 'reason',
    };
    http.expectOne(`${API_BASE_URL}/sensitive-economic-activity`).flush([
      {
        ...common,
        eventId: '1',
        eventType: 'NIGHTLY_RATE_CHANGED',
        affectedContext: null,
        category: 'ONE_CAT',
        previousRate: '1',
        newRate: '2',
      },
      {
        ...common,
        affectedContext,
        eventId: '2',
        eventType: 'PRICING_OVERRIDE',
        retainedNightlyRate: '2',
        numberOfNights: 3,
        agreedAmount: '6',
        reason: 'reason',
      },
      {
        ...common,
        affectedContext,
        eventId: '3',
        eventType: 'AGREED_AMOUNT_CORRECTED',
        previousAgreedAmount: null,
        newAgreedAmount: '7',
        reason: 'reason',
      },
      {
        ...common,
        affectedContext,
        ...payment,
        eventId: '4',
        eventType: 'PAYMENT_EDITED',
        previousAmount: '1',
        newAmount: '2',
      },
      {
        ...common,
        affectedContext,
        ...payment,
        eventId: '5',
        eventType: 'PAYMENT_ANNULLED',
        amount: '2',
      },
      {
        ...common,
        affectedContext,
        ...payment,
        eventId: '6',
        eventType: 'PAYMENT_REMOVED',
        amount: '2',
        annulled: true,
      },
    ]);
    expect(types).toEqual([
      'NIGHTLY_RATE_CHANGED',
      'PRICING_OVERRIDE',
      'AGREED_AMOUNT_CORRECTED',
      'PAYMENT_EDITED',
      'PAYMENT_ANNULLED',
      'PAYMENT_REMOVED',
    ]);
  });

  it.each([
    [{ eventType: 'UNKNOWN' }],
    [{ eventType: 'NIGHTLY_RATE_CHANGED', newRate: 123 }],
    [
      {
        eventId: 'event-1',
        eventType: 'NIGHTLY_RATE_CHANGED',
        occurredAt: '2026-08-01T12:00:00Z',
        actor: { id: 'actor-1', username: 'admin' },
        affectedContext: null,
        category: 'UNKNOWN_CATEGORY',
        previousRate: null,
        newRate: '1',
      },
    ],
    [
      {
        eventId: 'event-1',
        eventType: 'PRICING_OVERRIDE',
        occurredAt: '2026-08-01T12:00:00Z',
        actor: { id: 'actor-1', username: 'admin' },
        affectedContext: null,
        retainedNightlyRate: '1',
        numberOfNights: 1,
        agreedAmount: '1',
        reason: 'reason',
      },
    ],
    { eventType: 'NIGHTLY_RATE_CHANGED' },
  ])('rejects malformed responses', (payload) => {
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
    http.expectOne(`${API_BASE_URL}/sensitive-economic-activity`).flush(payload);
    expect(error).toBeInstanceOf(MalformedSensitiveActivityError);
  });
});
