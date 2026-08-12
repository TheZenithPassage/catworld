import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';

import {
  MalformedSensitiveActivityError,
  SensitiveEconomicActivityEvent,
} from '../../models/sensitive-economic-activity';
import { SensitiveEconomicActivityApiService } from '../../data-access/sensitive-economic-activity-api.service';
import { SensitiveActivityPage } from './sensitive-activity-page';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { RuntimeConfigService } from '../../../../core/config/runtime-config.service';

describe('SensitiveActivityPage', () => {
  const params = new BehaviorSubject(convertToParamMap({}));
  const api = { getActivity: vi.fn() };
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  let fixture: ComponentFixture<SensitiveActivityPage>;

  const common = {
    occurredAt: '2026-08-01T12:00:00Z',
    actor: { id: 'actor-1', username: 'admin' },
    affectedContext: {
      stayId: 'deleted-stay',
      startAt: '2026-08-01T10:00:00',
      endAt: '2026-08-03T10:00:00',
      cancelledAt: null,
      owner: { id: 'deleted-owner', fullName: 'Ada Owner' },
      cats: [{ id: 'deleted-cat', name: 'Miso' }],
    },
  };
  const events: SensitiveEconomicActivityEvent[] = [
    {
      ...common,
      affectedContext: null,
      eventId: '1',
      eventType: 'NIGHTLY_RATE_CHANGED',
      category: 'ONE_CAT',
      previousRate: null,
      newRate: '9999999999999999999',
    },
    {
      ...common,
      eventId: '2',
      eventType: 'PRICING_OVERRIDE',
      retainedNightlyRate: '10.00',
      numberOfNights: 2,
      agreedAmount: '20.00',
      reason: 'Override',
    },
    {
      ...common,
      eventId: '3',
      eventType: 'AGREED_AMOUNT_CORRECTED',
      previousAgreedAmount: null,
      newAgreedAmount: '21.00',
      reason: 'Correction',
    },
    {
      ...common,
      eventId: '4',
      eventType: 'PAYMENT_EDITED',
      paymentId: 'p1',
      previousAmount: '5.00',
      newAmount: '6.00',
      paymentDate: '2026-08-01',
      note: null,
      registeredBy: common.actor,
      registeredAt: common.occurredAt,
      reason: 'Edit',
    },
    {
      ...common,
      eventId: '5',
      eventType: 'PAYMENT_ANNULLED',
      paymentId: 'p2',
      amount: '6.00',
      paymentDate: '2026-08-01',
      note: 'note',
      registeredBy: common.actor,
      registeredAt: common.occurredAt,
      reason: 'Annul',
    },
    {
      ...common,
      eventId: '6',
      eventType: 'PAYMENT_REMOVED',
      paymentId: 'p3',
      amount: '6.00',
      paymentDate: '2026-08-01',
      note: null,
      registeredBy: common.actor,
      registeredAt: common.occurredAt,
      annulled: true,
      reason: 'Remove',
    },
  ];

  beforeEach(async () => {
    params.next(convertToParamMap({}));
    api.getActivity.mockReset().mockReturnValue(of(events));
    router.navigate.mockClear();
    await TestBed.configureTestingModule({
      imports: [SensitiveActivityPage],
      providers: [
        provideNoopAnimations(),
        { provide: SensitiveEconomicActivityApiService, useValue: api },
        {
          provide: ActivatedRoute,
          useValue: { queryParamMap: params, snapshot: { queryParamMap: params.value } },
        },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
    TestBed.inject(I18nService).language.set('en');
    fixture = TestBed.createComponent(SensitiveActivityPage);
    fixture.detectChanges();
  });

  it('renders every variant once in backend order with exact durable context and no live links', () => {
    const root = fixture.nativeElement as HTMLElement;
    const articles = Array.from(root.querySelectorAll('article'));
    expect(articles).toHaveLength(6);
    expect(
      articles.map((article) => article.querySelector('mat-card-title')?.textContent?.trim()),
    ).toEqual([
      'Nightly rate changed',
      'Pricing override',
      'Agreed amount corrected',
      'Payment edited',
      'Payment annulled',
      'Payment removed',
    ]);
    expect(root.textContent).toContain('9999999999999999999');
    expect(root.textContent).toContain('One cat');
    expect(root.textContent).toContain('10.00');
    expect(root.textContent).toContain('20.00');
    expect(root.textContent).toContain('Override');
    expect(root.textContent).toContain('21.00');
    expect(root.textContent).toContain('Correction');
    expect(root.textContent).toContain('5.00');
    expect(root.textContent).toContain('Edit');
    expect(root.textContent).toContain('Annul');
    expect(root.textContent).toContain('Remove');
    expect(
      Array.from(root.querySelectorAll('.payment-date')).map((date) => date.textContent),
    ).toEqual(['01/08/2026', '01/08/2026', '01/08/2026']);
    expect(root.textContent).toContain('Ada Owner (deleted-owner)');
    expect(root.textContent).toContain('Miso (deleted-cat)');
    expect(root.textContent).toContain('1 Aug 2026, 09:00');
    expect(root.textContent).toContain('1 Aug 2026, 10:00');
    expect(root.textContent).toContain('3 Aug 2026, 10:00');
    expect(root.textContent).not.toContain('2026-08-01T10:00:00');
    expect(root.querySelectorAll('article a')).toHaveLength(0);
  });

  it('reconstructs and submits datetime filters in business time', () => {
    fixture.destroy();
    params.next(convertToParamMap({ occurredFrom: '2026-08-12T13:00:00.000Z' }));
    fixture = TestBed.createComponent(SensitiveActivityPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    expect(component.filters().occurredFrom).toBe('2026-08-12T10:00');
    component.updateFilter('occurredTo', '2026-08-12T11:30');
    component.applyFilters();

    expect(router.navigate).toHaveBeenLastCalledWith(
      [],
      expect.objectContaining({
        queryParams: expect.objectContaining({
          occurredFrom: '2026-08-12T13:00:00.000Z',
          occurredTo: '2026-08-12T14:30:00.000Z',
        }),
      }),
    );
  });

  it('preserves the exact second ambiguous Instant loaded from the query', () => {
    TestBed.inject(RuntimeConfigService).businessTimeZone.set('Europe/Madrid');
    fixture.destroy();
    params.next(convertToParamMap({ occurredFrom: '2026-10-25T01:30:00.000Z' }));

    fixture = TestBed.createComponent(SensitiveActivityPage);
    fixture.detectChanges();

    expect(fixture.componentInstance.filters().occurredFrom).toBe('2026-10-25T02:30');
    expect(api.getActivity).toHaveBeenLastCalledWith(
      expect.objectContaining({ occurredFrom: '2026-10-25T01:30:00.000Z' }),
    );

    fixture.componentInstance.refresh();

    expect(api.getActivity).toHaveBeenLastCalledWith(
      expect.objectContaining({ occurredFrom: '2026-10-25T01:30:00.000Z' }),
    );
  });

  it('accepts an Instant range crossing the DST fallback even when local times look inverted', () => {
    TestBed.inject(RuntimeConfigService).businessTimeZone.set('Europe/Madrid');
    fixture.destroy();
    params.next(
      convertToParamMap({
        occurredFrom: '2026-10-25T00:45:00.000Z',
        occurredTo: '2026-10-25T01:15:00.000Z',
      }),
    );

    fixture = TestBed.createComponent(SensitiveActivityPage);
    fixture.detectChanges();

    expect(fixture.componentInstance.filters()).toEqual(
      expect.objectContaining({
        occurredFrom: '2026-10-25T02:45',
        occurredTo: '2026-10-25T02:15',
      }),
    );
    expect(fixture.componentInstance.invalidPeriod()).toBe(false);
    expect(api.getActivity).toHaveBeenLastCalledWith(
      expect.objectContaining({
        occurredFrom: '2026-10-25T00:45:00.000Z',
        occurredTo: '2026-10-25T01:15:00.000Z',
      }),
    );
  });

  it('applies the normal first-occurrence policy after an ambiguous local time is edited', () => {
    TestBed.inject(RuntimeConfigService).businessTimeZone.set('Europe/Madrid');
    fixture.destroy();
    params.next(convertToParamMap({ occurredFrom: '2026-10-25T01:30:00.000Z' }));
    fixture = TestBed.createComponent(SensitiveActivityPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;
    router.navigate.mockClear();

    component.updateFilter('occurredFrom', '2026-10-25T02:30');
    component.applyFilters();

    expect(router.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: expect.objectContaining({ occurredFrom: '2026-10-25T00:30:00.000Z' }),
      }),
    );
  });

  it('rejects a nonexistent business local time without navigation or another request', () => {
    const config = TestBed.inject(RuntimeConfigService);
    config.businessTimeZone.set('Europe/Madrid');
    const component = fixture.componentInstance;
    const requestsBeforeApply = api.getActivity.mock.calls.length;
    component.updateFilter('occurredFrom', '2026-03-29T02:30');
    fixture.detectChanges();

    expect(() => component.applyFilters()).not.toThrow();
    fixture.detectChanges();

    expect(router.navigate).not.toHaveBeenCalled();
    expect(api.getActivity).toHaveBeenCalledTimes(requestsBeforeApply);
    expect(component.filters().occurredFrom).toBe('2026-03-29T02:30');
    expect(component.invalidBusinessDateTime()).toBe(true);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('[role="alert"]')?.textContent,
    ).toContain(component.text().sensitiveActivity.filters.invalidBusinessDateTime);
  });

  it('changes Instant presentation when runtime business timezone changes', () => {
    const config = TestBed.inject(RuntimeConfigService);
    const component = fixture.componentInstance;
    config.businessTimeZone.set('America/Argentina/Buenos_Aires');
    expect(component.formatDate('2026-08-12T13:00:00Z')).toContain('10:00');

    config.businessTimeZone.set('Europe/Madrid');
    expect(component.formatDate('2026-08-12T13:00:00Z')).toContain('15:00');
  });

  it('presents stay LocalDateTime fields without timezone displacement', () => {
    const component = fixture.componentInstance;
    const config = TestBed.inject(RuntimeConfigService);
    config.businessTimeZone.set('Europe/Madrid');

    expect(component.formatStayDateTime('2026-08-12T23:30:00')).toContain('23:30');
    expect(component.formatStayDateTime('2026-08-13T00:15:00')).toContain('00:15');
  });

  it('localizes payment dates without changing their calendar day', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.language.set('es');
    api.getActivity.mockReturnValue(
      of(
        events.map((event) =>
          'paymentDate' in event ? { ...event, paymentDate: '2026-01-01' } : event,
        ),
      ),
    );
    fixture.destroy();
    fixture = TestBed.createComponent(SensitiveActivityPage);
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(
      Array.from(root.querySelectorAll('.payment-date')).map((date) => date.textContent),
    ).toEqual(['01/01/2026', '01/01/2026', '01/01/2026']);
  });

  it('shows the localized malformed-contract state when temporal parsing fails', () => {
    fixture.destroy();
    api.getActivity.mockReturnValue(
      throwError(() => new MalformedSensitiveActivityError('Invalid timestamp')),
    );
    fixture = TestBed.createComponent(SensitiveActivityPage);
    fixture.detectChanges();

    const alert = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement | null;
    expect(alert?.textContent).toContain('unrecognized format');
    expect(fixture.nativeElement.querySelectorAll('article')).toHaveLength(0);
  });

  it('refreshes the applied query filters instead of unapplied draft edits', () => {
    fixture.destroy();
    params.next(convertToParamMap({ ownerId: 'owner-A' }));
    fixture = TestBed.createComponent(SensitiveActivityPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.updateFilter('ownerId', 'owner-B');
    component.refresh();

    expect(api.getActivity).toHaveBeenLastCalledWith(
      expect.objectContaining({ ownerId: 'owner-A' }),
    );
    expect(params.value.get('ownerId')).toBe('owner-A');
    expect(router.navigate).not.toHaveBeenCalled();

    component.applyFilters();
    expect(router.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: expect.objectContaining({ ownerId: 'owner-B' }) }),
    );
  });
});
