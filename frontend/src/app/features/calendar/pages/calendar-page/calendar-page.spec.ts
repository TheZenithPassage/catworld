import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, RouterLink } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Stay } from '../../../stays/models/stay.model';
import { StayApiService } from '../../../stays/services/stay-api.service';
import { StayStatusVisibilityPreferencesService } from '../../../stays/services/stay-status-visibility-preferences.service';
import { CalendarPage } from './calendar-page';

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

  it('uses Material display controls while preserving display mode behavior', () => {
    createComponent();

    const compiled = fixture.nativeElement as HTMLElement;
    const displayOptions = compiled.querySelectorAll('mat-radio-button.calendar-display-option');
    const entryExitInput = displayOptions[2].querySelector('input') as HTMLInputElement;

    expect(displayOptions).toHaveLength(3);
    expect(compiled.textContent).toContain(
      component.text().calendar.displayModes.options['daily-labels'].label,
    );

    entryExitInput.click();
    fixture.detectChanges();

    expect(component.unfilteredDisplayMode()).toBe('entry-exit-markers');

    component.setSearchFilters({ catId: 'cat-1', ownerId: null });
    fixture.detectChanges();

    const filteredDailyLabelsInput = compiled.querySelector(
      'mat-checkbox.calendar-display-option input',
    ) as HTMLInputElement;
    filteredDailyLabelsInput.click();
    fixture.detectChanges();

    expect(component.filteredDailyLabelsEnabled()).toBe(true);
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
});
