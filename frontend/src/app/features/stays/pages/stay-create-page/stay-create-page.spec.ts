import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { Cat } from '../../../cats/models/cat.model';
import { CatApiService } from '../../../cats/services/cat-api.service';
import { Owner } from '../../../owners/models/owner.model';
import { OwnerApiService } from '../../../owners/services/owner-api.service';
import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { StayCreatePage } from './stay-create-page';

describe('StayCreatePage', () => {
  let component: StayCreatePage;
  let fixture: ComponentFixture<StayCreatePage>;
  let queryParams: Record<string, string>;
  let dialogClosed: Subject<boolean | undefined>;

  const owners: Owner[] = [
    {
      id: 'owner-1',
      fullName: 'Ada Lovelace',
      address: null,
      primaryPhone: '555-1111',
      secondaryPhone: null,
      secondaryPhoneName: null,
      instagram: null,
      facebook: null,
    },
    {
      id: 'owner-2',
      fullName: 'Grace Hopper',
      address: null,
      primaryPhone: '555-2222',
      secondaryPhone: null,
      secondaryPhoneName: null,
      instagram: null,
      facebook: null,
    },
  ];

  const cats: Cat[] = [
    {
      id: 'cat-1',
      name: 'Milo',
      birthDate: '2020-01-02',
      sex: 'MALE',
      breed: null,
      coat: null,
      color: null,
      foodBrand: null,
      litterBrand: null,
      personality: null,
      lastInternalDewormerName: null,
      lastInternalDewormingDate: null,
      lastExternalDewormerName: null,
      lastExternalDewormingDate: null,
      lastTripleFelineDate: null,
      lastRabiesDate: null,
      ownerId: 'owner-1',
      ownerName: 'Ada Lovelace',
      vetId: null,
      vetName: null,
    },
    {
      id: 'cat-2',
      name: 'Luna',
      birthDate: '2021-03-04',
      sex: 'FEMALE',
      breed: null,
      coat: null,
      color: null,
      foodBrand: null,
      litterBrand: null,
      personality: null,
      lastInternalDewormerName: null,
      lastInternalDewormingDate: null,
      lastExternalDewormerName: null,
      lastExternalDewormingDate: null,
      lastTripleFelineDate: null,
      lastRabiesDate: null,
      ownerId: 'owner-1',
      ownerName: 'Ada Lovelace',
      vetId: null,
      vetName: null,
    },
    {
      id: 'cat-3',
      name: 'Pixel',
      birthDate: '2022-05-06',
      sex: 'FEMALE',
      breed: null,
      coat: null,
      color: null,
      foodBrand: null,
      litterBrand: null,
      personality: null,
      lastInternalDewormerName: null,
      lastInternalDewormingDate: null,
      lastExternalDewormerName: null,
      lastExternalDewormingDate: null,
      lastTripleFelineDate: null,
      lastRabiesDate: null,
      ownerId: 'owner-2',
      ownerName: 'Grace Hopper',
      vetId: null,
      vetName: null,
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
    getOwners: vi.fn(),
  };

  const catApiService = {
    getCats: vi.fn(),
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
    ownerApiService.getOwners.mockReturnValue(of(owners));
    catApiService.getCats.mockReturnValue(of(cats));
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
          provide: CatApiService,
          useValue: catApiService,
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
  }

  function prepareConfirmedPricing(): void {
    component.pricingPreview.set(pricingPreview);
    component.agreedAmount.set('100');
    component.confirmPricing();
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

  it('renders Material stay create fields, owner selector, link and submit action', () => {
    createComponent();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('mat-form-field')).toHaveLength(4);
    expect(compiled.querySelectorAll('app-entity-selector')).toHaveLength(1);
    expect(compiled.querySelector('input[name="startAt"]')).not.toBeNull();
    expect(compiled.querySelector('input[name="endAt"]')).not.toBeNull();
    expect(compiled.querySelector('textarea[name="notes"]')).not.toBeNull();
    expect(compiled.querySelector('button[mat-flat-button]')).not.toBeNull();
    expect(compiled.querySelector('a[mat-stroked-button]')).not.toBeNull();
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
    expect(component.filteredCats().map((cat) => cat.id)).toEqual(['cat-1', 'cat-2']);
    expect(fixture.nativeElement.querySelectorAll('mat-checkbox')).toHaveLength(2);
  });

  it('does not create a stay when no cat is selected', () => {
    createComponent();
    component.selectedOwnerId.set('owner-1');
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

    component.selectedOwnerId.set('owner-1');
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

    component.selectedOwnerId.set('owner-1');
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

    component.selectedOwnerId.set('owner-1');
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

    component.selectedOwnerId.set('owner-1');
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

    component.selectedOwnerId.set('owner-1');
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

    component.selectedOwnerId.set('owner-1');
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
    component.selectedOwnerId.set('owner-1');
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
    component.selectedOwnerId.set('owner-1');
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
