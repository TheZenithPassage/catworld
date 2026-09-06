import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter, Router, RouterLink } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Stay } from '../../../stays/models/stay.model';
import { StayApiService } from '../../../stays/services/stay-api.service';
import { StayStatusVisibilityPreferencesService } from '../../../stays/services/stay-status-visibility-preferences.service';
import { CalendarPage } from './calendar-page';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import { EntityDetailUpdate } from '../../../../shared/entity-detail/entity-reference';
import { CalendarDailyAggregate } from './calendar-daily-aggregate';
import { FullCalendarComponent } from '@fullcalendar/angular';
import { I18nService } from '../../../../core/i18n/i18n.service';

describe('CalendarPage', () => {
  const stay: Stay = {
    stayId: 'stay-1',
    startAt: '2099-01-02T10:00:00',
    endAt: '2099-01-09T10:00:00',
    numberOfNights: 7,
    cancelledAt: null,
    createdAt: '2026-07-03T10:00:00',
    updatedAt: '2026-07-03T10:00:00',
    notes: null,
    catIds: ['cat-1'],
    ownerId: 'owner-1',
    ownerName: 'Ada Lovelace',
    cats: [{ catId: 'cat-1', name: 'Milo' }],
    retainedNightlyRate: '50',
    suggestedAmount: '100',
    agreedAmount: '100',
    totalPaid: '0',
    remainingAmount: '100',
    paymentCondition: 'NO_PAYMENT',
    outstandingCollectionEligible: true,
    payments: [],
  };

  const stayApiService = {
    getStays: vi.fn(),
  };

  const visibilityPreferencesService = {
    read: vi.fn(),
    store: vi.fn(),
  };
  const dialogUpdates = new Subject<EntityDetailUpdate>();
  const entityDetailDialog = { open: vi.fn(() => dialogUpdates.asObservable()) };
  const materialDialog = { open: vi.fn() };

  let component: CalendarPage;
  let fixture: ComponentFixture<CalendarPage>;

  beforeEach(async () => {
    vi.resetAllMocks();
    localStorage.clear();
    stayApiService.getStays.mockReturnValue(of([stay]));
    visibilityPreferencesService.read.mockReturnValue({
      reserved: true,
      'checked-in': true,
      'checked-out': true,
      cancelled: false,
    });

    await TestBed.configureTestingModule({
      imports: [CalendarPage],
      providers: [
        provideNoopAnimations(),
        provideRouter([
          { path: 'stays', component: CalendarPage },
          { path: 'stays/new', component: CalendarPage },
        ]),
        { provide: StayApiService, useValue: stayApiService },
        { provide: EntityDetailDialogService, useValue: entityDetailDialog },
        { provide: MatDialog, useValue: materialDialog },
        {
          provide: StayStatusVisibilityPreferencesService,
          useValue: visibilityPreferencesService,
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(CalendarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('renders calendar header actions as Material route controls', () => {
    createComponent();

    const compiled = fixture.nativeElement as HTMLElement;
    const headerActions = fixture.debugElement
      .queryAll(By.css('.header-actions a'))
      .map((link) => link.injector.get(RouterLink));

    expect(compiled.querySelector('.header-actions a[mat-stroked-button]')?.textContent).toContain(
      component.text().calendar.actions.viewStays,
    );
    expect(compiled.querySelector('.header-actions a[mat-flat-button]')?.textContent).toContain(
      component.text().calendar.actions.createStay,
    );
    expect(headerActions.map((link) => link.href)).toEqual(['/stays', '/stays/new']);
  });

  it('uses Material status filters and preserves status visibility changes', () => {
    createComponent();

    const compiled = fixture.nativeElement as HTMLElement;
    const statusFilters = compiled.querySelectorAll('mat-checkbox.status-filter');
    const reservedInput = statusFilters[0].querySelector('input') as HTMLInputElement;

    expect(statusFilters).toHaveLength(4);
    expect(compiled.textContent).toContain(component.text().stays.status.reserved);

    reservedInput.click();
    fixture.detectChanges();

    expect(component.isStatusVisible('reserved')).toBe(false);
    component.applyFilters();
    fixture.detectChanges();
    expect(visibilityPreferencesService.store).toHaveBeenCalledWith(
      expect.objectContaining({ reserved: false }),
    );
  });

  it('offers exactly the three unified modes and keeps mode independent from entity filters', () => {
    createComponent();

    const compiled = fixture.nativeElement as HTMLElement;
    const displayOptions = compiled.querySelectorAll('.calendar-display-option mat-radio-button');
    const entryExitInput = displayOptions[2].querySelector('input') as HTMLInputElement;

    expect(
      Array.from(displayOptions).map(
        (option) => (option.querySelector('input') as HTMLInputElement).value,
      ),
    ).toEqual(['daily-labels', 'daily-counts', 'entry-exit-markers']);
    expect(compiled.textContent).toContain(
      component.text().calendar.displayModes.options['daily-labels'].label,
    );

    (displayOptions[1].closest('.calendar-display-option') as HTMLElement).click();
    fixture.detectChanges();

    expect(component.displayMode()).toBe('daily-counts');
    expect(compiled.querySelector('.calendar-wrapper--daily-counts')).not.toBeNull();

    component.setSearchFilters({ catId: 'cat-1', ownerId: null });
    component.applyFilters();
    fixture.detectChanges();

    expect(component.displayMode()).toBe('daily-counts');
    expect(compiled.querySelectorAll('.calendar-display-option mat-radio-button')).toHaveLength(3);
    expect(compiled.querySelector('.calendar-display-option mat-checkbox')).toBeNull();

    entryExitInput.click();
    fixture.detectChanges();

    expect(component.displayMode()).toBe('entry-exit-markers');

    component.setSearchFilters({ catId: null, ownerId: null });
    component.applyFilters();
    fixture.detectChanges();

    expect(component.displayMode()).toBe('entry-exit-markers');
  });

  it('updates daily counts and participants for Cat and Owner filters without changing mode', () => {
    const otherStay: Stay = {
      ...stay,
      stayId: 'stay-2',
      ownerId: 'owner-2',
      ownerName: 'Grace Hopper',
      catIds: ['cat-2'],
      cats: [{ catId: 'cat-2', name: 'Ámbar' }],
    };
    stayApiService.getStays.mockReturnValue(of([stay, otherStay]));
    createComponent();
    component.setDisplayMode('daily-counts');

    const aggregateForFirstDate = (): CalendarDailyAggregate | undefined =>
      component.dailyAggregates().find(({ date }) => date === '2099-01-02');

    expect(aggregateForFirstDate()?.count).toBe(2);
    expect(aggregateForFirstDate()?.participants.map(({ catId }) => catId)).toEqual([
      'cat-2',
      'cat-1',
    ]);

    component.setSearchFilters({ catId: 'cat-1', ownerId: null });
    component.applyFilters();

    expect(component.displayMode()).toBe('daily-counts');
    expect(aggregateForFirstDate()?.count).toBe(1);
    expect(aggregateForFirstDate()?.participants.map(({ catId }) => catId)).toEqual(['cat-1']);

    component.setSearchFilters({ catId: null, ownerId: 'owner-2' });
    component.applyFilters();

    expect(component.displayMode()).toBe('daily-counts');
    expect(aggregateForFirstDate()?.count).toBe(1);
    expect(aggregateForFirstDate()?.participants.map(({ catId }) => catId)).toEqual(['cat-2']);

    component.setSearchFilters({ catId: null, ownerId: null });
    component.applyFilters();

    expect(component.displayMode()).toBe('daily-counts');
    expect(aggregateForFirstDate()?.count).toBe(2);
    expect(aggregateForFirstDate()?.participants.map(({ catId }) => catId)).toEqual([
      'cat-2',
      'cat-1',
    ]);
  });

  it('defaults invalid and obsolete display preferences safely while retaining the visible month', () => {
    localStorage.setItem(
      'catworld.calendar.preferences',
      JSON.stringify({
        displayMode: 'compact-daily-labels',
        unfilteredDisplayMode: 'entry-exit-markers',
        dailyLabelsEnabled: false,
        compactModeEnabled: true,
        visibleMonth: '2099-04-01',
      }),
    );

    createComponent();

    expect(component.displayMode()).toBe('daily-labels');
    expect(component.visibleMonth()).toBe('2099-04-01');
    expect(component.calendarOptions().initialDate).toBe('2099-04-01');

    component.calendarOptions().datesSet!({
      view: { currentStart: new Date(2099, 6, 1), currentEnd: new Date(2099, 7, 1) },
    } as never);
    fixture.detectChanges();

    expect(component.visibleMonth()).toBe('2099-07-01');
  });

  it('renders and updates the compact localized month context without changing layout state', async () => {
    localStorage.setItem(
      'catworld.calendar.preferences',
      JSON.stringify({ displayMode: 'daily-labels', visibleMonth: '2099-04-01' }),
    );

    createComponent();
    await fixture.whenStable();
    fixture.detectChanges();

    const compactMonth = fixture.nativeElement.querySelector(
      '.calendar-sticky-month',
    ) as HTMLElement;
    const stickyHeader = compactMonth.closest(
      '.fc-scrollgrid-section-header.fc-scrollgrid-section-sticky > *',
    );

    expect(compactMonth.textContent?.trim()).toBe('ABR 2099');
    expect(stickyHeader).not.toBeNull();

    component.calendarOptions().datesSet!({
      view: { currentStart: new Date(2099, 6, 1), currentEnd: new Date(2099, 7, 1) },
    } as never);
    fixture.detectChanges();

    expect(compactMonth.textContent?.trim()).toBe('JUL 2099');

    component.ngOnDestroy();

    expect(fixture.nativeElement.querySelector('.calendar-sticky-month')).toBeNull();
  });

  it('keeps FullCalendar present for loaded stays and keeps error state retry behavior', async () => {
    createComponent();

    expect(fixture.nativeElement.querySelector('full-calendar')).not.toBeNull();

    TestBed.resetTestingModule();
    stayApiService.getStays.mockReturnValue(throwError(() => new Error('load failed')));

    await TestBed.configureTestingModule({
      imports: [CalendarPage],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: StayApiService, useValue: stayApiService },
        { provide: EntityDetailDialogService, useValue: entityDetailDialog },
        { provide: MatDialog, useValue: materialDialog },
        {
          provide: StayStatusVisibilityPreferencesService,
          useValue: visibilityPreferencesService,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(component.text().calendar.errorLoading);
    expect(fixture.nativeElement.textContent).toContain(component.text().calendar.actions.retry);
  });

  it('reloads the bounded view after a Stay moves out, preserving applied filters and navigation', async () => {
    localStorage.setItem(
      'catworld.calendar.preferences',
      JSON.stringify({ visibleMonth: '2099-01-01', displayMode: 'daily-labels' }),
    );
    createComponent();
    component.setSearchFilters({
      catId: null,
      ownerId: 'owner-1',
      dateFrom: '2099-01-01',
      dateMatchMode: 'OVERLAPS',
    });
    component.applyFilters();
    const applied = component.searchFilters();
    const router = TestBed.inject(Router);
    const before = router.url;
    component.calendarOptions().eventClick!({
      event: { id: 'fallback', extendedProps: { stayId: 'stay-1' } },
    } as never);
    expect(entityDetailDialog.open).toHaveBeenCalledWith({
      entityType: 'stay',
      entityId: 'stay-1',
    });
    expect(router.url).toBe(before);
    const updated = { ...stay, startAt: '2099-02-01T10:00:00', endAt: '2099-02-08T10:00:00' };
    stayApiService.getStays.mockReturnValueOnce(of([]));
    dialogUpdates.next(updated);
    fixture.detectChanges();
    expect(component.stays()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain(component.text().calendar.empty);
    expect(component.searchFilters()).toEqual(applied);
    expect(stayApiService.getStays).toHaveBeenCalledTimes(2);
    expect(stayApiService.getStays).toHaveBeenLastCalledWith({
      dateFrom: '2099-01-01',
      dateTo: '2099-01-31',
      dateMatchMode: 'OVERLAPS',
    });

    stayApiService.getStays.mockReturnValue(of([updated]));
    const calendar = fixture.debugElement.query(By.directive(FullCalendarComponent))
      .componentInstance as FullCalendarComponent;
    calendar.getApi().next();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(component.filteredStays()).toEqual([updated]);
    expect(component.searchFilters()).toEqual(applied);
    expect(stayApiService.getStays).toHaveBeenLastCalledWith({
      dateFrom: '2099-02-01',
      dateTo: '2099-02-28',
      dateMatchMode: 'OVERLAPS',
    });

    dialogUpdates.next({ entityType: 'stay', entityId: 'stay-1' });
    expect(stayApiService.getStays).toHaveBeenCalledTimes(4);
  });

  it('delegates detailed event content to FullCalendar default rendering', () => {
    createComponent();

    const eventContent = component.calendarOptions().eventContent as (
      eventInfo: unknown,
    ) => unknown;

    expect(eventContent({ event: { title: 'Milo', extendedProps: { stayId: 'stay-1' } } })).toBe(
      true,
    );
  });

  it('rerenders localized accessible and visual count content and dispatches its aggregate without opening Stay details', () => {
    createComponent();
    component.setDisplayMode('daily-counts');
    fixture.detectChanges();

    const aggregate = component.dailyAggregates()[0];
    const countEvent = component.calendarEvents()[0];
    const activateDailyCount = vi.spyOn(component, 'activateDailyCount');
    const eventContent = component.calendarOptions().eventContent as (eventInfo: unknown) => {
      domNodes: HTMLElement[];
    };
    const content = eventContent({
      event: {
        id: countEvent.id,
        title: countEvent.title,
        extendedProps: countEvent.extendedProps,
      },
    });
    const relocalizedAccessibleName = `Resumen accesible ${aggregate.count}`;
    const relocalizedContent = eventContent({
      event: {
        id: countEvent.id,
        title: `${aggregate.count} gatos`,
        extendedProps: {
          ...countEvent.extendedProps,
          dailyCountAccessibleName: relocalizedAccessibleName,
        },
      },
    });

    expect(content.domNodes[0].textContent).toBe(
      countEvent.extendedProps?.['dailyCountAccessibleName'],
    );
    expect(content.domNodes[1].textContent).toBe(countEvent.title);
    expect(content.domNodes[1].getAttribute('aria-hidden')).toBe('true');
    expect(content.domNodes[2].textContent).toBe(String(aggregate.count));
    expect(content.domNodes[2].getAttribute('aria-hidden')).toBe('true');
    expect(relocalizedContent.domNodes[0].textContent).toBe(relocalizedAccessibleName);
    expect(relocalizedContent.domNodes[1].textContent).toBe(`${aggregate.count} gatos`);

    component.calendarOptions().eventClick!({
      event: { id: countEvent.id, extendedProps: countEvent.extendedProps },
    } as never);

    expect(activateDailyCount).toHaveBeenCalledWith(aggregate);
    expect(activateDailyCount.mock.calls[0][0] as CalendarDailyAggregate).toBe(aggregate);
    expect(entityDetailDialog.open).not.toHaveBeenCalled();
  });

  it('renders daily counts as keyboard buttons that open the exact aggregate with Enter and Space', async () => {
    localStorage.setItem(
      'catworld.calendar.preferences',
      JSON.stringify({ displayMode: 'daily-counts', visibleMonth: '2099-01-01' }),
    );
    createComponent();
    await fixture.whenStable();
    fixture.detectChanges();

    const aggregate = component.dailyAggregates()[0];
    const countEvent = fixture.nativeElement.querySelector('.daily-count-event') as HTMLElement;

    expect(countEvent).not.toBeNull();
    expect(countEvent.getAttribute('role')).toBe('button');
    expect(countEvent.tabIndex).toBe(0);

    const enterEvent = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    countEvent.dispatchEvent(enterEvent);

    expect(enterEvent.defaultPrevented).toBe(true);
    expect(materialDialog.open).toHaveBeenCalledOnce();
    expect(materialDialog.open.mock.calls[0][1]?.data).toBe(aggregate);

    materialDialog.open.mockClear();
    component.setSearchFilters({ catId: 'cat-1', ownerId: null });
    component.applyFilters();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const filteredAggregate = component.dailyAggregates()[0];
    const updatedCountEvent = fixture.nativeElement.querySelector(
      '.daily-count-event',
    ) as HTMLElement;
    const spaceEvent = new KeyboardEvent('keydown', {
      key: ' ',
      bubbles: true,
      cancelable: true,
    });
    updatedCountEvent.dispatchEvent(spaceEvent);

    expect(filteredAggregate).not.toBe(aggregate);
    expect(component.displayMode()).toBe('daily-counts');
    expect(spaceEvent.defaultPrevented).toBe(true);
    expect(materialDialog.open).toHaveBeenCalledOnce();
    expect(materialDialog.open.mock.calls[0][1]?.data).toBe(filteredAggregate);
  });

  it('opens the daily summary with the exact aggregate supplied by count activation', () => {
    createComponent();
    const aggregate = component.dailyAggregates()[0];

    component.activateDailyCount(aggregate);

    expect(materialDialog.open).toHaveBeenCalledOnce();
    expect(materialDialog.open.mock.calls[0][1]?.data).toBe(aggregate);
    expect(materialDialog.open.mock.calls[0][1]).toEqual(
      expect.objectContaining({
        width: 'min(40rem, calc(100vw - 2rem))',
        maxWidth: 'calc(100vw - 2rem)',
        maxHeight: 'calc(100dvh - 2rem)',
        autoFocus: 'dialog',
      }),
    );
  });
  it('waits for the logical interval, bounds navigation and cancels stale responses while retaining applied criteria', () => {
    const old = new Subject<Stay[]>();
    const next = new Subject<Stay[]>();
    stayApiService.getStays.mockReturnValueOnce(old).mockReturnValueOnce(next);
    fixture = TestBed.createComponent(CalendarPage);
    component = fixture.componentInstance;
    expect(stayApiService.getStays).not.toHaveBeenCalled();
    component.setViewInterval({
      view: { currentStart: new Date(2030, 0, 1), currentEnd: new Date(2030, 1, 1) },
    } as never);
    expect(stayApiService.getStays).toHaveBeenLastCalledWith({
      dateFrom: '2030-01-01',
      dateTo: '2030-01-31',
      dateMatchMode: 'OVERLAPS',
    });
    component.setSearchFilters({
      catId: null,
      ownerId: 'owner-1',
      dateFrom: '2099-01-05',
      dateMatchMode: 'RANGE_WITHIN_STAY',
    });
    component.applyFilters();
    component.setViewInterval({
      view: { currentStart: new Date(2030, 1, 1), currentEnd: new Date(2030, 1, 8) },
    } as never);
    expect(stayApiService.getStays).toHaveBeenLastCalledWith({
      dateFrom: '2030-02-01',
      dateTo: '2030-02-07',
      dateMatchMode: 'OVERLAPS',
    });
    next.next([stay]);
    old.next([{ ...stay, stayId: 'old' }]);
    expect(component.filteredStays()).toEqual([stay]);
    expect(component.searchFilters().dateMatchMode).toBe('RANGE_WITHIN_STAY');
    fixture.detectChanges();
  });

  it('hides incomplete adjacent dates in every mode and loads their complete population on navigation', async () => {
    const crossing = { ...stay, startAt: '2030-01-31T10:00:00', endAt: '2030-02-02T10:00:00' };
    const adjacent = {
      ...crossing,
      stayId: 'stay-2',
      startAt: '2030-02-01T10:00:00',
      catIds: ['cat-2'],
      cats: [{ catId: 'cat-2', name: 'Pixel' }],
    };
    localStorage.setItem(
      'catworld.calendar.preferences',
      JSON.stringify({ visibleMonth: '2030-01-01', displayMode: 'daily-counts' }),
    );
    stayApiService.getStays.mockImplementation(({ dateFrom }) =>
      of(dateFrom === '2030-01-01' ? [crossing] : [crossing, adjacent]),
    );
    createComponent();
    await fixture.whenStable();
    fixture.detectChanges();
    for (const mode of component.displayModeOptions) {
      component.setDisplayMode(mode);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-date="2030-02-01"]')).toBeNull();
    }
    expect(stayApiService.getStays).toHaveBeenLastCalledWith({
      dateFrom: '2030-01-01',
      dateTo: '2030-01-31',
      dateMatchMode: 'OVERLAPS',
    });
    component.setDisplayMode('daily-counts');
    const calendar = fixture.debugElement.query(By.directive(FullCalendarComponent))
      .componentInstance as FullCalendarComponent;
    calendar.getApi().next();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(stayApiService.getStays).toHaveBeenLastCalledWith({
      dateFrom: '2030-02-01',
      dateTo: '2030-02-28',
      dateMatchMode: 'OVERLAPS',
    });
    const count = fixture.nativeElement.querySelector(
      '[data-date="2030-02-01"] .fc-event',
    ) as HTMLElement;
    expect(count.textContent).toContain('2');
    count.click();
    expect(materialDialog.open).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        data: expect.objectContaining({
          count: 2,
          participants: expect.arrayContaining([
            expect.objectContaining({ catId: 'cat-1' }),
            expect.objectContaining({ catId: 'cat-2' }),
          ]),
        }),
      }),
    );
  });

  it.each([
    ['en', 'No stays in the displayed period.'],
    ['es', 'No hay estancias en el período mostrado.'],
  ] as const)(
    'describes an empty bounded view in %s and keeps navigation available',
    async (language, message) => {
      TestBed.inject(I18nService).language.set(language);
      localStorage.setItem(
        'catworld.calendar.preferences',
        JSON.stringify({ visibleMonth: '2099-01-01', displayMode: 'daily-labels' }),
      );
      stayApiService.getStays.mockImplementation(({ dateFrom }) =>
        of(dateFrom === '2099-01-01' ? [stay] : []),
      );
      createComponent();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).not.toContain(message);
      const calendar = fixture.debugElement.query(By.directive(FullCalendarComponent))
        .componentInstance as FullCalendarComponent;
      calendar.getApi().next();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain(message);
      expect(fixture.nativeElement.textContent).not.toContain(
        component.text().calendar.emptyFiltered,
      );
      expect(stayApiService.getStays.mock.calls).toEqual([
        [{ dateFrom: '2099-01-01', dateTo: '2099-01-31', dateMatchMode: 'OVERLAPS' }],
        [{ dateFrom: '2099-02-01', dateTo: '2099-02-28', dateMatchMode: 'OVERLAPS' }],
      ]);
      calendar.getApi().prev();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(component.filteredStays()).toEqual([stay]);
      expect(fixture.nativeElement.textContent).not.toContain(message);
    },
  );

  it('keeps draft changes out of visible events until Filter and blocks reversed dates', () => {
    createComponent();
    const before = component.calendarEvents();
    const calls = stayApiService.getStays.mock.calls.length;
    component.setSearchFilters({
      catId: null,
      ownerId: null,
      dateFrom: '2100-01-01',
      dateMatchMode: 'OVERLAPS',
    });
    fixture.detectChanges();
    expect(component.calendarEvents()).toEqual(before);
    expect(stayApiService.getStays).toHaveBeenCalledTimes(calls);
    (fixture.nativeElement.querySelector('.apply-filters') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(component.filteredStays()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain(component.text().calendar.emptyFiltered);
    component.setSearchFilters({
      catId: null,
      ownerId: null,
      dateFrom: '2100-01-01',
      dateTo: '2099-01-01',
    });
    fixture.detectChanges();
    expect(
      (fixture.nativeElement.querySelector('.apply-filters') as HTMLButtonElement).disabled,
    ).toBe(true);
    component.setDisplayMode('entry-exit-markers');
    expect(component.displayMode()).toBe('entry-exit-markers');
    expect(component.searchFilters().dateTo).toBeUndefined();
  });
});
