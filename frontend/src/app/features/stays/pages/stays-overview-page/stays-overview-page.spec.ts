import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { StayStatusVisibilityPreferencesService } from '../../services/stay-status-visibility-preferences.service';
import { StaysOverviewPage } from './stays-overview-page';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import { EntityDetailUpdate } from '../../../../shared/entity-detail/entity-reference';

describe('StaysOverviewPage', () => {
  const reservedStay: Stay = {
    stayId: 'stay-1',
    startAt: '2099-01-02T10:00:00',
    endAt: '2099-01-09T10:00:00',
    numberOfNights: 7,
    cancelledAt: null,
    createdAt: '2026-07-03T10:00:00',
    updatedAt: '2026-07-03T10:00:00',
    notes: 'Needs quiet room',
    catIds: ['cat-1', 'cat-6'],
    ownerId: 'owner-1',
    ownerName: 'Ada Lovelace',
    cats: [
      { catId: 'cat-1', name: 'Milo' },
      { catId: 'cat-6', name: 'Turing' },
    ],
    retainedNightlyRate: '50',
    suggestedAmount: '100',
    agreedAmount: '100',
    totalPaid: '0',
    remainingAmount: '100',
    paymentCondition: 'NO_PAYMENT',
    outstandingCollectionEligible: true,
    payments: [],
  };

  const cancelledStay: Stay = {
    ...reservedStay,
    stayId: 'stay-2',
    cancelledAt: '2026-07-03T11:00:00',
    notes: null,
    cats: [{ catId: 'cat-2', name: 'Luna' }],
    agreedAmount: '0',
    totalPaid: '0',
    remainingAmount: '0',
    outstandingCollectionEligible: false,
    payments: [],
  };

  const partialCheckedOutStay: Stay = {
    ...reservedStay,
    stayId: 'stay-3',
    startAt: '2026-01-01T10:00:00',
    endAt: '2026-01-08T10:00:00',
    ownerId: 'owner-2',
    ownerName: 'Grace Hopper',
    cats: [{ catId: 'cat-3', name: 'Pixel' }],
    agreedAmount: '9999999999999999999',
    totalPaid: '1',
    remainingAmount: '9999999999999999998',
    paymentCondition: 'PARTIAL_PAYMENT',
    outstandingCollectionEligible: true,
    payments: [],
  };

  const fullStay: Stay = {
    ...reservedStay,
    stayId: 'stay-4',
    ownerId: 'owner-3',
    ownerName: 'Katherine Johnson',
    cats: [{ catId: 'cat-4', name: 'Orbit' }],
    agreedAmount: '100',
    totalPaid: '100',
    remainingAmount: '0',
    paymentCondition: 'FULL_PAYMENT',
    outstandingCollectionEligible: false,
    payments: [],
  };

  const legacyStay: Stay = {
    ...reservedStay,
    stayId: 'stay-5',
    ownerId: 'owner-4',
    ownerName: 'Dorothy Vaughan',
    cats: [{ catId: 'cat-5', name: 'Legacy' }],
    agreedAmount: null,
    totalPaid: '0',
    remainingAmount: null,
    paymentCondition: 'NO_PAYMENT',
    outstandingCollectionEligible: false,
    payments: [],
  };

  const stayApiService = {
    getStays: vi.fn(),
    cancelStay: vi.fn(),
    correctAgreedAmount: vi.fn(),
  };

  const visibilityPreferencesService = {
    read: vi.fn(),
    store: vi.fn(),
  };
  let detailUpdates: Subject<EntityDetailUpdate>;
  const detailDialog = { open: vi.fn() };

  let component: StaysOverviewPage;
  let fixture: ComponentFixture<StaysOverviewPage>;
  let queryParams: Record<string, string>;

  beforeEach(async () => {
    vi.resetAllMocks();
    detailUpdates = new Subject<EntityDetailUpdate>();
    detailDialog.open.mockReturnValue(detailUpdates.asObservable());
    queryParams = { selectedStayId: 'stay-1' };
    stayApiService.getStays.mockReturnValue(
      of([reservedStay, cancelledStay, partialCheckedOutStay, fullStay, legacyStay]),
    );
    stayApiService.cancelStay.mockReturnValue(of({ ...reservedStay, cancelledAt: 'now' }));
    visibilityPreferencesService.read.mockReturnValue({
      reserved: true,
      'checked-in': true,
      'checked-out': true,
      cancelled: true,
    });

    await TestBed.configureTestingModule({
      imports: [StaysOverviewPage],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: StayApiService, useValue: stayApiService },
        { provide: EntityDetailDialogService, useValue: detailDialog },
        {
          provide: StayStatusVisibilityPreferencesService,
          useValue: visibilityPreferencesService,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            get queryParamMap() {
              return of(convertToParamMap(queryParams));
            },
          },
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(StaysOverviewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('renders accessible Material rows without Actions and opens details by pointer, Enter and Space', () => {
    createComponent();

    const compiled = fixture.nativeElement as HTMLElement;
    const headerText = [...compiled.querySelectorAll('th')]
      .map((header) => header.textContent?.trim())
      .join(' ');

    expect(compiled.querySelector('table[mat-table]')).not.toBeNull();
    expect(headerText).toContain(component.text().stays.overview.table.state);
    expect(headerText).toContain(component.text().stays.overview.table.period);
    expect(headerText).toContain(component.text().stays.overview.table.cats);
    expect(headerText).toContain(component.text().stays.overview.table.owner);
    expect(headerText).not.toContain(component.text().stays.overview.table.actions);
    expect(compiled.textContent).toContain('Ada Lovelace');
    expect(compiled.textContent).toContain('Milo');
    expect(compiled.textContent).toContain('Turing');
    expect(compiled.textContent).not.toContain('Needs quiet room');
    expect(compiled.querySelector('#stay-stay-1.selected-row')).not.toBeNull();
    expect(compiled.querySelectorAll('mat-checkbox.status-filter')).toHaveLength(
      component.statusFilterOptions.length,
    );
    expect(compiled.querySelector('a[mat-flat-button]')?.textContent).toContain(
      component.text().stays.overview.create,
    );
    const row = compiled.querySelector('#stay-stay-1') as HTMLElement;
    const otherRow = compiled.querySelector('#stay-stay-2') as HTMLElement;
    expect(row.tabIndex).toBe(0);
    expect(row.getAttribute('aria-label')).toBe(component.getOpenDetailAriaLabel(reservedStay));
    expect(row.getAttribute('aria-label')).toContain('Milo');
    expect(row.getAttribute('aria-label')).toContain('Ada Lovelace');
    expect(row.getAttribute('aria-label')).not.toContain(reservedStay.stayId);
    expect(otherRow.getAttribute('aria-label')).toContain('Luna');
    expect(otherRow.getAttribute('aria-label')).not.toBe(row.getAttribute('aria-label'));
    row.click();
    expect(detailDialog.open).toHaveBeenLastCalledWith({ entityType: 'stay', entityId: 'stay-1' });
    for (const key of ['Enter', ' ']) {
      const event = new KeyboardEvent('keydown', { key, cancelable: true });
      row.dispatchEvent(event);
      expect(event.defaultPrevented).toBe(true);
    }
    expect(detailDialog.open).toHaveBeenCalledTimes(3);
  });

  it('reloads after a referenced Stay update and replaces a returned full Stay in place', () => {
    createComponent();
    component.openDetail(reservedStay);
    detailUpdates.next({ entityType: 'stay', entityId: reservedStay.stayId });
    expect(stayApiService.getStays).toHaveBeenCalledTimes(2);

    const replacement = {
      ...reservedStay,
      ownerName: 'Updated owner',
      agreedAmount: '9999999999999999999',
    };
    detailUpdates.next(replacement);
    expect(component.stays().find((stay) => stay.stayId === 'stay-1')).toBe(replacement);
    expect(stayApiService.getStays).toHaveBeenCalledTimes(2);
  });

  it('renders one compact period and omits night, economic, and notes detail from records', () => {
    createComponent();

    const compiled = fixture.nativeElement as HTMLElement;
    const rowText = compiled.querySelector('#stay-stay-1')?.textContent ?? '';
    expect(rowText).toContain('Milo');
    expect(rowText).toContain('Turing');
    expect(rowText).toContain('Ada Lovelace');
    expect(rowText).toContain(component.formatPeriod(reservedStay));
    expect(rowText).toContain(component.getStayStatus(reservedStay));
    expect(rowText).not.toContain('Needs quiet room');
    expect(rowText).not.toContain('7 nights');
    expect(rowText).not.toContain('50');
    expect(rowText).not.toContain('100');
    const paymentGroup = compiled.querySelector(
      `[role="group"][aria-label="${component.text().stays.filters.paymentAriaLabel}"]`,
    );
    expect(paymentGroup).not.toBeNull();
    expect(paymentGroup?.querySelectorAll('mat-checkbox')).toHaveLength(4);
    expect(paymentGroup?.textContent).toContain(component.text().stays.filters.outstandingOnly);
  });

  it('composes authoritative payment filters and retains them across refresh', () => {
    createComponent();

    component.setPaymentConditionVisibility('NO_PAYMENT', false);
    component.setPaymentConditionVisibility('FULL_PAYMENT', false);
    component.setOutstandingOnly(true);
    fixture.detectChanges();

    expect(component.filteredStays().map((stay) => stay.stayId)).toEqual(['stay-3']);

    component.setSearchFilters({ catId: 'cat-1', ownerId: null });
    expect(component.filteredStays()).toEqual([]);
    component.setSearchFilters({ catId: 'cat-3', ownerId: null });
    expect(component.filteredStays().map((stay) => stay.stayId)).toEqual(['stay-3']);

    component.setSearchFilters({ catId: null, ownerId: 'owner-1' });
    expect(component.filteredStays()).toEqual([]);
    component.setSearchFilters({ catId: null, ownerId: 'owner-2' });
    expect(component.filteredStays().map((stay) => stay.stayId)).toEqual(['stay-3']);
    component.setSearchFilters({ catId: null, ownerId: null });

    component.setStatusVisibility('checked-out', false);
    fixture.detectChanges();
    expect(component.filteredStays()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain(
      component.text().stays.overview.emptyFiltered,
    );

    component.setStatusVisibility('checked-out', true);
    component.loadStays();
    fixture.detectChanges();

    expect(stayApiService.getStays).toHaveBeenCalledTimes(2);
    expect(component.paymentFilters().outstandingOnly).toBe(true);
    expect(component.filteredStays().map((stay) => stay.stayId)).toEqual(['stay-3']);
  });

  it('clears payment dimensions independently and never infers outstanding eligibility', () => {
    createComponent();

    component.setPaymentConditionVisibility('NO_PAYMENT', false);
    component.setPaymentConditionVisibility('PARTIAL_PAYMENT', false);
    component.setPaymentConditionVisibility('FULL_PAYMENT', false);
    expect(component.filteredStays()).toEqual([]);

    component.setPaymentConditionVisibility('PARTIAL_PAYMENT', true);
    component.setOutstandingOnly(true);
    expect(component.filteredStays().map((stay) => stay.stayId)).toEqual(['stay-3']);

    component.setOutstandingOnly(false);
    expect(component.filteredStays().map((stay) => stay.stayId)).toEqual(['stay-3']);

    component.setPaymentConditionVisibility('NO_PAYMENT', true);
    expect(component.filteredStays().map((stay) => stay.stayId)).toContain('stay-2');
    component.setOutstandingOnly(true);
    expect(component.filteredStays().map((stay) => stay.stayId)).not.toContain('stay-2');
  });

  it('filters stays by status visibility and shows empty states outside the Material table', async () => {
    createComponent();

    component.setStatusVisibility('reserved', false);
    component.setStatusVisibility('checked-in', false);
    component.setStatusVisibility('checked-out', false);
    component.setStatusVisibility('cancelled', false);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      component.text().stays.overview.emptyFiltered,
    );
    expect(fixture.nativeElement.querySelector('table[mat-table]')).toBeNull();

    TestBed.resetTestingModule();
    stayApiService.getStays.mockReturnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [StaysOverviewPage],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: StayApiService, useValue: stayApiService },
        {
          provide: StayStatusVisibilityPreferencesService,
          useValue: visibilityPreferencesService,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap({})),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StaysOverviewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(component.text().stays.overview.empty);
    expect(fixture.nativeElement.querySelector('table[mat-table]')).toBeNull();
  });
});
