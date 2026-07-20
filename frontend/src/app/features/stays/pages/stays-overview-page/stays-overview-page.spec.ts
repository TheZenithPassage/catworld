import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { StaySearchFiltersComponent } from '../../components/stay-search-filters/stay-search-filters';
import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { StayStatusVisibilityPreferencesService } from '../../services/stay-status-visibility-preferences.service';
import { StaysOverviewPage } from './stays-overview-page';

describe('StaysOverviewPage', () => {
  const reservedStay: Stay = {
    stayId: 'stay-1',
    startAt: '2099-01-02T10:00:00',
    endAt: '2099-01-09T10:00:00',
    cancelledAt: null,
    createdAt: '2026-07-03T10:00:00',
    updatedAt: '2026-07-03T10:00:00',
    notes: 'Needs quiet room',
    catIds: ['cat-1'],
    ownerId: 'owner-1',
    ownerName: 'Ada Lovelace',
    cats: [{ catId: 'cat-1', name: 'Milo' }],
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

  it('clears its rendered error without resetting filters, loaded rows, or pending work', () => {
    createComponent();
    const cancellationRequest = new Subject<Stay>();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const i18nService = TestBed.inject(I18nService);
    const initialLanguage = i18nService.language();
    const searchFiltersComponent = fixture.debugElement.query(
      By.directive(StaySearchFiltersComponent),
    ).componentInstance as StaySearchFiltersComponent;
    const catOption = searchFiltersComponent
      .catOptions()
      .find((option) => option.catId === 'cat-1');

    expect(catOption).toBeDefined();

    searchFiltersComponent.selectCat(catOption!);
    component.setStatusVisibility('cancelled', false);
    stayApiService.cancelStay.mockReturnValueOnce(cancellationRequest.asObservable());
    component.cancelStay(reservedStay);
    component.error.set('Error in the previous language');
    fixture.detectChanges();

    const loadedStays = component.stays();
    const searchFilters = component.searchFilters();
    const statusVisibility = component.statusVisibility();

    expect(confirmSpy).toHaveBeenCalledOnce();
    expect(component.error()).toBe('Error in the previous language');
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Error in the previous language',
    );
    expect(component.cancellingStayId()).toBe('stay-1');
    expect(stayApiService.getStays).toHaveBeenCalledTimes(1);
    expect(stayApiService.cancelStay).toHaveBeenCalledTimes(1);

    i18nService.toggleLanguage();
    fixture.detectChanges();

    expect(i18nService.language()).not.toBe(initialLanguage);
    expect(component.error()).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(component.searchFilters()).toEqual(searchFilters);
    expect(searchFiltersComponent.selectedCatId()).toBe('cat-1');
    expect(searchFiltersComponent.catSearch()).toBe(catOption!.label);
    expect(component.statusVisibility()).toEqual(statusVisibility);
    expect(component.stays()).toBe(loadedStays);
    expect(component.filteredStays()).toEqual([reservedStay]);
    expect(component.cancellingStayId()).toBe('stay-1');
    expect(fixture.nativeElement.querySelector('#stay-stay-1')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('#stay-stay-2')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('button[mat-stroked-button][disabled]'),
    ).not.toBeNull();
    expect(stayApiService.getStays).toHaveBeenCalledTimes(1);
    expect(stayApiService.cancelStay).toHaveBeenCalledTimes(1);

    cancellationRequest.complete();
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
});
