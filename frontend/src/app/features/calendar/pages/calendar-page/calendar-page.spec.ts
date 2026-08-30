import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router, RouterLink } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Stay } from '../../../stays/models/stay.model';
import { StayApiService } from '../../../stays/services/stay-api.service';
import { StayStatusVisibilityPreferencesService } from '../../../stays/services/stay-status-visibility-preferences.service';
import { CalendarPage } from './calendar-page';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import { EntityDetailUpdate } from '../../../../shared/entity-detail/entity-reference';

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
        {
          provide: StayStatusVisibilityPreferencesService,
          useValue: visibilityPreferencesService,
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
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
    fixture.detectChanges();

    expect(component.displayMode()).toBe('daily-counts');
    expect(compiled.querySelectorAll('.calendar-display-option mat-radio-button')).toHaveLength(3);
    expect(compiled.querySelector('.calendar-display-option mat-checkbox')).toBeNull();

    entryExitInput.click();
    fixture.detectChanges();

    expect(component.displayMode()).toBe('entry-exit-markers');

    component.setSearchFilters({ catId: null, ownerId: null });
    fixture.detectChanges();

    expect(component.displayMode()).toBe('entry-exit-markers');
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
      view: { currentStart: new Date(2099, 6, 1) },
    } as never);
    fixture.detectChanges();

    expect(component.visibleMonth()).toBe('2099-07-01');
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

  it('opens Stay details without navigation and replaces the cache from the authoritative update', async () => {
    createComponent();
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
    const updated = { ...stay, notes: 'authoritative', startAt: '2099-02-01T10:00:00' };
    dialogUpdates.next(updated);
    expect(component.stays()).toEqual([updated]);
    expect(stayApiService.getStays).toHaveBeenCalledTimes(1);

    dialogUpdates.next({ entityType: 'stay', entityId: 'stay-1' });
    expect(stayApiService.getStays).toHaveBeenCalledTimes(2);
  });
});
