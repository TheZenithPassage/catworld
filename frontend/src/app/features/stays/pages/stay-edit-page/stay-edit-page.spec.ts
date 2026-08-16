import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { NightlyReferenceRateApiService } from '../../../nightly-rates/services/nightly-reference-rate-api.service';
import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { StayEditPage } from './stay-edit-page';

describe('StayEditPage', () => {
  let component: StayEditPage;
  let fixture: ComponentFixture<StayEditPage>;
  let routeParams: Record<string, string>;
  let dialogClosed: Subject<boolean | undefined>;

  const stay: Stay = {
    stayId: 'stay-1',
    startAt: '2099-01-02T10:00:00',
    endAt: '2099-01-09T10:00:00',
    numberOfNights: 7,
    cancelledAt: null,
    createdAt: '2026-07-02T10:00:00',
    updatedAt: '2026-07-02T10:00:00',
    notes: 'needs quiet room',
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

  const closedStay: Stay = {
    ...stay,
    startAt: '2020-01-02T10:00:00',
    endAt: '2020-01-09T10:00:00',
  };

  const stayApiService = {
    getStayById: vi.fn(),
    updateStay: vi.fn(),
    previewDateChangePricing: vi.fn(),
  };

  const nightlyReferenceRateApiService = {
    getCurrentRates: vi.fn(),
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

  beforeEach(async () => {
    vi.resetAllMocks();
    router.navigate.mockResolvedValue(true);
    authSessionService.hasRole.mockReturnValue(true);
    dialogClosed = new Subject<boolean | undefined>();
    matDialog.open.mockReturnValue({
      afterClosed: () => dialogClosed.asObservable(),
    });
    routeParams = { id: 'stay-1' };
    stayApiService.getStayById.mockReturnValue(of(stay));
    stayApiService.previewDateChangePricing.mockReturnValue(
      of({
        pricingDecisionRequired: false,
        currentNumberOfNights: 7,
        currentAgreedAmount: '100',
        numberOfNights: 7,
        retainedNightlyRate: '50',
        suggestedAmount: '100',
        confirmation: null,
      }),
    );
    nightlyReferenceRateApiService.getCurrentRates.mockReturnValue(of([]));
    window.scrollTo = vi.fn();

    await TestBed.configureTestingModule({
      imports: [StayEditPage],
      providers: [
        provideNoopAnimations(),
        {
          provide: StayApiService,
          useValue: stayApiService,
        },
        {
          provide: NightlyReferenceRateApiService,
          useValue: nightlyReferenceRateApiService,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              get paramMap() {
                return convertToParamMap(routeParams);
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
    fixture = TestBed.createComponent(StayEditPage);
    component = fixture.componentInstance;
  }

  it('adopts and confirms the active repricing suggestion without updating the stay', () => {
    stayApiService.previewDateChangePricing.mockReturnValue(
      of({
        pricingDecisionRequired: true,
        currentNumberOfNights: 7,
        currentAgreedAmount: '100',
        numberOfNights: 8,
        retainedNightlyRate: '50',
        suggestedAmount: '400',
        confirmation: {
          previousNumberOfNights: 7,
          previousAgreedAmount: '100',
          numberOfNights: 8,
          retainedNightlyRate: '50',
          suggestedAmount: '400',
        },
      }),
    );
    createComponent();
    component.pricingReason.set('Previous reason');
    component.stalePricing.set(true);
    fixture.detectChanges();
    const scrollIntoView = vi.fn();
    const submitButton = (fixture.nativeElement as HTMLElement).querySelector(
      '#update-stay-submit',
    ) as HTMLElement;
    submitButton.scrollIntoView = scrollIntoView;

    const button = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find(
      (candidate) =>
        candidate.textContent?.trim() === component.text().stays.pricing.useSuggestedAmount,
    );
    button?.click();

    expect(button).toBeDefined();
    expect(component.agreedAmount()).toBe('400');
    expect(component.pricingReason()).toBe('');
    expect(component.pricingConfirmed()).toBe(true);
    expect(component.stalePricing()).toBe(false);
    expect(stayApiService.updateStay).not.toHaveBeenCalled();
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

    component.onAgreedAmountChange('401');
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

  it('does not offer suggested amount adoption when repricing has no suggestion', () => {
    stayApiService.previewDateChangePricing.mockReturnValue(
      of({
        pricingDecisionRequired: true,
        currentNumberOfNights: 7,
        currentAgreedAmount: '100',
        numberOfNights: 8,
        retainedNightlyRate: null,
        suggestedAmount: null,
        confirmation: {
          previousNumberOfNights: 7,
          previousAgreedAmount: '100',
          numberOfNights: 8,
          retainedNightlyRate: null,
          suggestedAmount: null,
        },
      }),
    );
    createComponent();
    fixture.detectChanges();

    const actions = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')];
    expect(
      actions.some(
        (candidate) =>
          candidate.textContent?.trim() === component.text().stays.pricing.useSuggestedAmount,
      ),
    ).toBe(false);
  });

  it('loads the stay and renders Material edit fields and actions', async () => {
    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(stayApiService.getStayById).toHaveBeenCalledWith('stay-1');
    expect(compiled.querySelectorAll('mat-form-field')).toHaveLength(3);
    expect((compiled.querySelector('input[name="startAt"]') as HTMLInputElement).value).toBe(
      '2099-01-02T10:00',
    );
    expect(compiled.querySelector('.stay-summary')?.textContent).toContain('Milo, Luna');
    expect(compiled.querySelector('button[mat-flat-button]')).not.toBeNull();
    expect(compiled.querySelector('a[mat-stroked-button]')).not.toBeNull();
  });

  it('loads closed stays as read-only while keeping payment history available', () => {
    stayApiService.getStayById.mockReturnValue(of(closedStay));

    createComponent();
    fixture.detectChanges();

    expect(component.stayLoaded()).toBe(true);
    expect(component.canEditStay()).toBe(false);
    expect(component.stay()).toEqual(closedStay);
    expect(fixture.nativeElement.querySelector('app-stay-payments')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('form.stay-form')).toBeNull();
  });

  it('hides payment management and submits ordinary edits for a historical null agreement', () => {
    const historicalStay: Stay = {
      ...stay,
      agreedAmount: null,
      totalPaid: '0',
      remainingAmount: null,
      paymentCondition: 'NO_PAYMENT',
      outstandingCollectionEligible: false,
      payments: [],
    };
    stayApiService.getStayById.mockReturnValue(of(historicalStay));
    stayApiService.previewDateChangePricing.mockReturnValue(
      of({
        pricingDecisionRequired: false,
        currentNumberOfNights: 7,
        currentAgreedAmount: null,
        numberOfNights: 7,
        retainedNightlyRate: '50',
        suggestedAmount: '350',
        confirmation: null,
      }),
    );
    stayApiService.updateStay.mockReturnValue(of(historicalStay));

    createComponent();
    fixture.detectChanges();

    expect(component.agreedAmount()).toBe('');
    expect(fixture.nativeElement.querySelector('app-stay-payments')).toBeNull();

    component.notes.set('Updated historical note');
    component.submit();

    expect(stayApiService.updateStay).toHaveBeenCalledWith('stay-1', {
      startAt: '2099-01-02T10:00',
      endAt: '2099-01-09T10:00',
      notes: 'Updated historical note',
      overrideVaccineConflicts: false,
    });
  });

  it('keeps payment management for zero agreements and known agreements without retained rates', () => {
    for (const knownAgreementStay of [
      { ...stay, agreedAmount: '0', remainingAmount: '0' },
      { ...stay, retainedNightlyRate: null, suggestedAmount: null },
    ]) {
      stayApiService.getStayById.mockReturnValue(of(knownAgreementStay));
      createComponent();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-stay-payments')).not.toBeNull();
      fixture.destroy();
    }
  });

  it('does not update when the end date is not after the start date', () => {
    createComponent();

    component.startAt.set('2099-01-09T10:00');
    component.endAt.set('2099-01-02T10:00');

    component.submit();
    fixture.detectChanges();

    expect(stayApiService.updateStay).not.toHaveBeenCalled();
    expect(component.error()).toBe(component.text().stays.edit.errors.endAfterStart);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      component.text().stays.edit.errors.endAfterStart,
    );
  });

  it('completes an accepted non-extending update without opening the vaccine dialog', () => {
    createComponent();
    stayApiService.updateStay.mockReturnValue(of(stay));

    component.startAt.set('2099-01-02T10:00');
    component.endAt.set('2099-01-09T10:00');
    component.notes.set('  ');

    component.submit();

    expect(stayApiService.updateStay).toHaveBeenCalledWith('stay-1', {
      startAt: '2099-01-02T10:00',
      endAt: '2099-01-09T10:00',
      notes: null,
      overrideVaccineConflicts: false,
    });
    expect(matDialog.open).not.toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/stays']);
    expect(component.submitting()).toBe(false);
  });

  it('shows update errors through shared Material error state', () => {
    createComponent();
    stayApiService.updateStay.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: { startAt: 'overlaps another stay' },
            status: 400,
          }),
      ),
    );

    component.startAt.set('2099-01-02T10:00');
    component.endAt.set('2099-01-09T10:00');

    component.submit();
    fixture.detectChanges();

    expect(component.error()).toBe('startAt: overlaps another stay');
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'startAt: overlaps another stay',
    );
  });

  it('preserves values when an administrator cancels and keeps a later update normal', () => {
    createComponent();
    stayApiService.updateStay
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              error: vaccineConflict,
              status: 409,
            }),
        ),
      )
      .mockReturnValueOnce(of(stay));

    component.startAt.set('2099-02-02T10:00');
    component.endAt.set('2099-02-09T10:00');
    component.notes.set('  updated notes  ');

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

    expect(stayApiService.updateStay).toHaveBeenCalledTimes(1);
    expect(component.startAt()).toBe('2099-02-02T10:00');
    expect(component.endAt()).toBe('2099-02-09T10:00');
    expect(component.notes()).toBe('  updated notes  ');

    component.submit();

    expect(stayApiService.updateStay).toHaveBeenNthCalledWith(2, 'stay-1', {
      startAt: '2099-02-02T10:00',
      endAt: '2099-02-09T10:00',
      notes: 'updated notes',
      overrideVaccineConflicts: false,
    });
  });

  it('retries once with the captured update when an administrator continues', () => {
    createComponent();
    stayApiService.updateStay
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              error: vaccineConflict,
              status: 409,
            }),
        ),
      )
      .mockReturnValueOnce(of(stay));

    component.startAt.set('2099-02-02T10:00');
    component.endAt.set('2099-02-09T10:00');
    component.notes.set('updated notes');

    component.submit();
    dialogClosed.next(true);

    expect(stayApiService.updateStay).toHaveBeenNthCalledWith(2, 'stay-1', {
      startAt: '2099-02-02T10:00',
      endAt: '2099-02-09T10:00',
      notes: 'updated notes',
      overrideVaccineConflicts: true,
    });
    expect(stayApiService.updateStay).toHaveBeenCalledTimes(2);
    expect(router.navigate).toHaveBeenCalledWith(['/stays']);
  });

  it('does not retry an update for staff even if the dialog produces a continue result', () => {
    authSessionService.hasRole.mockReturnValue(false);
    createComponent();
    stayApiService.updateStay.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: vaccineConflict,
            status: 409,
          }),
      ),
    );

    component.startAt.set('2099-02-02T10:00');
    component.endAt.set('2099-02-09T10:00');

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

    expect(stayApiService.updateStay).toHaveBeenCalledTimes(1);
  });

  it('uses the generic error path when the administrator update retry fails', () => {
    createComponent();
    stayApiService.updateStay
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
      .mockReturnValueOnce(of(stay));

    component.startAt.set('2099-02-02T10:00');
    component.endAt.set('2099-02-09T10:00');

    component.submit();
    dialogClosed.next(true);

    expect(matDialog.open).toHaveBeenCalledTimes(1);
    expect(component.error()).toBe('Stay still conflicts');
    expect(component.submitting()).toBe(false);

    component.submit();

    expect(stayApiService.updateStay).toHaveBeenNthCalledWith(
      3,
      'stay-1',
      expect.objectContaining({ overrideVaccineConflicts: false }),
    );
  });

  it('preserves an approved override only through stale recovery for unchanged edit dates', () => {
    stayApiService.updateStay
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
      .mockReturnValueOnce(of(stay));
    createComponent();

    component.submit();
    dialogClosed.next(true);
    component.submit();

    expect(stayApiService.updateStay).toHaveBeenNthCalledWith(
      3,
      'stay-1',
      expect.objectContaining({ overrideVaccineConflicts: true }),
    );
  });

  it('clears stale-recovery override approval when edit dates change', () => {
    stayApiService.updateStay
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
      .mockReturnValueOnce(of(stay));
    createComponent();

    component.submit();
    dialogClosed.next(true);
    component.onEndAtChange('2099-01-10T10:00');
    component.submit();

    expect(stayApiService.updateStay).toHaveBeenNthCalledWith(
      3,
      'stay-1',
      expect.objectContaining({ overrideVaccineConflicts: false }),
    );
  });

  it('submits an admin repricing decision only when the backend requires it', () => {
    stayApiService.previewDateChangePricing.mockReturnValue(
      of({
        pricingDecisionRequired: true,
        currentNumberOfNights: 7,
        currentAgreedAmount: '100',
        numberOfNights: 8,
        retainedNightlyRate: '50',
        suggestedAmount: '400',
        confirmation: {
          previousNumberOfNights: 7,
          previousAgreedAmount: '100',
          numberOfNights: 8,
          retainedNightlyRate: '50',
          suggestedAmount: '400',
        },
      }),
    );
    stayApiService.updateStay.mockReturnValue(of(stay));
    createComponent();
    component.agreedAmount.set('9999999999999999999');
    component.pricingReason.set('Administrative agreement');
    component.confirmPricing();

    component.submit();

    expect(stayApiService.updateStay).toHaveBeenCalledWith(
      'stay-1',
      expect.objectContaining({
        pricingDecision: {
          agreedAmount: '9999999999999999999',
          reason: 'Administrative agreement',
        },
        confirmation: expect.objectContaining({ previousNumberOfNights: 7, numberOfNights: 8 }),
      }),
    );
  });

  it('preserves the entered pricing decision when stale recovery loads a fresh preview', () => {
    const initialPreview = {
      pricingDecisionRequired: true,
      currentNumberOfNights: 7,
      currentAgreedAmount: '100',
      numberOfNights: 8,
      retainedNightlyRate: '50',
      suggestedAmount: '400',
      confirmation: {
        previousNumberOfNights: 7,
        previousAgreedAmount: '100',
        numberOfNights: 8,
        retainedNightlyRate: '50',
        suggestedAmount: '400',
      },
    };
    const freshPreview = {
      ...initialPreview,
      suggestedAmount: '450',
      confirmation: { ...initialPreview.confirmation, suggestedAmount: '450' },
    };
    stayApiService.previewDateChangePricing
      .mockReturnValueOnce(of(initialPreview))
      .mockReturnValueOnce(of(freshPreview));
    stayApiService.updateStay.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { code: 'STALE_PRICING_CONFIRMATION' },
          }),
      ),
    );
    createComponent();
    component.agreedAmount.set('375');
    component.pricingReason.set('Client retained this amount');
    component.confirmPricing();

    component.submit();

    expect(stayApiService.updateStay).toHaveBeenCalledTimes(1);
    expect(stayApiService.previewDateChangePricing).toHaveBeenCalledTimes(2);
    expect(component.pricingPreview()).toEqual(freshPreview);
    expect(component.agreedAmount()).toBe('375');
    expect(component.pricingReason()).toBe('Client retained this amount');
    expect(component.pricingConfirmed()).toBe(false);
    expect(component.stalePricing()).toBe(true);
  });

  it('presents the administrator-required state for a rejected staff pricing preview', () => {
    authSessionService.hasRole.mockReturnValue(false);
    stayApiService.previewDateChangePricing.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 403 })),
    );

    createComponent();

    expect(component.previewError()).toBe(component.text().stays.pricing.errors.adminRequired);
    expect(component.pricingPreview()).toBeNull();
  });

  it('clears an active pricing-preview error when the language changes', () => {
    stayApiService.previewDateChangePricing.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    createComponent();

    expect(component.previewError()).toBe(component.text().stays.pricing.errors.previewFailed);

    TestBed.inject(I18nService).toggleLanguage();
    TestBed.flushEffects();

    expect(component.previewError()).toBeNull();
  });
});
