import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router, RouterLink } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { RemoteEntitySelector } from '../../../../shared/entity-lookup/remote-entity-selector';
import { OwnerLookup } from '../../../owners/models/owner.model';
import { OwnerApiService } from '../../../owners/services/owner-api.service';
import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { StayCreatePage } from './stay-create-page';

describe('StayCreatePage', () => {
  let component: StayCreatePage;
  let fixture: ComponentFixture<StayCreatePage>;
  let queryParams: Record<string, string>;
  let dialogClosed: Subject<boolean | undefined>;

  const owners: OwnerLookup[] = [
    {
      id: 'owner-1',
      fullName: 'Ada Lovelace',
      currentCats: [
        { id: 'cat-1', name: 'Milo' },
        { id: 'cat-2', name: 'Luna' },
      ],
    },
    {
      id: 'owner-2',
      fullName: 'Grace Hopper',
      currentCats: [{ id: 'cat-3', name: 'Pixel' }],
    },
  ];

  const createdStay: Stay = {
    stayId: 'stay-1',
    startAt: '2099-01-02T10:00',
    endAt: '2099-01-09T10:00',
    numberOfNights: 7,
    cancelledAt: null,
    createdAt: '2026-07-02T10:00:00',
    updatedAt: '2026-07-02T10:00:00',
    notes: null,
    catIds: ['cat-1', 'cat-2'],
    ownerId: 'owner-1',
    ownerName: 'Ada Lovelace',
    cats: [
      { catId: 'cat-1', name: 'Milo' },
      { catId: 'cat-2', name: 'Luna' },
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

  const ownerApiService = {
    searchOwners: vi.fn(),
    getOwnerLookup: vi.fn(),
  };

  const stayApiService = {
    createStay: vi.fn(),
    previewCreationPricing: vi.fn(),
  };

  const router = {
    navigate: vi.fn(),
  };

  const authSessionService = {
    hasRole: vi.fn(),
  };

  const matDialog = {
    open: vi.fn(),
  };

  const vaccineConflict = {
    code: 'VACCINE_VALIDITY_CONFLICT',
    violations: [
      {
        catId: 'cat-1',
        catName: 'Milo',
        vaccineType: 'RABIES',
        reason: 'EXPIRED',
        vaccinatedOn: '2025-07-01',
        expiresOn: '2026-07-01',
      },
    ],
  };

  const pricingPreview = {
    numberOfNights: 7,
    retainedNightlyRate: '50',
    suggestedAmount: '100',
    confirmation: { numberOfNights: 7, retainedNightlyRate: '50', suggestedAmount: '100' },
  };
  const confirmedPricingRequest = {
    pricingDecision: { agreedAmount: '100', reason: null },
    confirmation: pricingPreview.confirmation,
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    router.navigate.mockResolvedValue(true);
    authSessionService.hasRole.mockReturnValue(true);
    dialogClosed = new Subject<boolean | undefined>();
    matDialog.open.mockReturnValue({
      afterClosed: () => dialogClosed.asObservable(),
    });
    queryParams = {};
    ownerApiService.searchOwners.mockReturnValue(
      of({ items: owners, page: 0, pageSize: 5, totalElements: owners.length }),
    );
    ownerApiService.getOwnerLookup.mockImplementation((id: string) =>
      of(owners.find((owner) => owner.id === id) ?? owners[0]),
    );
    stayApiService.previewCreationPricing.mockReturnValue(of(pricingPreview));

    await TestBed.configureTestingModule({
      imports: [StayCreatePage],
      providers: [
        provideNoopAnimations(),
        {
          provide: OwnerApiService,
          useValue: ownerApiService,
        },
        {
          provide: StayApiService,
          useValue: stayApiService,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              get queryParamMap() {
                return convertToParamMap(queryParams);
              },
            },
          },
        },
        {
          provide: Router,
          useValue: router,
        },
        {
          provide: AuthSessionService,
          useValue: authSessionService,
        },
        {
          provide: MatDialog,
          useValue: matDialog,
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(StayCreatePage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  function prepareConfirmedPricing(): void {
    component.pricingPreview.set(pricingPreview);
    component.agreedAmount.set('100');
    component.confirmPricing();
  }

  function selectOwner(owner = owners[0]): void {
    fixture.debugElement.query(By.directive(RemoteEntitySelector)).componentInstance.select(owner);
  }

  it('adopts and confirms an available zero suggestion without creating the stay', () => {
    createComponent();
    component.pricingPreview.set({
      ...pricingPreview,
      suggestedAmount: '0',
      confirmation: { ...pricingPreview.confirmation, suggestedAmount: '0' },
    });
    component.agreedAmount.set('250');
    component.pricingReason.set('Previous reason');
    component.stalePricing.set(true);
    fixture.detectChanges();
    const scrollIntoView = vi.fn();
    const submitButton = (fixture.nativeElement as HTMLElement).querySelector(
      '#create-stay-submit',
    ) as HTMLElement;
    submitButton.scrollIntoView = scrollIntoView;

    const button = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find(
      (candidate) =>
        candidate.textContent?.trim() === component.text().stays.pricing.useSuggestedAmount,
    );
    button?.click();

    expect(button).toBeDefined();
    expect(component.agreedAmount()).toBe('0');
    expect(component.pricingReason()).toBe('');
    expect(component.pricingConfirmed()).toBe(true);
    expect(component.stalePricing()).toBe(false);
    expect(stayApiService.createStay).not.toHaveBeenCalled();
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' });
    fixture.detectChanges();
    const confirmedButton = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ].find(
      (candidate) => candidate.textContent?.trim() === component.text().stays.pricing.confirmed,
    ) as HTMLButtonElement;
    expect(confirmedButton.disabled).toBe(true);
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('textarea[name="pricingReason"]')
        ?.getAttribute('placeholder'),
    ).toBe(component.text().stays.pricing.reasonSuggestedPlaceholder);

    component.onAgreedAmountChange('1');
    fixture.detectChanges();
    const reasonRequiredButton = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ].find(
      (candidate) =>
        candidate.textContent?.trim() === component.text().stays.pricing.confirmAfterReason,
    ) as HTMLButtonElement;
    expect(reasonRequiredButton.disabled).toBe(true);

    component.pricingReason.set('Different agreement');
    fixture.detectChanges();
    expect(component.pricingConfirmed()).toBe(false);
    const confirmButton = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ].find(
      (candidate) => candidate.textContent?.trim() === component.text().stays.pricing.confirm,
    ) as HTMLButtonElement;
    expect(confirmButton.disabled).toBe(false);
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('textarea[name="pricingReason"]')
        ?.getAttribute('placeholder'),
    ).toBe(component.text().stays.pricing.reasonDifferentPlaceholder);
    confirmButton.click();
    expect(scrollIntoView).toHaveBeenCalledTimes(2);
  });

  it('does not offer suggested amount adoption when creation preview has no suggestion', () => {
    createComponent();
    component.pricingPreview.set({ ...pricingPreview, suggestedAmount: null });
    fixture.detectChanges();

    const actions = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')];
    expect(
      actions.some(
        (candidate) =>
          candidate.textContent?.trim() === component.text().stays.pricing.useSuggestedAmount,
      ),
    ).toBe(false);
  });

  it('renders Material stay create fields, owner select, link and submit action', () => {
    createComponent();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('mat-form-field')).toHaveLength(4);
    expect(compiled.querySelectorAll('app-remote-entity-selector')).toHaveLength(1);
    expect(compiled.querySelector('input[name="startAt"]')).not.toBeNull();
    expect(compiled.querySelector('input[name="endAt"]')).not.toBeNull();
    expect(compiled.querySelector('textarea[name="notes"]')).not.toBeNull();
    expect(compiled.querySelector('button[mat-flat-button]')).not.toBeNull();
    const ownerLink = fixture.debugElement.query(By.directive(RouterLink)).injector.get(RouterLink);
    expect(ownerLink.queryParams).toEqual({ returnTo: '/stays/new' });

    selectOwner();
    fixture.detectChanges();
    const catLink = fixture.debugElement
      .query(By.css('.create-cat-option'))
      .injector.get(RouterLink);
    expect(catLink.queryParams).toEqual({ returnTo: '/stays/new', ownerId: 'owner-1' });
  });

  it('preserves owner and cat query-param preselection', () => {
    queryParams = {
      ownerId: 'owner-1',
      catId: 'cat-1',
    };

    createComponent();
    fixture.detectChanges();

    expect(component.selectedOwnerId()).toBe('owner-1');
    expect(component.selectedCatIds()).toEqual(['cat-1']);
    expect(component.availableCats().map((cat) => cat.id)).toEqual(['cat-1', 'cat-2']);
    expect(fixture.nativeElement.querySelectorAll('mat-checkbox')).toHaveLength(2);
  });

  it('renders immediately without loading Owner or Cat catalogs', () => {
    createComponent();

    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
    expect(ownerApiService.searchOwners).not.toHaveBeenCalled();
    expect(ownerApiService.getOwnerLookup).not.toHaveBeenCalled();
  });

  it('ignores an incompatible returned cat and keeps Owner resolution field-local', () => {
    queryParams = { ownerId: 'owner-1', catId: 'cat-3' };

    createComponent();

    expect(ownerApiService.getOwnerLookup).toHaveBeenCalledWith('owner-1');
    expect(component.selectedOwner()).toEqual(owners[0]);
    expect(component.selectedCatIds()).toEqual([]);
    expect(stayApiService.previewCreationPricing).not.toHaveBeenCalled();
  });

  it('guards return-query Owner resolution against later lookup interaction', () => {
    const resolution = new Subject<OwnerLookup>();
    ownerApiService.getOwnerLookup.mockReturnValue(resolution);
    queryParams = { ownerId: 'owner-1', catId: 'cat-1' };
    createComponent();
    const selector = fixture.debugElement.query(By.directive(RemoteEntitySelector))
      .componentInstance as RemoteEntitySelector<OwnerLookup>;

    component.onOwnerLookupInput();
    selector.inputChanged({ target: { value: 'Grace' } } as unknown as Event);
    selector.select(owners[1]);
    resolution.next(owners[0]);

    expect(component.selectedOwner()).toEqual(owners[1]);
    expect(component.selectedCatIds()).toEqual([]);
    expect(component.availableCats()).toEqual(owners[1].currentCats);
  });

  it('keeps a failed returned Owner lookup field-local and the form usable', () => {
    ownerApiService.getOwnerLookup.mockReturnValue(throwError(() => new Error('missing')));
    queryParams = { ownerId: 'missing-owner', catId: 'cat-1' };

    createComponent();

    expect(component.selectedOwner()).toBeNull();
    expect(component.error()).toBeNull();
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
    expect(
      fixture.debugElement.query(By.directive(RemoteEntitySelector)).componentInstance.error(),
    ).toBe(component.text().entityLookup.loadFailed);
  });

  it('fully resets Owner-dependent state while preserving entered values and rejects a late preview', () => {
    const previewResponse = new Subject<typeof pricingPreview>();
    stayApiService.previewCreationPricing.mockReturnValue(previewResponse);
    createComponent();
    selectOwner();
    component.startAt.set('2099-01-02T10:00');
    component.endAt.set('2099-01-09T10:00');
    component.notes.set('Keep note');
    component.agreedAmount.set('123');
    component.pricingReason.set('Keep reason');
    component.selectedCatIds.set(['cat-1']);
    component.onCatToggle('cat-2', true);
    component.pricingPreview.set(pricingPreview);
    component.pricingConfirmed.set(true);
    component.stalePricing.set(true);
    component.error.set('Keep mutation failure');

    selectOwner(owners[1]);
    previewResponse.next(pricingPreview);

    expect(component.selectedOwner()).toEqual(owners[1]);
    expect(component.selectedCatIds()).toEqual([]);
    expect(component.pricingPreview()).toBeNull();
    expect(component.previewLoading()).toBe(false);
    expect(component.pricingConfirmed()).toBe(false);
    expect(component.stalePricing()).toBe(false);
    expect(component.error()).toBe('Keep mutation failure');
    expect(component.startAt()).toBe('2099-01-02T10:00');
    expect(component.endAt()).toBe('2099-01-09T10:00');
    expect(component.notes()).toBe('Keep note');
    expect(component.agreedAmount()).toBe('123');
    expect(component.pricingReason()).toBe('Keep reason');
  });

  it('ignores late stale-pricing recovery after Owner invalidation', () => {
    const createResponse = new Subject<Stay>();
    stayApiService.createStay.mockReturnValue(createResponse);
    createComponent();
    selectOwner();
    component.selectedCatIds.set(['cat-1']);
    component.startAt.set('2099-01-02T10:00');
    component.endAt.set('2099-01-09T10:00');
    prepareConfirmedPricing();
    component.submit();

    fixture.debugElement.query(By.directive(RemoteEntitySelector)).componentInstance.clear();
    createResponse.error(
      new HttpErrorResponse({ status: 409, error: { code: 'STALE_PRICING_CONFIRMATION' } }),
    );

    expect(component.submitting()).toBe(false);
    expect(component.stalePricing()).toBe(false);
    expect(component.pricingConfirmed()).toBe(false);
    expect(component.pricingPreview()).toBeNull();
    expect(component.error()).toBeNull();
    expect(stayApiService.previewCreationPricing).not.toHaveBeenCalled();
  });

  it('does not open a vaccine dialog for a late conflict after Owner invalidation', () => {
    const createResponse = new Subject<Stay>();
    stayApiService.createStay.mockReturnValue(createResponse);
    createComponent();
    selectOwner();
    component.selectedCatIds.set(['cat-1']);
    component.startAt.set('2099-01-02T10:00');
    component.endAt.set('2099-01-09T10:00');
    prepareConfirmedPricing();
    component.submit();

    fixture.debugElement.query(By.directive(RemoteEntitySelector)).componentInstance.clear();
    createResponse.error(new HttpErrorResponse({ status: 409, error: vaccineConflict }));

    expect(component.submitting()).toBe(false);
    expect(matDialog.open).not.toHaveBeenCalled();
    expect(component.error()).toBeNull();
  });

  it('does not continue an old vaccine dialog after clearing and recreating the same basis', () => {
    stayApiService.createStay
      .mockReturnValueOnce(
        throwError(() => new HttpErrorResponse({ status: 409, error: vaccineConflict })),
      )
      .mockReturnValueOnce(of(createdStay));
    createComponent();
    selectOwner();
    component.selectedCatIds.set(['cat-1']);
    component.startAt.set('2099-01-02T10:00');
    component.endAt.set('2099-01-09T10:00');
    prepareConfirmedPricing();
    component.submit();

    const selector = fixture.debugElement.query(By.directive(RemoteEntitySelector))
      .componentInstance as RemoteEntitySelector<OwnerLookup>;
    selector.clear();
    selector.select(owners[0]);
    component.selectedCatIds.set(['cat-1']);
    prepareConfirmedPricing();
    dialogClosed.next(true);

    expect(stayApiService.createStay).toHaveBeenCalledTimes(1);
  });

  it('does not create a stay when no cat is selected', () => {
    createComponent();
    selectOwner();
    fixture.detectChanges();

    component.submit();
    fixture.detectChanges();

    expect(stayApiService.createStay).not.toHaveBeenCalled();
    expect(component.error()).toBe(component.text().stays.create.errors.selectAtLeastOneCat);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      component.text().stays.create.errors.selectAtLeastOneCat,
    );
  });

  it('creates a stay with the current payload shape and returns to stays', () => {
    createComponent();
    stayApiService.createStay.mockReturnValue(of(createdStay));

    selectOwner();
    component.selectedCatIds.set(['cat-1', 'cat-2']);
    component.startAt.set('2099-01-02T10:00');
    component.endAt.set('2099-01-09T10:00');
    component.notes.set('  needs quiet room  ');
    prepareConfirmedPricing();

    component.submit();

    expect(stayApiService.createStay).toHaveBeenCalledWith({
      catIds: ['cat-1', 'cat-2'],
      startAt: '2099-01-02T10:00',
      endAt: '2099-01-09T10:00',
      notes: 'needs quiet room',
      overrideVaccineConflicts: false,
      ...confirmedPricingRequest,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/stays']);
    expect(component.submitting()).toBe(false);
  });

  it('shows backend validation errors through shared Material error state', () => {
    createComponent();
    stayApiService.createStay.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: { endAt: 'must be after startAt' },
            status: 400,
          }),
      ),
    );

    selectOwner();
    component.selectedCatIds.set(['cat-1']);
    component.startAt.set('2099-01-02T10:00');
    component.endAt.set('2099-01-09T10:00');
    prepareConfirmedPricing();

    component.submit();
    fixture.detectChanges();

    expect(component.error()).toBe('endAt: must be after startAt');
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'endAt: must be after startAt',
    );
  });

  it('preserves values when an administrator cancels and keeps a later submit normal', () => {
    createComponent();
    stayApiService.createStay
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              error: vaccineConflict,
              status: 409,
            }),
        ),
      )
      .mockReturnValueOnce(of(createdStay));

    selectOwner();
    component.selectedCatIds.set(['cat-1']);
    component.startAt.set('2099-01-02T10:00');
    component.endAt.set('2099-01-09T10:00');
    component.notes.set('  quiet room  ');
    prepareConfirmedPricing();

    component.submit();

    expect(matDialog.open).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        data: {
          violations: vaccineConflict.violations,
          canOverride: true,
        },
      }),
    );

    dialogClosed.next(false);

    expect(stayApiService.createStay).toHaveBeenCalledTimes(1);
    expect(component.selectedCatIds()).toEqual(['cat-1']);
    expect(component.startAt()).toBe('2099-01-02T10:00');
    expect(component.endAt()).toBe('2099-01-09T10:00');
    expect(component.notes()).toBe('  quiet room  ');

    component.submit();

    expect(stayApiService.createStay).toHaveBeenNthCalledWith(2, {
      catIds: ['cat-1'],
      startAt: '2099-01-02T10:00',
      endAt: '2099-01-09T10:00',
      notes: 'quiet room',
      overrideVaccineConflicts: false,
      ...confirmedPricingRequest,
    });
  });

  it('retries once with the captured payload when an administrator continues', () => {
    createComponent();
    stayApiService.createStay
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              error: vaccineConflict,
              status: 409,
            }),
        ),
      )
      .mockReturnValueOnce(of(createdStay));

    selectOwner();
    component.selectedCatIds.set(['cat-1', 'cat-2']);
    component.startAt.set('2099-01-02T10:00');
    component.endAt.set('2099-01-09T10:00');
    component.notes.set('needs quiet room');
    prepareConfirmedPricing();

    component.submit();
    dialogClosed.next(true);

    expect(stayApiService.createStay).toHaveBeenNthCalledWith(2, {
      catIds: ['cat-1', 'cat-2'],
      startAt: '2099-01-02T10:00',
      endAt: '2099-01-09T10:00',
      notes: 'needs quiet room',
      overrideVaccineConflicts: true,
      ...confirmedPricingRequest,
    });
    expect(stayApiService.createStay).toHaveBeenCalledTimes(2);
    expect(router.navigate).toHaveBeenCalledWith(['/stays']);
  });

  it('does not retry for staff even if the dialog produces a continue result', () => {
    authSessionService.hasRole.mockReturnValue(false);
    createComponent();
    stayApiService.createStay.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: vaccineConflict,
            status: 409,
          }),
      ),
    );

    selectOwner();
    component.selectedCatIds.set(['cat-1']);
    component.startAt.set('2099-01-02T10:00');
    component.endAt.set('2099-01-09T10:00');
    prepareConfirmedPricing();

    component.submit();

    expect(matDialog.open).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        data: {
          violations: vaccineConflict.violations,
          canOverride: false,
        },
      }),
    );

    dialogClosed.next(true);

    expect(stayApiService.createStay).toHaveBeenCalledTimes(1);
  });

  it('uses the generic error path when the administrator override retry fails', () => {
    createComponent();
    stayApiService.createStay
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              error: vaccineConflict,
              status: 409,
            }),
        ),
      )
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              error: 'Stay still conflicts',
              status: 409,
            }),
        ),
      )
      .mockReturnValueOnce(of(createdStay));

    selectOwner();
    component.selectedCatIds.set(['cat-1']);
    component.startAt.set('2099-01-02T10:00');
    component.endAt.set('2099-01-09T10:00');
    prepareConfirmedPricing();

    component.submit();
    dialogClosed.next(true);

    expect(matDialog.open).toHaveBeenCalledTimes(1);
    expect(component.error()).toBe('Stay still conflicts');
    expect(component.submitting()).toBe(false);

    component.submit();

    expect(stayApiService.createStay).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ overrideVaccineConflicts: false }),
    );
  });

  it('preserves an approved override only through stale recovery for the unchanged request', () => {
    stayApiService.createStay
      .mockReturnValueOnce(
        throwError(() => new HttpErrorResponse({ error: vaccineConflict, status: 409 })),
      )
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              error: { code: 'STALE_PRICING_CONFIRMATION' },
              status: 409,
            }),
        ),
      )
      .mockReturnValueOnce(of(createdStay));
    createComponent();
    selectOwner();
    component.selectedCatIds.set(['cat-1']);
    component.startAt.set('2099-01-02T10:00');
    component.endAt.set('2099-01-09T10:00');
    prepareConfirmedPricing();

    component.submit();
    dialogClosed.next(true);
    component.confirmPricing();
    component.submit();

    expect(stayApiService.createStay).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({ overrideVaccineConflicts: true }),
    );
  });

  it('clears stale-recovery override approval when the creation request basis changes', () => {
    stayApiService.createStay
      .mockReturnValueOnce(
        throwError(() => new HttpErrorResponse({ error: vaccineConflict, status: 409 })),
      )
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              error: { code: 'STALE_PRICING_CONFIRMATION' },
              status: 409,
            }),
        ),
      )
      .mockReturnValueOnce(of(createdStay));
    createComponent();
    selectOwner();
    component.selectedCatIds.set(['cat-1']);
    component.startAt.set('2099-01-02T10:00');
    component.endAt.set('2099-01-09T10:00');
    prepareConfirmedPricing();

    component.submit();
    dialogClosed.next(true);
    component.onCatToggle('cat-2', true);
    component.confirmPricing();
    component.submit();

    expect(stayApiService.createStay).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        catIds: ['cat-1', 'cat-2'],
        overrideVaccineConflicts: false,
      }),
    );
  });

  it('clears an active pricing-preview error when the language changes', () => {
    stayApiService.previewCreationPricing.mockReturnValue(throwError(() => new Error('offline')));
    queryParams = { ownerId: 'owner-1', catId: 'cat-1' };
    createComponent();

    expect(component.previewError()).toBe(component.text().stays.pricing.errors.previewFailed);

    TestBed.inject(I18nService).toggleLanguage();
    TestBed.flushEffects();

    expect(component.previewError()).toBeNull();
  });

  it('preserves an exact 19-digit agreement and requires reconfirmation after a stale conflict', () => {
    queryParams = { ownerId: 'owner-1', catId: 'cat-1' };
    const exactPreview = {
      numberOfNights: 0,
      retainedNightlyRate: '9999999999999999999',
      suggestedAmount: '0',
      confirmation: {
        numberOfNights: 0,
        retainedNightlyRate: '9999999999999999999',
        suggestedAmount: '0',
      },
    };
    stayApiService.previewCreationPricing.mockReturnValue(of(exactPreview));
    stayApiService.createStay.mockReturnValue(
      throwError(
        () => new HttpErrorResponse({ status: 409, error: { code: 'STALE_PRICING_CONFIRMATION' } }),
      ),
    );
    createComponent();
    component.agreedAmount.set('9999999999999999999');
    component.pricingReason.set('Client agreement');
    component.confirmPricing();

    component.submit();

    expect(stayApiService.createStay).toHaveBeenCalledWith(
      expect.objectContaining({
        pricingDecision: { agreedAmount: '9999999999999999999', reason: 'Client agreement' },
        confirmation: exactPreview.confirmation,
      }),
    );
    expect(stayApiService.createStay).toHaveBeenCalledTimes(1);
    expect(component.stalePricing()).toBe(true);
    expect(component.pricingConfirmed()).toBe(false);
    expect(component.agreedAmount()).toBe('9999999999999999999');
    expect(stayApiService.previewCreationPricing).toHaveBeenCalledTimes(2);
  });
});
