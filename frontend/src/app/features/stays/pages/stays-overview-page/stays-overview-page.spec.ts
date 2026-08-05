import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { StayStatusVisibilityPreferencesService } from '../../services/stay-status-visibility-preferences.service';
import { StaysOverviewPage } from './stays-overview-page';

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
    catIds: ['cat-1'],
    ownerId: 'owner-1',
    ownerName: 'Ada Lovelace',
    cats: [{ catId: 'cat-1', name: 'Milo' }],
    retainedNightlyRate: '50',
    suggestedAmount: '100',
    agreedAmount: '100',
    totalPaid: '0',
    remainingAmount: '100',
  };

  const cancelledStay: Stay = {
    ...reservedStay,
    stayId: 'stay-2',
    cancelledAt: '2026-07-03T11:00:00',
    notes: null,
    cats: [{ catId: 'cat-2', name: 'Luna' }],
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

  let component: StaysOverviewPage;
  let fixture: ComponentFixture<StaysOverviewPage>;
  let queryParams: Record<string, string>;

  beforeEach(async () => {
    vi.resetAllMocks();
    queryParams = { selectedStayId: 'stay-1' };
    stayApiService.getStays.mockReturnValue(of([reservedStay, cancelledStay]));
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
        provideRouter([{ path: 'stays/:id/edit', component: StaysOverviewPage }]),
        { provide: StayApiService, useValue: stayApiService },
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

  it('renders stay rows through a Material table with selected row and existing actions', () => {
    createComponent();

    const compiled = fixture.nativeElement as HTMLElement;
    const headerText = [...compiled.querySelectorAll('th')]
      .map((header) => header.textContent?.trim())
      .join(' ');

    expect(compiled.querySelector('table[mat-table]')).not.toBeNull();
    expect(headerText).toContain(component.text().stays.overview.table.state);
    expect(headerText).toContain(component.text().stays.overview.table.actions);
    expect(compiled.textContent).toContain('Ada Lovelace');
    expect(compiled.textContent).toContain('Needs quiet room');
    expect(compiled.querySelector('#stay-stay-1.selected-row')).not.toBeNull();
    expect(compiled.querySelectorAll('mat-checkbox.status-filter')).toHaveLength(
      component.statusFilterOptions.length,
    );
    expect(compiled.querySelector('a[mat-flat-button]')?.textContent).toContain(
      component.text().stays.overview.create,
    );
    expect(compiled.querySelector('a[mat-stroked-button]')?.textContent).toContain(
      component.text().stays.overview.edit,
    );
    expect(compiled.textContent).toContain(component.text().stays.overview.alreadyCancelled);
  });

  it('preserves cancellation confirmation, API call, reload, and error behavior', () => {
    createComponent();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const cancelButton = [
      ...fixture.nativeElement.querySelectorAll('button[mat-stroked-button]'),
    ].find((button) =>
      button.textContent?.includes(component.text().stays.overview.cancel),
    ) as HTMLButtonElement;

    cancelButton.click();
    fixture.detectChanges();

    expect(confirmSpy).toHaveBeenCalledOnce();
    expect(stayApiService.cancelStay).toHaveBeenCalledWith('stay-1');
    expect(stayApiService.getStays).toHaveBeenCalledTimes(2);

    stayApiService.cancelStay.mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            error: { stay: 'cannot cancel' },
          }),
      ),
    );

    cancelButton.click();
    fixture.detectChanges();

    expect(component.error()).toBe('stay: cannot cancel');
    expect(fixture.nativeElement.textContent).toContain('stay: cannot cancel');
  });

  it('filters stays by status visibility and shows empty states outside the Material table', async () => {
    createComponent();

    component.setStatusVisibility('reserved', false);
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
  it('shows admin correction across statuses and replaces economics from the backend response', () => {
    TestBed.inject(AuthSessionService).login(
      { username: 'admin', role: 'ADMIN' },
      { username: 'admin', password: 'secret' },
    );
    const updatedStay = {
      ...cancelledStay,
      agreedAmount: '9999999999999999999',
      remainingAmount: '9999999999999999999',
    };
    stayApiService.correctAgreedAmount.mockReturnValue(of(updatedStay));
    fixture = TestBed.createComponent(StaysOverviewPage);
    component = fixture.componentInstance;
    component.startCorrection(cancelledStay);
    component.correctionAmount.set('9999999999999999999');
    component.correctionReason.set('Signed correction');

    component.submitCorrection(cancelledStay);

    expect(stayApiService.correctAgreedAmount).toHaveBeenCalledWith('stay-2', {
      agreedAmount: '9999999999999999999',
      reason: 'Signed correction',
    });
    expect(component.stays().find((stay) => stay.stayId === 'stay-2')?.agreedAmount).toBe(
      '9999999999999999999',
    );
  });
});
