import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSelectHarness } from '@angular/material/select/testing';
import { ActivityLookupService, StayLookup } from '../../data-access/activity-lookup.service';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { Subject } from 'rxjs';

import {
  MalformedSensitiveActivityError,
  SensitiveEconomicActivityEvent,
} from '../../models/sensitive-economic-activity';
import { SensitiveEconomicActivityApiService } from '../../data-access/sensitive-economic-activity-api.service';
import { SensitiveActivityPage } from './sensitive-activity-page';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { RuntimeConfigService } from '../../../../core/config/runtime-config.service';
import { MatDialog } from '@angular/material/dialog';
import { OverviewPage } from '../../../../shared/pagination/overview-page';

describe('SensitiveActivityPage', () => {
  const params = new BehaviorSubject(convertToParamMap({}));
  const api = { getActivity: vi.fn() };
  const router = { navigate: vi.fn().mockResolvedValue(true) };
  const dialog = { open: vi.fn() };
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
    api.getActivity
      .mockReset()
      .mockReturnValue(of({ items: events, page: 0, pageSize: 10, totalElements: events.length }));
    dialog.open.mockReset();
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
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();
    TestBed.inject(I18nService).language.set('en');
    fixture = TestBed.createComponent(SensitiveActivityPage);
    fixture.detectChanges();
  });

  it('renders compact durable summaries in backend order and opens loaded detail directly', () => {
    const root = fixture.nativeElement as HTMLElement;
    const articles = Array.from(root.querySelectorAll('article'));
    expect(articles).toHaveLength(6);
    expect(articles.map((article) => article.querySelector('strong')?.textContent?.trim())).toEqual(
      [
        'Nightly rate changed',
        'Pricing override',
        'Agreed amount corrected',
        'Payment edited',
        'Payment annulled',
        'Payment removed',
      ],
    );
    expect(root.textContent).toContain('9999999999999999999');
    expect(root.textContent).toContain('One cat');
    expect(root.textContent).toContain('Ada Owner');
    expect(root.textContent).toContain('Miso');
    expect(root.textContent).toContain('1 Aug 2026, 09:00');
    expect(root.textContent).toContain('1 Aug 2026, 10:00');
    expect(root.textContent).toContain('3 Aug 2026, 10:00');
    expect(root.textContent).not.toContain('2026-08-01T10:00:00');
    expect(root.querySelectorAll('article a')).toHaveLength(0);

    articles[3].click();
    expect(dialog.open).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ data: events[3], restoreFocus: true }),
    );
    expect(api.getActivity).toHaveBeenCalledTimes(1);
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
      0,
    );

    fixture.componentInstance.refresh();

    expect(api.getActivity).toHaveBeenLastCalledWith(
      expect.objectContaining({ occurredFrom: '2026-10-25T01:30:00.000Z' }),
      0,
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
    expect(fixture.componentInstance.filterErrors().occurredTo).toBeNull();
    expect(api.getActivity).toHaveBeenLastCalledWith(
      expect.objectContaining({
        occurredFrom: '2026-10-25T00:45:00.000Z',
        occurredTo: '2026-10-25T01:15:00.000Z',
      }),
      0,
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

    const root = fixture.nativeElement as HTMLElement;
    expect(component.pendingChanges()).toBe(false);
    expect(root.querySelector('.activity-list')).not.toBeNull();
    component.updateFilter('occurredFrom', '2026-10-25T02:31');
    component.updateFilter('occurredFrom', '2026-10-25T02:30');
    fixture.detectChanges();
    expect(component.pendingChanges()).toBe(true);
    expect(component.filterSummary()).toContain('When applied');
    expect(root.querySelector('.activity-list')).toBeNull();
    expect(root.querySelector('#sensitive-activity-state mat-paginator')).toBeNull();
    component.applyFilters();

    expect(router.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: expect.objectContaining({ occurredFrom: '2026-10-25T00:30:00.000Z' }),
      }),
    );
    params.next(convertToParamMap({ occurredFrom: '2026-10-25T00:30:00Z' }));
    fixture.detectChanges();
    const requests = api.getActivity.mock.calls.length;
    component.updateFilter('occurredFrom', '2026-10-25T02:31');
    fixture.detectChanges();
    component.updateFilter('occurredFrom', '2026-10-25T02:30');
    fixture.detectChanges();
    expect(component.pendingChanges()).toBe(false);
    expect(component.filterSummary()).toContain('Showing');
    expect(root.querySelector('.activity-list')).not.toBeNull();
    expect(api.getActivity).toHaveBeenCalledTimes(requests);
  });

  it('shows an invalid range only on To and preserves the loaded results', () => {
    const component = fixture.componentInstance;
    const requestsBeforeApply = api.getActivity.mock.calls.length;
    component.updateFilter('occurredFrom', '2026-08-12T11:00');
    component.updateFilter('occurredTo', '2026-08-12T10:00');

    component.applyFilters();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(component.filterErrors().occurredFrom).toBeNull();
    expect(component.filterErrors().occurredTo).toBe('invalidPeriod');
    expect(fieldFor(root, 'occurredFrom').classList.contains('mat-form-field-invalid')).toBe(false);
    expect(fieldFor(root, 'occurredTo').classList.contains('mat-form-field-invalid')).toBe(true);
    expect(fieldFor(root, 'occurredTo').querySelector('mat-error')?.textContent).toContain(
      component.text().sensitiveActivity.filters.invalidPeriod,
    );
    expect(router.navigate).not.toHaveBeenCalled();
    expect(api.getActivity).toHaveBeenCalledTimes(requestsBeforeApply);
    expect(root.querySelectorAll('.activity-list article')).toHaveLength(0);
    expect(fixture.componentInstance.events()).toHaveLength(events.length);
    expect(root.textContent).not.toContain(component.text().sensitiveActivity.retry);
    expect(component.filters()).toEqual(
      expect.objectContaining({
        occurredFrom: '2026-08-12T11:00',
        occurredTo: '2026-08-12T10:00',
      }),
    );
  });

  it('shows a nonexistent business time only on From', () => {
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
    const root = fixture.nativeElement as HTMLElement;
    expect(component.filterErrors().occurredFrom).toBe('nonexistentBusinessTime');
    expect(component.filterErrors().occurredTo).toBeNull();
    expect(fieldFor(root, 'occurredFrom').classList.contains('mat-form-field-invalid')).toBe(true);
    expect(fieldFor(root, 'occurredTo').classList.contains('mat-form-field-invalid')).toBe(false);
    expect(fieldFor(root, 'occurredFrom').querySelector('mat-error')?.textContent).toContain(
      component.text().sensitiveActivity.filters.invalidBusinessDateTime,
    );
  });

  it('shows a nonexistent business time only on To', () => {
    TestBed.inject(RuntimeConfigService).businessTimeZone.set('Europe/Madrid');
    const component = fixture.componentInstance;
    const requestsBeforeApply = api.getActivity.mock.calls.length;
    component.updateFilter('occurredTo', '2026-03-29T02:30');

    component.applyFilters();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(component.filterErrors().occurredFrom).toBeNull();
    expect(component.filterErrors().occurredTo).toBe('nonexistentBusinessTime');
    expect(fieldFor(root, 'occurredFrom').classList.contains('mat-form-field-invalid')).toBe(false);
    expect(fieldFor(root, 'occurredTo').classList.contains('mat-form-field-invalid')).toBe(true);
    expect(fieldFor(root, 'occurredTo').querySelector('mat-error')?.textContent).toContain(
      component.text().sensitiveActivity.filters.invalidBusinessDateTime,
    );
    expect(router.navigate).not.toHaveBeenCalled();
    expect(api.getActivity).toHaveBeenCalledTimes(requestsBeforeApply);
    expect(component.filters().occurredTo).toBe('2026-03-29T02:30');
  });

  it('shows a malformed datetime only on its field without replacing loaded results', () => {
    const component = fixture.componentInstance;
    const requestsBeforeApply = api.getActivity.mock.calls.length;
    component.updateFilter('occurredFrom', '55555-08-09T05:55');

    expect(() => component.applyFilters()).not.toThrow();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(component.filterErrors().occurredFrom).toBe('invalidDateTime');
    expect(component.filterErrors().occurredTo).toBeNull();
    expect(fieldFor(root, 'occurredFrom').classList.contains('mat-form-field-invalid')).toBe(true);
    expect(fieldFor(root, 'occurredTo').classList.contains('mat-form-field-invalid')).toBe(false);
    expect(fieldFor(root, 'occurredFrom').querySelector('mat-error')?.textContent).toContain(
      component.text().sensitiveActivity.filters.invalidDateTime,
    );
    expect(component.filters().occurredFrom).toBe('55555-08-09T05:55');
    expect(router.navigate).not.toHaveBeenCalled();
    expect(api.getActivity).toHaveBeenCalledTimes(requestsBeforeApply);
    expect(root.querySelectorAll('.activity-list article')).toHaveLength(0);
    expect(fixture.componentInstance.events()).toHaveLength(events.length);
  });

  it('blocks a partial datetime-local rejected on blur without replacing results', () => {
    const requestsBeforeApply = api.getActivity.mock.calls.length;
    const root = fixture.nativeElement as HTMLElement;
    const from = root.querySelector('#sensitive-occurred-from') as HTMLInputElement;
    const fromControl = fixture.componentInstance.filters().occurredFrom;
    expect(fromControl).toBe('');
    expect(from.getAttribute('aria-invalid')).toBe('false');

    let badInput = false;
    Object.defineProperty(from, 'validity', {
      configurable: true,
      get: () => ({ badInput }) as ValidityState,
    });
    badInput = true;
    from.dispatchEvent(new Event('blur'));
    fixture.detectChanges();

    expect(fixture.componentInstance.filters().occurredFrom).toBe('');
    expect(from.getAttribute('aria-invalid')).toBe('true');

    (root.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    const component = fixture.componentInstance;
    expect(component.filterErrors().occurredFrom).toBe('invalidDateTime');
    expect(component.filterErrors().occurredTo).toBeNull();
    expect(fieldFor(root, 'occurredFrom').classList.contains('mat-form-field-invalid')).toBe(true);
    expect(fieldFor(root, 'occurredTo').classList.contains('mat-form-field-invalid')).toBe(false);
    expect(fieldFor(root, 'occurredFrom').querySelector('mat-error')?.textContent).toContain(
      component.text().sensitiveActivity.filters.invalidDateTime,
    );
    expect(router.navigate).not.toHaveBeenCalled();
    expect(api.getActivity).toHaveBeenCalledTimes(requestsBeforeApply);
    expect(root.querySelectorAll('.activity-list article')).toHaveLength(0);
    expect(fixture.componentInstance.events()).toHaveLength(events.length);

    badInput = false;
    from.dispatchEvent(new Event('blur'));
    (root.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(component.filterErrors().occurredFrom).toBeNull();
    expect(fieldFor(root, 'occurredFrom').classList.contains('mat-form-field-invalid')).toBe(false);
    expect(fieldFor(root, 'occurredFrom').querySelector('mat-error')).toBeNull();
    expect(api.getActivity).toHaveBeenCalledTimes(requestsBeforeApply + 1);
  });

  it('shows invalid identifier feedback without replacing loaded results', () => {
    const component = fixture.componentInstance;
    const requestsBeforeApply = api.getActivity.mock.calls.length;
    component.updateFilter('actorId', '9');

    component.applyFilters();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(component.filterErrors().actorId).toBe('invalidUuid');
    expect(root.querySelector('.identifier-error')?.textContent).toContain(
      component.text().sensitiveActivity.filters.invalidId,
    );
    expect(router.navigate).not.toHaveBeenCalled();
    expect(api.getActivity).toHaveBeenCalledTimes(requestsBeforeApply);
    expect(root.querySelectorAll('.activity-list article')).toHaveLength(0);
    expect(fixture.componentInstance.events()).toHaveLength(events.length);
    expect(root.textContent).not.toContain(component.text().sensitiveActivity.retry);
  });

  it('applies a valid UUID filter normally', () => {
    const component = fixture.componentInstance;
    const actorId = '1bc4c0d4-161c-4692-876b-3b1480338445';
    component.updateFilter('actorId', actorId);

    component.applyFilters();

    expect(component.filterErrors().actorId).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: expect.objectContaining({ actorId }) }),
    );
  });

  it('rejects an invalid UUID reconstructed from query params without requesting', () => {
    fixture.destroy();
    api.getActivity.mockClear();
    params.next(convertToParamMap({ actorId: '9' }));
    fixture = TestBed.createComponent(SensitiveActivityPage);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    expect(api.getActivity).not.toHaveBeenCalled();
    expect(component.filters().actorId).toBe('9');
    expect(component.filterErrors().actorId).toBe('invalidUuid');
    expect(root.querySelector('.identifier-error')?.textContent).toContain(
      component.text().sensitiveActivity.filters.invalidId,
    );
    expect(root.textContent).not.toContain(component.text().sensitiveActivity.retry);

    component.refresh();
    expect(api.getActivity).not.toHaveBeenCalled();
  });

  it('rejects an invalid occurredFrom query param contextually without requesting', () => {
    fixture.destroy();
    api.getActivity.mockClear();
    params.next(convertToParamMap({ occurredFrom: 'not-an-instant' }));
    fixture = TestBed.createComponent(SensitiveActivityPage);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    expect(api.getActivity).not.toHaveBeenCalled();
    expect(component.appliedFilters().occurredFrom).toBe('not-an-instant');
    expect(component.filterErrors().occurredFrom).toBe('invalidDateTime');
    expect(component.filterErrors().occurredTo).toBeNull();
    expect(fieldFor(root, 'occurredFrom').classList.contains('mat-form-field-invalid')).toBe(true);
    expect(fieldFor(root, 'occurredTo').classList.contains('mat-form-field-invalid')).toBe(false);
    expect(fieldFor(root, 'occurredFrom').querySelector('mat-error')?.textContent).toContain(
      component.text().sensitiveActivity.filters.invalidDateTime,
    );
    expect(component.loadError()).toBeNull();
    expect(root.textContent).not.toContain(component.text().sensitiveActivity.retry);

    component.refresh();
    expect(api.getActivity).not.toHaveBeenCalled();
  });

  it('rejects an invalid occurredTo query param only on To without requesting', () => {
    fixture.destroy();
    api.getActivity.mockClear();
    params.next(convertToParamMap({ occurredTo: 'not-an-instant' }));
    fixture = TestBed.createComponent(SensitiveActivityPage);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    expect(api.getActivity).not.toHaveBeenCalled();
    expect(component.appliedFilters().occurredTo).toBe('not-an-instant');
    expect(component.filterErrors().occurredFrom).toBeNull();
    expect(component.filterErrors().occurredTo).toBe('invalidDateTime');
    expect(fieldFor(root, 'occurredFrom').classList.contains('mat-form-field-invalid')).toBe(false);
    expect(fieldFor(root, 'occurredTo').classList.contains('mat-form-field-invalid')).toBe(true);
    expect(fieldFor(root, 'occurredTo').querySelector('mat-error')?.textContent).toContain(
      component.text().sensitiveActivity.filters.invalidDateTime,
    );
    expect(component.loadError()).toBeNull();
    expect(root.textContent).not.toContain(component.text().sensitiveActivity.retry);
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
    const ownerA = '11111111-1111-1111-1111-111111111111';
    const ownerB = '22222222-2222-2222-2222-222222222222';
    fixture.destroy();
    params.next(convertToParamMap({ ownerId: ownerA }));
    fixture = TestBed.createComponent(SensitiveActivityPage);
    fixture.detectChanges();
    const component = fixture.componentInstance;

    component.updateFilter('ownerId', ownerB);
    component.refresh();

    expect(api.getActivity).toHaveBeenLastCalledWith(
      expect.objectContaining({ ownerId: ownerA }),
      0,
    );
    expect(params.value.get('ownerId')).toBe(ownerA);
    expect(router.navigate).not.toHaveBeenCalled();

    component.applyFilters();
    expect(router.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({ queryParams: expect.objectContaining({ ownerId: ownerB }) }),
    );
  });

  it('loads the URL page, preserves filters in paginator navigation, and resets page on apply', () => {
    fixture.destroy();
    const ownerId = '11111111-1111-1111-1111-111111111111';
    params.next(convertToParamMap({ ownerId, page: '2' }));
    api.getActivity.mockReturnValue(
      of({ items: [events[0]], page: 2, pageSize: 10, totalElements: 26 }),
    );
    fixture = TestBed.createComponent(SensitiveActivityPage);
    fixture.detectChanges();

    expect(api.getActivity).toHaveBeenLastCalledWith(expect.objectContaining({ ownerId }), 2);
    expect(fixture.nativeElement.querySelector('mat-paginator')).not.toBeNull();
    fixture.componentInstance.pageChanged({ pageIndex: 1 } as never);
    expect(router.navigate).toHaveBeenLastCalledWith(
      [],
      expect.objectContaining({ queryParams: expect.objectContaining({ ownerId, page: '1' }) }),
    );

    router.navigate.mockClear();
    fixture.componentInstance.updateFilter('eventType', 'PAYMENT_EDITED');
    fixture.componentInstance.applyFilters();
    expect(router.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: expect.not.objectContaining({ page: expect.anything() }),
      }),
    );
  });

  it('reloads the last valid page when the URL page is impossible', () => {
    fixture.destroy();
    params.next(convertToParamMap({ eventType: 'PAYMENT_EDITED', page: '8' }));
    api.getActivity.mockReturnValue(of({ items: [], page: 8, pageSize: 10, totalElements: 24 }));
    fixture = TestBed.createComponent(SensitiveActivityPage);
    fixture.detectChanges();

    expect(router.navigate).toHaveBeenLastCalledWith(
      [],
      expect.objectContaining({
        queryParams: { eventType: 'PAYMENT_EDITED', page: '2' },
        replaceUrl: true,
      }),
    );
  });

  it('prevents a superseded page response from replacing active state', () => {
    fixture.destroy();
    const first = new Subject<OverviewPage<SensitiveEconomicActivityEvent>>();
    const second = new Subject<OverviewPage<SensitiveEconomicActivityEvent>>();
    api.getActivity.mockReturnValueOnce(first).mockReturnValueOnce(second);
    params.next(convertToParamMap({ page: '1' }));
    fixture = TestBed.createComponent(SensitiveActivityPage);
    fixture.detectChanges();
    params.next(convertToParamMap({ page: '2' }));
    second.next({ items: [events[1]], page: 2, pageSize: 10, totalElements: 30 });
    first.next({ items: [events[0]], page: 1, pageSize: 10, totalElements: 30 });
    fixture.detectChanges();

    expect(fixture.componentInstance.events()).toEqual([events[1]]);
    expect(fixture.componentInstance.page()).toBe(2);
  });

  it.each(['Enter', ' '])('opens detail with %s without requesting again', (key) => {
    const before = api.getActivity.mock.calls.length;
    fixture.componentInstance.activateDetail(
      { key, preventDefault: vi.fn() } as unknown as KeyboardEvent,
      events[0],
    );
    expect(dialog.open).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ data: events[0] }),
    );
    expect(api.getActivity).toHaveBeenCalledTimes(before);
  });

  function fieldFor(root: HTMLElement, name: string): HTMLElement {
    const input = root.querySelector(`[name="${name}"]`);
    const field = input?.closest('mat-form-field');
    if (!(field instanceof HTMLElement)) throw new Error(`Missing field: ${name}`);
    return field;
  }
  const lookupStay: StayLookup = {
    stayId: '11111111-1111-1111-1111-111111111111',
    startAt: '2026-08-10T10:00:00',
    endAt: '2026-08-12T10:00:00',
    owner: { id: '22222222-2222-2222-2222-222222222222', fullName: 'Current Owner' },
    cats: [{ id: '33333333-3333-3333-3333-333333333333', name: 'Current Cat' }],
  };
  function button(label: string): HTMLButtonElement {
    const root = fixture.nativeElement as HTMLElement;
    const found = Array.from(root.querySelectorAll('button')).find(
      (b) => b.textContent?.trim() === label,
    );
    if (!found) throw new Error('Missing button: ' + label);
    return found;
  }
  async function dateInput(name: string, value: string) {
    const input = (
      name === 'stayFrom' || name === 'stayTo'
        ? fixture.nativeElement.querySelectorAll('app-stay-date-filters input')[
            name === 'stayFrom' ? 0 : 1
          ]
        : fixture.nativeElement.querySelector('[name="' + name + '"]')
    ) as HTMLInputElement;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('groups filters and disables explicit Stay search until usable dates exist', async () => {
    const search = vi.spyOn(TestBed.inject(ActivityLookupService), 'searchStays');
    const root = fixture.nativeElement as HTMLElement;
    expect(
      Array.from(root.querySelectorAll('.filter-group h3')).map((h) => h.textContent?.trim()),
    ).toEqual(['Event moment', 'Stay period']);
    expect(root.querySelectorAll('app-remote-entity-selector')).toHaveLength(3);
    expect(root.querySelector('[name="actorId"]')).toBeNull();
    expect(button('Find specific stay').disabled).toBe(true);
    expect(root.textContent).toContain('Choose an Owner, Cat or valid Stay dates');
    await dateInput('stayFrom', '2026-08-12');
    expect(button('Find specific stay').disabled).toBe(false);
    await dateInput('stayTo', '2026-08-10');
    button('Find specific stay').click();
    fixture.detectChanges();
    expect(root.querySelector('app-stay-date-filters mat-error')).not.toBeNull();
    button('Apply filters').click();
    fixture.detectChanges();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(search).not.toHaveBeenCalled();
  });

  it('keeps explicit candidate selection, Change, removal and unrelated edits independent from search', async () => {
    const search = vi
      .spyOn(TestBed.inject(ActivityLookupService), 'searchStays')
      .mockReturnValue(of({ items: [lookupStay], page: 0, pageSize: 5, totalElements: 1 }));
    await dateInput('stayFrom', '2026-08-10');
    expect(search).not.toHaveBeenCalled();
    button('Find specific stay').click();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('#stay-candidates')?.textContent).toContain('Current Owner');
    expect(root.querySelector('#stay-candidates strong')?.textContent).toContain('10 Aug 2026');
    expect(fixture.componentInstance.filters().stayId).toBe('');
    button('Select').click();
    fixture.detectChanges();
    expect(root.querySelector('#stay-candidates')).toBeNull();
    expect(root.querySelector('.exact-stay')?.textContent).toContain('Current Cat');
    fixture.componentInstance.updateFilter('eventType', 'PAYMENT_EDITED');
    fixture.componentInstance.updateFilter('occurredFrom', '2026-08-01T10:00');
    fixture.detectChanges();
    button('Change').click();
    fixture.detectChanges();
    expect(search).toHaveBeenCalledTimes(1);
    expect(root.querySelector('#stay-candidates')).not.toBeNull();
    button('Select').click();
    fixture.detectChanges();
    button('Remove exact stay').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.filters().stayId).toBe('');
    expect(fixture.componentInstance.filters().stayFrom).toBe('2026-08-10');
    expect(search).toHaveBeenCalledTimes(1);
  });

  it('contains candidate loading, failure, retry, paging and empty states and rejects stale results', async () => {
    const response = new Subject<{
      items: StayLookup[];
      page: number;
      pageSize: number;
      totalElements: number;
    }>();
    const search = vi
      .spyOn(TestBed.inject(ActivityLookupService), 'searchStays')
      .mockReturnValue(response);
    await dateInput('stayTo', '2026-08-12');
    button('Find specific stay').click();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('#stay-candidates')?.textContent).toContain('Loading stays');
    response.error(new Error('offline'));
    fixture.detectChanges();
    expect(root.querySelector('#stay-candidates')?.textContent).toContain('Could not load stays');
    search.mockReturnValue(of({ items: [lookupStay], page: 0, pageSize: 5, totalElements: 6 }));
    button('Retry').click();
    fixture.detectChanges();
    search.mockReturnValue(of({ items: [], page: 1, pageSize: 5, totalElements: 6 }));
    const next = root.querySelector(
      '#stay-candidates button[aria-label="Next page"]',
    ) as HTMLButtonElement;
    expect(next).not.toBeNull();
    next.click();
    fixture.detectChanges();
    expect(root.querySelector('#stay-candidates')?.textContent).toContain('No matching stays');
    const late = new Subject<{
      items: StayLookup[];
      page: number;
      pageSize: number;
      totalElements: number;
    }>();
    search.mockReturnValue(late);
    button('Find specific stay').click();
    fixture.detectChanges();
    await dateInput('stayTo', '2026-08-13');
    late.next({ items: [lookupStay], page: 0, pageSize: 5, totalElements: 1 });
    fixture.detectChanges();
    expect(root.querySelector('#stay-candidates')).toBeNull();
    expect(root.querySelector('.exact-stay')).toBeNull();
  });

  it('preserves candidates when Apply updates the URL and Refresh uses applied dates', async () => {
    const search = vi
      .spyOn(TestBed.inject(ActivityLookupService), 'searchStays')
      .mockReturnValue(of({ items: [lookupStay], page: 0, pageSize: 5, totalElements: 1 }));
    await dateInput('stayFrom', '2026-08-10');
    button('Find specific stay').click();
    fixture.detectChanges();
    button('Select').click();
    fixture.detectChanges();
    button('Apply filters').click();
    fixture.detectChanges();
    const query = router.navigate.mock.calls.at(-1)?.[1].queryParams;
    expect(query).toMatchObject({ stayFrom: '2026-08-10', stayId: lookupStay.stayId });
    params.next(convertToParamMap(query));
    fixture.detectChanges();
    button('Change').click();
    fixture.detectChanges();
    expect(search).toHaveBeenCalledTimes(1);
    button('Apply filters').click();
    fixture.detectChanges();
    expect(api.getActivity).toHaveBeenLastCalledWith(
      expect.objectContaining({ stayFrom: '2026-08-10', stayId: lookupStay.stayId }),
      0,
    );
    button('Clear filters').click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('#stay-candidates')).toBeNull();
    expect(router.navigate).toHaveBeenLastCalledWith(
      [],
      expect.objectContaining({ queryParams: {} }),
    );
  });

  it('resolves URL actor and exact Stay labels without searching or displaying UUIDs', async () => {
    const lookup = TestBed.inject(ActivityLookupService);
    vi.spyOn(lookup, 'resolve').mockReturnValue(
      of({ id: lookupStay.owner.id, username: 'Disabled Actor' }),
    );
    vi.spyOn(lookup, 'resolveStay').mockReturnValue(of(lookupStay));
    const search = vi.spyOn(lookup, 'searchStays');
    params.next(
      convertToParamMap({
        actorId: lookupStay.owner.id,
        stayId: lookupStay.stayId,
        stayFrom: '2026-08-10',
      }),
    );
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(
      (root.querySelector('.primary-event app-remote-entity-selector input') as HTMLInputElement)
        .value,
    ).toBe('Disabled Actor');
    expect(root.querySelector('.exact-stay')?.textContent).toContain('Current Owner');
    expect(root.textContent).not.toContain(lookupStay.stayId);
    expect(search).not.toHaveBeenCalled();
  });

  it('clears the opposite selected entity while typed text contributes no ID or automatic Stay search', async () => {
    const c = fixture.componentInstance;
    const search = vi.spyOn(TestBed.inject(ActivityLookupService), 'searchStays');
    c.ownerSelector()?.select({
      id: lookupStay.owner.id,
      fullName: 'Current Owner',
      currentCats: [],
    });
    fixture.detectChanges();
    expect(c.filters().ownerId).toBe(lookupStay.owner.id);
    c.catSelector()?.select({
      id: lookupStay.cats[0].id,
      name: 'Current Cat',
      ownerId: lookupStay.owner.id,
      ownerName: 'Current Owner',
    });
    fixture.detectChanges();
    const inputs = fixture.nativeElement.querySelectorAll(
      'app-remote-entity-selector input',
    ) as NodeListOf<HTMLInputElement>;
    expect(inputs[0].value).toBe('');
    expect(inputs[1].value).toContain('Current Cat');
    expect(c.filters().ownerId).toBe('');
    expect(c.filters().catId).toBe(lookupStay.cats[0].id);
    inputs[1].value = 'Unselected';
    inputs[1].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(c.filters().catId).toBe('');
    button('Find specific stay').click();
    fixture.detectChanges();
    expect(c.catSelector()?.valid()).toBe(false);
    expect(search).not.toHaveBeenCalled();
    c.ownerSelector()?.select({
      id: lookupStay.owner.id,
      fullName: 'Current Owner',
      currentCats: [],
    });
    fixture.detectChanges();
    expect(inputs[1].value).toBe('');
    expect(inputs[0].value).toBe('Current Owner');
  });
  it('keeps advanced Stay controls collapsed and restores retained results when draft edits are undone', async () => {
    const c = fixture.componentInstance;
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('details')?.open).toBe(false);
    expect(root.querySelector('app-stay-date-filters')).not.toBeNull();
    expect(root.querySelector('mat-select[name="eventType"]')).not.toBeNull();
    expect(
      Array.from(root.querySelectorAll('button')).some((b) => b.textContent?.trim() === 'Refresh'),
    ).toBe(false);
    const requests = api.getActivity.mock.calls.length;
    c.updateFilter('eventType', 'PAYMENT_EDITED');
    fixture.detectChanges();
    expect(root.querySelector('.activity-list')).toBeNull();
    expect(root.querySelector('#sensitive-activity-state mat-paginator')).toBeNull();
    expect(root.querySelector('.pending-state')?.textContent).toContain(
      'Apply filters to update the results.',
    );
    expect(root.querySelector('.pending-state button')).toBeNull();
    c.updateFilter('eventType', '');
    fixture.detectChanges();
    expect(root.querySelectorAll('.activity-list article')).toHaveLength(events.length);
    expect(api.getActivity).toHaveBeenCalledTimes(requests);
    c.applyFilters();
    expect(api.getActivity).toHaveBeenCalledTimes(requests + 1);
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('restores selector presentation and retained result visibility when URL navigation replaces unresolved text', async () => {
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector('app-remote-entity-selector input') as HTMLInputElement;
    input.value = 'unresolved actor';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(root.querySelector('.pending-state')).not.toBeNull();

    params.next(convertToParamMap({ eventType: 'PAYMENT_EDITED' }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(input.value).toBe('');
    expect(root.querySelector('.pending-state')).toBeNull();
    expect(root.querySelectorAll('.activity-list article')).toHaveLength(events.length);
    expect(api.getActivity).toHaveBeenLastCalledWith(
      expect.objectContaining({ eventType: 'PAYMENT_EDITED', actorId: '' }),
      0,
    );
  });

  it('blocks unresolved selector submission but ignores Actor for candidate search', async () => {
    const c = fixture.componentInstance;
    const search = vi
      .spyOn(TestBed.inject(ActivityLookupService), 'searchStays')
      .mockReturnValue(of({ items: [], page: 0, pageSize: 5, totalElements: 0 }));
    await dateInput('stayFrom', '2026-08-10');
    const inputs = fixture.nativeElement.querySelectorAll('app-remote-entity-selector input');
    inputs[2].value = 'unresolved actor';
    inputs[2].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    c.applyFilters();
    fixture.detectChanges();
    expect(router.navigate).not.toHaveBeenCalled();
    expect(c.actorSelector()?.submitted()).toBe(true);
    expect(
      fixture.nativeElement.querySelector('app-remote-entity-selector mat-error'),
    ).not.toBeNull();
    c.findStay();
    expect(search).toHaveBeenCalledTimes(1);
    inputs[0].value = 'unresolved owner';
    inputs[0].dispatchEvent(new Event('input'));
    fixture.detectChanges();
    c.findStay();
    fixture.detectChanges();
    expect(search).toHaveBeenCalledTimes(1);
    expect(c.ownerSelector()?.submitted()).toBe(true);
  });

  it.each(['OVERLAPS', 'STAY_WITHIN_RANGE', 'RANGE_WITHIN_STAY'] as const)(
    'applies %s identically to URL activity state and candidate requests',
    async (mode) => {
      const c = fixture.componentInstance;
      const search = vi
        .spyOn(TestBed.inject(ActivityLookupService), 'searchStays')
        .mockReturnValue(of({ items: [lookupStay], page: 0, pageSize: 5, totalElements: 1 }));
      await dateInput('stayFrom', '2026-08-10');
      c.stayDates()?.setMode(mode);
      fixture.detectChanges();
      c.findStay();
      expect(search).toHaveBeenLastCalledWith(
        expect.objectContaining({ dateFrom: '2026-08-10', dateMatchMode: mode }),
        0,
      );
      c.applyFilters();
      const query = router.navigate.mock.calls.at(-1)?.[1].queryParams;
      expect(query).toMatchObject({ stayFrom: '2026-08-10', stayDateMatchMode: mode });
      params.next(convertToParamMap(query));
      fixture.detectChanges();
      expect(api.getActivity).toHaveBeenLastCalledWith(
        expect.objectContaining({ stayDateMatchMode: mode }),
        0,
      );
      expect(fixture.nativeElement.querySelector('.filter-summary')).not.toBeNull();
      c.selectStay(lookupStay);
      c.stayDates()?.setMode(mode === 'OVERLAPS' ? 'STAY_WITHIN_RANGE' : 'OVERLAPS');
      fixture.detectChanges();
      expect(c.filters().stayId).toBe('');
      expect(c.candidates()).toEqual([]);
      expect(search).toHaveBeenCalledTimes(1);
    },
  );

  it('normalizes old date URLs to explicit overlap requests and retains submit-only shared date errors', async () => {
    params.next(convertToParamMap({ stayFrom: '2026-08-10' }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(api.getActivity).toHaveBeenLastCalledWith(
      expect.objectContaining({ stayDateMatchMode: 'OVERLAPS' }),
      0,
    );
    const c = fixture.componentInstance;
    const input = fixture.nativeElement.querySelector(
      'app-stay-date-filters input',
    ) as HTMLInputElement;
    input.value = '';
    let partial = true;
    Object.defineProperty(input, 'validity', {
      configurable: true,
      get: () => ({ badInput: partial, valid: !partial }),
    });
    expect(() => {
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
    }).not.toThrow();
    expect(fixture.nativeElement.querySelector('app-stay-date-filters mat-error')).toBeNull();
    const requests = api.getActivity.mock.calls.length;
    c.applyFilters();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-stay-date-filters mat-error')).not.toBeNull();
    expect(api.getActivity).toHaveBeenCalledTimes(requests);
    partial = false;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    c.clearFilters();
    fixture.detectChanges();
    expect(c.stayDates()?.submitted()).toBe(false);
  });
  it('preserves invalid global-event URL criteria for recovery without querying', async () => {
    api.getActivity.mockClear();
    params.next(convertToParamMap({ eventType: 'NIGHTLY_RATE_CHANGED', stayFrom: '2026-08-10' }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const c = fixture.componentInstance;
    expect(c.eventCompatibilityInvalid()).toBe(true);
    expect(c.hideStayControls()).toBe(false);
    expect(c.filterSummary()).toContain('Review the filters');
    c.applyFilters();
    expect(api.getActivity).not.toHaveBeenCalled();
    expect(c.filters().stayFrom).toBe('2026-08-10');
    c.updateFilter('eventType', '');
    fixture.detectChanges();
    c.applyFilters();
    params.next(convertToParamMap(router.navigate.mock.calls.at(-1)?.[1].queryParams));
    fixture.detectChanges();
    expect(api.getActivity).toHaveBeenCalledTimes(1);
  });

  it('keeps only advanced Stay controls collapsible without altering pending criteria', async () => {
    const c = fixture.componentInstance,
      root = fixture.nativeElement as HTMLElement;
    expect(root.querySelectorAll('details')).toHaveLength(1);
    expect(root.querySelector('form')?.closest('details')).toBeNull();
    c.ownerSelector()?.select({
      id: lookupStay.owner.id,
      fullName: 'Current Owner',
      currentCats: [],
    });
    fixture.detectChanges();
    expect(c.advancedExpanded()).toBe(false);
    await dateInput('stayFrom', '2026-08-10');
    expect(c.advancedExpanded()).toBe(true);
    const before = { ...c.filters() },
      details = root.querySelector('details')!;
    details.open = false;
    details.dispatchEvent(new Event('toggle'));
    fixture.detectChanges();
    expect(c.filters()).toEqual(before);
    expect(root.querySelector('.active-filters')).not.toBeNull();
    c.clearFilters();
    fixture.detectChanges();
    expect(c.advancedExpanded()).toBe(false);
    c.updateFilter('eventType', 'NIGHTLY_RATE_CHANGED');
    fixture.detectChanges();
    expect(c.hideStayControls()).toBe(true);
    expect(root.querySelector<HTMLElement>('.primary-entities')?.hidden).toBe(true);
    expect(root.querySelector<HTMLElement>('.primary-event')?.hidden).toBe(false);
  });

  it('retains the last narrative during unresolved text and native partial editing', async () => {
    const c = fixture.componentInstance;
    c.updateFilter('eventType', 'PAYMENT_EDITED');
    fixture.detectChanges();
    const description = c.filterSummary();
    expect(description).toBe('When applied, showing payment-amount edits.');
    const input = fixture.nativeElement.querySelector(
      '.primary-event app-remote-entity-selector input',
    ) as HTMLInputElement;
    input.value = 'unfinished';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(c.filterSummary()).toBe(description);
    c.actorSelector()?.reset();
    c.nativeOccurrenceInvalid.set(true);
    fixture.detectChanges();
    expect(c.filterSummary()).toBe(description);
  });

  it('describes resolving and unavailable effective IDs without exposing their UUID', async () => {
    const response = new Subject<never>();
    vi.spyOn(TestBed.inject(ActivityLookupService), 'resolve').mockReturnValue(response);
    params.next(convertToParamMap({ actorId: lookupStay.owner.id }));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const c = fixture.componentInstance;
    expect(c.filterSummary()).toBe('Preparing filter description…');
    response.error(new Error('unavailable'));
    fixture.detectChanges();
    expect(c.filterSummary()).toBe('Showing sensitive economic changes by an unavailable account.');
    expect(c.filterSummary()).not.toContain(lookupStay.owner.id);
  });
  it.each(['en', 'es'] as const)(
    'renders ordered primary controls and contextual event options in %s',
    async (language) => {
      TestBed.inject(I18nService).language.set(language);
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      const controls = Array.from(
        root.querySelectorAll(
          'form app-remote-entity-selector input, form input[name="occurredFrom"], form input[name="occurredTo"], form mat-select[name="eventType"]',
        ),
      );
      expect(controls).toHaveLength(6);
      expect(controls[0].closest('.primary-entities')).not.toBeNull();
      expect(controls[1].closest('.primary-entities')).not.toBeNull();
      expect(controls[2].getAttribute('name')).toBe('occurredFrom');
      expect(controls[3].getAttribute('name')).toBe('occurredTo');
      expect(controls[4].getAttribute('name')).toBe('eventType');
      expect(controls[5].closest('.primary-event')).not.toBeNull();
      const select = await TestbedHarnessEnvironment.loader(fixture).getHarness(
        MatSelectHarness.with({ selector: '[name="eventType"]' }),
      );
      await select.open();
      expect(document.querySelectorAll('.activity-event-options .event-option-help')).toHaveLength(
        2,
      );
      await select.close();
      await dateInput('stayFrom', '2026-08-10');
      await select.open();
      const options = await select.getOptions();
      expect(await options[1].isDisabled()).toBe(true);
      expect(await options[1].getText()).toContain(
        fixture.componentInstance.text().sensitiveActivity.filters.incompatibleEvent,
      );
      expect(document.querySelectorAll('.activity-event-options .event-option-help')).toHaveLength(
        3,
      );
      await select.close();
      expect(fixture.componentInstance.filters().stayFrom).toBe('2026-08-10');
      expect(root.querySelector('.filter-summary')?.textContent).toContain(
        language === 'en' ? 'When applied' : 'Al aplicar',
      );
    },
  );
  it.each([false, true])(
    'suppresses normal results for a rejected route (initial=%s)',
    async (initial) => {
      const invalid = convertToParamMap({
        eventType: 'NIGHTLY_RATE_CHANGED',
        stayFrom: '2026-08-10',
      });
      if (initial) {
        fixture.destroy();
        params.next(invalid);
        fixture = TestBed.createComponent(SensitiveActivityPage);
      } else params.next(invalid);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      const root = fixture.nativeElement as HTMLElement;
      expect(root.querySelector('.invalid-filter-state')).not.toBeNull();
      expect(root.querySelector('.activity-list')).toBeNull();
      expect(root.querySelector('#sensitive-activity-state mat-paginator')).toBeNull();
      expect(root.querySelector('#sensitive-activity-state')?.textContent).not.toContain(
        TestBed.inject(I18nService).text().sensitiveActivity.empty,
      );
      params.next(convertToParamMap({}));
      fixture.detectChanges();
      expect(root.querySelector('.invalid-filter-state')).toBeNull();
      expect(root.querySelector('.activity-list')).not.toBeNull();
    },
  );

  it.each([0, 1])(
    'keeps unresolved Stay selector %s visible when selecting global events',
    async (index) => {
      const c = fixture.componentInstance,
        root = fixture.nativeElement as HTMLElement;
      const input = root.querySelectorAll<HTMLInputElement>('.primary-entities input')[index];
      input.value = 'unfinished';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      c.updateFilter('eventType', 'NIGHTLY_RATE_CHANGED');
      fixture.detectChanges();
      c.applyFilters();
      fixture.detectChanges();
      expect(root.querySelector<HTMLElement>('.primary-entities')?.hidden).toBe(false);
      expect(input.value).toBe('unfinished');
      expect(root.querySelector('.primary-entities mat-error')).not.toBeNull();
      input.value = '';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(c.hideStayControls()).toBe(true);
    },
  );

  it('keeps partial native Stay dates available for correction with global events', async () => {
    const c = fixture.componentInstance,
      root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('app-stay-date-filters input[type="date"]')!;
    Object.defineProperty(input, 'validity', {
      configurable: true,
      get: () => ({ badInput: true, valid: false }),
    });
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();
    c.updateFilter('eventType', 'NIGHTLY_RATE_CHANGED');
    fixture.detectChanges();
    c.applyFilters();
    fixture.detectChanges();
    expect(root.querySelector<HTMLElement>('.advanced-stay')?.hidden).toBe(false);
    expect(c.filters().stayFrom).toBeFalsy();
    expect(c.stayDates()?.dateStates().dateFrom).toBe('EDITING');
    expect(root.querySelector('app-stay-date-filters mat-error')).not.toBeNull();
  });

  it.each(['actorId', 'ownerId', 'catId'] as const)(
    'keeps failed %s narration unavailable across locale changes',
    async (key) => {
      const c = fixture.componentInstance;
      const adapter =
        key === 'actorId' ? c.accountAdapter : key === 'ownerId' ? c.ownerAdapter : c.catAdapter;
      const resolve = vi
        .spyOn(adapter, 'resolve')
        .mockReturnValue(throwError(() => new Error('missing')));
      params.next(convertToParamMap({ [key]: lookupStay.owner.id }));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(c.filterSummary()).toContain('unavailable');
      TestBed.inject(I18nService).language.set('es');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(c.filterSummary()).toContain('no disponible');
      expect(c.filterSummary()).not.toContain('Preparando');
      expect(c.filterSummary()).not.toContain(lookupStay.owner.id);
      expect(resolve).toHaveBeenCalledTimes(1);
    },
  );
});
