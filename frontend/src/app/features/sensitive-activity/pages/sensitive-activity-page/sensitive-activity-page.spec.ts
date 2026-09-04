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

    component.updateFilter('occurredFrom', '2026-10-25T02:30');
    component.applyFilters();

    expect(router.navigate).toHaveBeenCalledWith(
      [],
      expect.objectContaining({
        queryParams: expect.objectContaining({ occurredFrom: '2026-10-25T00:30:00.000Z' }),
      }),
    );
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
    expect(root.querySelectorAll('.activity-list article')).toHaveLength(events.length);
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
    expect(root.querySelectorAll('.activity-list article')).toHaveLength(events.length);
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
    expect(root.querySelectorAll('.activity-list article')).toHaveLength(events.length);

    badInput = false;
    from.dispatchEvent(new Event('blur'));
    (root.querySelector('button[type="submit"]') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(component.filterErrors().occurredFrom).toBeNull();
    expect(fieldFor(root, 'occurredFrom').classList.contains('mat-form-field-invalid')).toBe(false);
    expect(fieldFor(root, 'occurredFrom').querySelector('mat-error')).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith([], expect.objectContaining({ queryParams: {} }));
  });

  it('shows an invalid UUID on its field without replacing loaded results', () => {
    const component = fixture.componentInstance;
    const requestsBeforeApply = api.getActivity.mock.calls.length;
    component.updateFilter('actorId', '9');

    component.applyFilters();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(component.filterErrors().actorId).toBe('invalidUuid');
    expect(fieldFor(root, 'actorId').classList.contains('mat-form-field-invalid')).toBe(true);
    expect(fieldFor(root, 'actorId').querySelector('mat-error')?.textContent).toContain(
      component.text().sensitiveActivity.filters.invalidId,
    );
    expect(router.navigate).not.toHaveBeenCalled();
    expect(api.getActivity).toHaveBeenCalledTimes(requestsBeforeApply);
    expect(root.querySelectorAll('.activity-list article')).toHaveLength(events.length);
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
    expect(fieldFor(root, 'actorId').querySelector('mat-error')?.textContent).toContain(
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
});
