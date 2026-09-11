import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import {
  NightlyReferenceRate,
  NightlyReferenceRateApiService,
  NightlyRateThreshold,
} from '../../../nightly-rates/services/nightly-reference-rate-api.service';
import { TransferRateApiService } from '../../../nightly-rates/services/transfer-rate-api.service';
import {
  VaccineConflictDialog,
  VaccineConflictDialogData,
} from '../../components/vaccine-conflict-dialog/vaccine-conflict-dialog';
import {
  isVaccineConflictError,
  isStalePricingConfirmationError,
  Stay,
  StayDatePricingPreview,
  UpdateStayRequest,
  VaccineConflictResponse,
} from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { calculateStayNights } from '../../utils/stay-nights.util';
import { canModifyStay } from '../../utils/stay-status.util';
import { isValidWholeMoney, sameWholeMoney } from '../../utils/stay-money.util';

@Component({
  selector: 'app-stay-editor',
  imports: [
    FormsModule,
    MatButton,
    MatCheckbox,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    MatProgressSpinner,
    UiStateComponent,
  ],
  templateUrl: './stay-editor.html',
  styleUrl: '../../pages/stay-create-page/stay-create-page.scss',
})
export class StayEditor {
  private readonly stayApiService = inject(StayApiService);
  private readonly nightlyReferenceRateApiService = inject(NightlyReferenceRateApiService);
  private readonly transferRateApiService = inject(TransferRateApiService);
  private readonly i18nService = inject(I18nService);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly dialog = inject(MatDialog);

  readonly text = this.i18nService.text;
  readonly entity = input.required<Stay>();
  readonly showCancel = input(false);
  readonly saved = output<Stay>();
  readonly cancelled = output<void>();
  readonly submittingChanged = output<boolean>();

  readonly ownerName = signal('');
  readonly catNames = signal('');

  readonly startAt = signal('');
  readonly endAt = signal('');
  readonly notes = signal('');
  readonly agreedAmount = signal('');
  readonly pricingReason = signal('');
  readonly transferAssistanceActive = signal(false);
  readonly arrivalTransferRequired = signal(false);
  readonly departureTransferRequired = signal(false);
  readonly transferWaived = signal(false);
  readonly pricingReasonContext = signal<'untouched' | 'manual' | 'suggested'>('untouched');
  readonly pricingPreview = signal<StayDatePricingPreview | null>(null);
  readonly currentNightlyRates = signal<NightlyReferenceRate[]>([]);
  readonly currentTransferRate = signal<string | null>(null);
  readonly displayedTransferRate = computed(() => {
    const preview = this.pricingPreview();

    if (preview?.retainedTransferRate !== null && preview?.retainedTransferRate !== undefined) {
      return preview.retainedTransferRate;
    }

    return !this.arrivalTransferRequired() && !this.departureTransferRequired()
      ? this.currentTransferRate()
      : null;
  });
  readonly workingRetainedNightlyRate = signal<string | null>(null);
  readonly selectedNightlyRate = signal<string | null>(null);
  readonly selectedTransferRate = signal<string | null>(null);
  readonly previewLoading = signal(false);
  readonly previewError = createLanguageResetError(this.i18nService.language);
  readonly pricingConfirmed = signal(false);
  readonly stalePricing = signal(false);
  readonly numberOfNights = computed(() => calculateStayNights(this.startAt(), this.endAt()));
  readonly nightCountLabel = computed(() => {
    const numberOfNights = this.numberOfNights();

    if (numberOfNights === null) {
      return '';
    }

    const unit =
      numberOfNights === 1 ? this.text().stays.nights.singular : this.text().stays.nights.plural;

    return `${numberOfNights} ${unit}`;
  });

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly error = createLanguageResetError(this.i18nService.language);
  readonly notesError = createLanguageResetError(this.i18nService.language);
  readonly notesErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => this.notesError() !== null,
  };

  updateNotes(value: string): void {
    this.notes.set(value);
    this.notesError.set(value.length > 10000 ? this.text().stays.edit.errors.notesTooLong : null);
  }
  readonly stayLoaded = signal(false);
  readonly stay = signal<Stay | null>(null);
  readonly canEditStay = computed(() => {
    const current = this.stay();
    return current !== null && canModifyStay(current);
  });
  readonly isAdmin = computed(() => this.authSessionService.hasRole('ADMIN'));
  readonly applicableCurrentRate = computed(() => {
    const preview = this.pricingPreview();
    const catCount = this.stay()?.cats.length ?? 0;

    if (
      !preview?.pricingDecisionRequired ||
      preview.currentNumberOfNights === preview.numberOfNights ||
      catCount < 1
    ) {
      return null;
    }

    const threshold = Math.min(catCount, 3) as NightlyRateThreshold;
    const currentRate = this.currentNightlyRates().find(
      (rate) => rate.minimumCatCount === threshold,
    )?.nightlyRate;

    if (
      currentRate === null ||
      currentRate === undefined ||
      !isValidWholeMoney(currentRate) ||
      /^0+$/.test(currentRate) ||
      (this.stay()?.retainedNightlyRate !== null &&
        this.stay()?.retainedNightlyRate !== undefined &&
        sameWholeMoney(currentRate, this.stay()!.retainedNightlyRate!))
    ) {
      return null;
    }

    return currentRate;
  });
  readonly applicableCurrentTransferRate = computed(() => {
    const preview = this.pricingPreview();
    const stay = this.stay();
    const currentRate = this.currentTransferRate();

    if (!preview?.pricingDecisionRequired || stay === null || currentRate === null) {
      return null;
    }

    const existingLegs =
      (stay.arrivalTransferRequired ? 1 : 0) + (stay.departureTransferRequired ? 1 : 0);
    const requestedLegs =
      (this.arrivalTransferRequired() ? 1 : 0) + (this.departureTransferRequired() ? 1 : 0);
    const transferChanged =
      this.arrivalTransferRequired() !== Boolean(stay.arrivalTransferRequired) ||
      this.departureTransferRequired() !== Boolean(stay.departureTransferRequired) ||
      this.transferWaived() !== Boolean(stay.transferWaived);
    const previousTransferSuggestion = stay.transferSuggestedAmount ?? '0';

    if (
      existingLegs === 0 ||
      requestedLegs === 0 ||
      !transferChanged ||
      !isValidWholeMoney(currentRate) ||
      /^0+$/.test(currentRate) ||
      (stay.retainedTransferRate !== null &&
        stay.retainedTransferRate !== undefined &&
        sameWholeMoney(currentRate, stay.retainedTransferRate)) ||
      (this.selectedTransferRate() === null &&
        sameWholeMoney(preview.transferSuggestedAmount, previousTransferSuggestion))
    ) {
      return null;
    }

    return currentRate;
  });
  readonly workingSuggestedAmount = computed(() => {
    const preview = this.pricingPreview();
    return preview?.suggestedAmount ?? null;
  });
  readonly retainedRateActionLabel = computed(() => {
    const current = this.applicableCurrentRate();
    if (current === null) return null;
    const original = this.stay()?.retainedNightlyRate ?? null;
    const working = this.workingRetainedNightlyRate();
    if (working === null || !sameWholeMoney(working, current)) {
      return this.text().stays.pricing.useCurrentRate;
    }
    return original === null
      ? this.text().stays.pricing.returnWithoutRate
      : this.text().stays.pricing.useOriginalRate;
  });
  readonly transferRateActionLabel = computed(() => {
    const current = this.applicableCurrentTransferRate();
    if (current === null) return null;
    return this.selectedTransferRate() !== null
      ? this.text().stays.pricing.useCapturedTransferRate
      : this.text().stays.pricing.useCurrentTransferRate;
  });
  readonly reasonRequired = computed(() => {
    const suggestion = this.workingSuggestedAmount();
    return (
      suggestion !== null &&
      suggestion !== undefined &&
      !sameWholeMoney(this.agreedAmount(), suggestion)
    );
  });
  readonly decisionValid = computed(
    () =>
      isValidWholeMoney(this.agreedAmount()) &&
      (!this.reasonRequired() || !!this.pricingReason().trim()),
  );
  readonly amountValid = computed(() => isValidWholeMoney(this.agreedAmount()));
  readonly pricingReasonPlaceholder = computed(() => {
    if (this.pricingReasonContext() === 'suggested') {
      return this.text().stays.pricing.reasonSuggestedPlaceholder;
    }
    if (this.pricingReasonContext() === 'manual') {
      return this.text().stays.pricing.reasonDifferentPlaceholder;
    }
    return '';
  });

  private get stayId(): string {
    return this.entity().stayId;
  }
  private previewRequestSequence = 0;
  private vaccineOverrideRecoveryBasis: string | null = null;
  private agreedAmountBeforeCurrentRate: string | null = null;

  constructor() {
    this.loadCurrentNightlyRates();
    this.loadCurrentTransferRate();
    effect(() => {
      const entity = this.entity();
      untracked(() => this.setFormValues(entity));
    });
  }

  private loadCurrentNightlyRates(onSettled?: () => void): void {
    this.nightlyReferenceRateApiService.getCurrentRates().subscribe({
      next: (rates) => {
        this.currentNightlyRates.set(rates);
        onSettled?.();
      },
      error: () => {
        this.currentNightlyRates.set([]);
        onSettled?.();
      },
    });
  }

  private loadCurrentTransferRate(onSettled?: () => void): void {
    this.transferRateApiService.getCurrentRate().subscribe({
      next: ({ transferRate }) => {
        this.currentTransferRate.set(transferRate);
        onSettled?.();
      },
      error: () => {
        this.currentTransferRate.set(null);
        onSettled?.();
      },
    });
  }

  private reloadCurrentPricingRates(onSettled: () => void): void {
    let remaining = 2;
    const settleOne = (): void => {
      remaining -= 1;
      if (remaining === 0) onSettled();
    };
    this.loadCurrentNightlyRates(settleOne);
    this.loadCurrentTransferRate(settleOne);
  }

  submit(): void {
    this.error.set(null);
    this.notesError.set(null);

    if (this.notes().length > 10000) {
      this.notesError.set(this.text().stays.edit.errors.notesTooLong);
      return;
    }

    if (!this.stayLoaded()) {
      this.showError(this.text().stays.edit.errors.dataNotLoaded);
      return;
    }

    if (!this.canEditStay()) {
      this.showError(this.text().stays.edit.errors.closedCannotBeModified);
      return;
    }

    if (!this.stayId) {
      this.showError(this.text().stays.edit.errors.stayIdMissing);
      return;
    }

    if (!this.startAt() || !this.endAt()) {
      this.showError(this.text().stays.edit.errors.datesRequired);
      return;
    }

    if (new Date(this.endAt()) <= new Date(this.startAt())) {
      this.showError(this.text().stays.edit.errors.endAfterStart);
      return;
    }

    const preview = this.pricingPreview();
    if (this.previewLoading() || !preview) {
      this.showError(this.text().stays.pricing.errors.previewRequired);
      return;
    }

    if (
      preview.pricingDecisionRequired &&
      (!this.isAdmin() || !this.pricingConfirmed() || !this.decisionValid())
    ) {
      this.showError(
        this.isAdmin()
          ? this.text().stays.pricing.errors.confirmationRequired
          : this.text().stays.pricing.errors.adminRequired,
      );
      return;
    }

    const basis = this.currentPreviewBasis();
    const overrideVaccineConflicts = this.vaccineOverrideRecoveryBasis === basis;
    const request: UpdateStayRequest = {
      startAt: this.startAt(),
      endAt: this.endAt(),
      notes: this.notes().trim() || null,
      overrideVaccineConflicts,
      ...this.transferInputs(),
      ...(preview.pricingDecisionRequired
        ? {
            pricingDecision: {
              agreedAmount: this.agreedAmount(),
              reason: this.pricingReason().trim() || null,
            },
            confirmation: preview.confirmation,
          }
        : {}),
    };

    this.saveStay(request, !overrideVaccineConflicts, basis);
  }

  private saveStay(request: UpdateStayRequest, showVaccineConflict: boolean, basis: string): void {
    if (!this.stayId) {
      this.showError(this.text().stays.edit.errors.stayIdMissing);
      return;
    }

    this.setSubmitting(true);

    this.stayApiService.updateStay(this.stayId, request).subscribe({
      next: (updated) => {
        this.setSubmitting(false);
        this.stay.set(updated);
        this.saved.emit(updated);
      },
      error: (error: unknown) => {
        if (isStalePricingConfirmationError(error)) {
          const preserveVaccineOverride = request.overrideVaccineConflicts;
          this.setSubmitting(false);
          this.stalePricing.set(true);
          this.pricingConfirmed.set(false);
          this.workingRetainedNightlyRate.set(this.stay()?.retainedNightlyRate ?? null);
          this.selectedNightlyRate.set(null);
          this.selectedTransferRate.set(null);
          this.agreedAmountBeforeCurrentRate = null;
          this.vaccineOverrideRecoveryBasis = preserveVaccineOverride
            ? this.currentPreviewBasis()
            : null;
          this.showError(this.text().stays.pricing.errors.stale);
          this.reloadCurrentPricingRates(() => this.refreshPricingPreview());
          return;
        }
        if (showVaccineConflict && isVaccineConflictError(error)) {
          this.setSubmitting(false);
          this.openVaccineConflictDialog(error.error, request, basis);
          return;
        }

        if (request.overrideVaccineConflicts) {
          this.clearVaccineOverrideRecovery();
        }
        this.showError(this.getApiErrorMessage(error, this.text().stays.edit.errors.updateFailed));
        this.setSubmitting(false);
      },
    });
  }

  private openVaccineConflictDialog(
    conflict: VaccineConflictResponse,
    request: UpdateStayRequest,
    basis: string,
  ): void {
    const canOverride = this.authSessionService.hasRole('ADMIN');
    const data: VaccineConflictDialogData = {
      violations: conflict.violations,
      canOverride,
    };

    this.dialog
      .open<VaccineConflictDialog, VaccineConflictDialogData, boolean>(VaccineConflictDialog, {
        data,
        width: '36rem',
        maxWidth: 'calc(100vw - 2rem)',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed !== true || !canOverride || !this.authSessionService.hasRole('ADMIN')) {
          return;
        }

        this.saveStay({ ...request, overrideVaccineConflicts: true }, false, basis);
      });
  }

  private setFormValues(stay: Stay): void {
    this.stay.set(stay);
    this.stayLoaded.set(true);
    this.ownerName.set(stay.ownerName);
    this.catNames.set(stay.cats.map((cat) => cat.name).join(', '));
    this.startAt.set(this.toDateTimeLocalValue(stay.startAt));
    this.endAt.set(this.toDateTimeLocalValue(stay.endAt));
    this.notes.set(stay.notes ?? '');
    this.agreedAmount.set(stay.agreedAmount ?? '');
    this.workingRetainedNightlyRate.set(stay.retainedNightlyRate);
    this.selectedNightlyRate.set(null);
    this.selectedTransferRate.set(null);
    this.transferAssistanceActive.set(
      Boolean(stay.arrivalTransferRequired || stay.departureTransferRequired),
    );
    this.arrivalTransferRequired.set(Boolean(stay.arrivalTransferRequired));
    this.departureTransferRequired.set(Boolean(stay.departureTransferRequired));
    this.transferWaived.set(Boolean(stay.transferWaived));
    this.agreedAmountBeforeCurrentRate = null;
    this.refreshPricingPreview();
  }

  onStayChanged(stay: Stay): void {
    this.stay.set(stay);
  }

  onStartAtChange(value: string): void {
    this.clearVaccineOverrideRecovery();
    this.startAt.set(value);
    this.clearNightlySelectionWhenAdoptionIsIneligible();
    this.refreshPricingPreview(true);
  }

  onEndAtChange(value: string): void {
    this.clearVaccineOverrideRecovery();
    this.endAt.set(value);
    this.clearNightlySelectionWhenAdoptionIsIneligible();
    this.refreshPricingPreview(true);
  }

  onTransferAssistanceChange(active: boolean): void {
    this.transferAssistanceActive.set(active);

    if (active) return;

    const transferStateChanged =
      this.arrivalTransferRequired() || this.departureTransferRequired() || this.transferWaived();
    this.arrivalTransferRequired.set(false);
    this.departureTransferRequired.set(false);
    this.transferWaived.set(false);
    this.selectedTransferRate.set(null);

    if (transferStateChanged) {
      this.clearVaccineOverrideRecovery();
      this.refreshPricingPreview();
    }
  }

  onTransferChange(kind: 'arrival' | 'departure' | 'waived', value: boolean): void {
    if (kind === 'arrival') this.arrivalTransferRequired.set(value);
    else if (kind === 'departure') this.departureTransferRequired.set(value);
    else this.transferWaived.set(value);
    this.selectedTransferRate.set(null);
    this.clearVaccineOverrideRecovery();
    this.refreshPricingPreview();
  }

  onPricingDecisionChange(): void {
    this.pricingConfirmed.set(false);
  }

  onAgreedAmountChange(value: string): void {
    this.agreedAmount.set(value);
    this.pricingReasonContext.set('manual');
    this.onPricingDecisionChange();
  }

  confirmPricing(): void {
    if (
      !this.previewLoading() &&
      this.isAdmin() &&
      this.pricingPreview()?.pricingDecisionRequired &&
      this.decisionValid()
    ) {
      this.pricingConfirmed.set(true);
      this.stalePricing.set(false);
    }
  }

  toggleRetainedRate(): void {
    const currentRate = this.applicableCurrentRate();
    const originalRate = this.stay()?.retainedNightlyRate ?? null;
    const preview = this.pricingPreview();
    if (
      this.previewLoading() ||
      !this.isAdmin() ||
      currentRate === null ||
      !preview?.pricingDecisionRequired ||
      preview.currentNumberOfNights === preview.numberOfNights
    ) {
      return;
    }

    const workingRate = this.workingRetainedNightlyRate();
    if (workingRate === null || !sameWholeMoney(workingRate, currentRate)) {
      if (originalRate === null) this.agreedAmountBeforeCurrentRate = this.agreedAmount();
      this.selectedNightlyRate.set(currentRate);
      this.workingRetainedNightlyRate.set(currentRate);
    } else {
      this.selectedNightlyRate.set(null);
      this.workingRetainedNightlyRate.set(originalRate);
    }
    this.pricingReason.set('');
    this.refreshPricingPreview(false, true);
  }

  toggleTransferRate(): void {
    const currentRate = this.applicableCurrentTransferRate();
    const preview = this.pricingPreview();
    if (
      this.previewLoading() ||
      !this.isAdmin() ||
      currentRate === null ||
      !preview?.pricingDecisionRequired
    ) {
      return;
    }

    this.selectedTransferRate.set(this.selectedTransferRate() === null ? currentRate : null);
    this.pricingReason.set('');
    this.refreshPricingPreview(false, true);
  }

  private refreshPricingPreview(
    resetAgreementForNightChange = false,
    synchronizeHelperAgreement = false,
  ): void {
    if (this.pricingReasonContext() === 'suggested') this.pricingReasonContext.set('manual');
    this.pricingConfirmed.set(false);
    this.previewError.set(null);
    const sequence = ++this.previewRequestSequence;

    if (
      !this.stayId ||
      !this.startAt() ||
      !this.endAt() ||
      new Date(this.endAt()) <= new Date(this.startAt())
    ) {
      this.pricingPreview.set(null);
      this.previewLoading.set(false);
      return;
    }

    const basis = this.currentPreviewBasis();
    this.previewLoading.set(true);
    this.stayApiService
      .previewDateChangePricing(this.stayId, {
        startAt: this.startAt(),
        endAt: this.endAt(),
        ...this.transferInputs(),
        ...(this.selectedNightlyRate() !== null
          ? { selectedNightlyRate: this.selectedNightlyRate() }
          : {}),
        ...(this.selectedTransferRate() !== null
          ? { selectedTransferRate: this.selectedTransferRate() }
          : {}),
      })
      .subscribe({
        next: (preview) => {
          if (sequence !== this.previewRequestSequence || basis !== this.currentPreviewBasis())
            return;
          this.pricingPreview.set(preview);
          if (this.selectedNightlyRate() === null) {
            this.workingRetainedNightlyRate.set(preview.retainedNightlyRate);
          }
          if (
            this.selectedNightlyRate() === null &&
            this.pricingReasonContext() === 'suggested' &&
            preview.pricingDecisionRequired
          ) {
            this.agreedAmount.set(preview.suggestedAmount ?? preview.currentAgreedAmount ?? '');
          }
          if (!preview.pricingDecisionRequired) {
            this.selectedNightlyRate.set(null);
            this.selectedTransferRate.set(null);
            this.workingRetainedNightlyRate.set(this.stay()?.retainedNightlyRate ?? null);
            this.agreedAmountBeforeCurrentRate = null;
          }
          if (synchronizeHelperAgreement && preview.pricingDecisionRequired) {
            const helperAgreement = preview.suggestedAmount ?? this.agreedAmountBeforeCurrentRate;
            if (helperAgreement !== null) {
              this.agreedAmount.set(helperAgreement);
            }
            this.pricingReasonContext.set(
              preview.suggestedAmount === null ? 'manual' : 'suggested',
            );
          }
          if (resetAgreementForNightChange && preview.pricingDecisionRequired) {
            this.agreedAmount.set(preview.suggestedAmount ?? preview.currentAgreedAmount ?? '');
            this.pricingReasonContext.set(
              preview.suggestedAmount === null ? 'manual' : 'suggested',
            );
            if (this.stay()?.retainedNightlyRate === null) {
              this.agreedAmountBeforeCurrentRate = preview.currentAgreedAmount ?? '';
            }
          }
          this.previewLoading.set(false);
        },
        error: (error: unknown) => {
          if (sequence !== this.previewRequestSequence) return;
          this.pricingPreview.set(null);
          this.previewLoading.set(false);
          this.previewError.set(
            !this.isAdmin() && error instanceof HttpErrorResponse && error.status === 403
              ? this.text().stays.pricing.errors.adminRequired
              : this.text().stays.pricing.errors.previewFailed,
          );
        },
      });
  }

  private currentPreviewBasis(): string {
    return JSON.stringify([
      this.stayId,
      this.startAt(),
      this.endAt(),
      this.arrivalTransferRequired(),
      this.departureTransferRequired(),
      this.transferWaived(),
      this.selectedNightlyRate(),
      this.selectedTransferRate(),
    ]);
  }

  private transferInputs(): Record<string, boolean> {
    const stay = this.stay();
    return {
      ...(this.arrivalTransferRequired() || stay?.arrivalTransferRequired
        ? { arrivalTransferRequired: this.arrivalTransferRequired() }
        : {}),
      ...(this.departureTransferRequired() || stay?.departureTransferRequired
        ? { departureTransferRequired: this.departureTransferRequired() }
        : {}),
      ...(this.transferWaived() || stay?.transferWaived
        ? { transferWaived: this.transferWaived() }
        : {}),
    };
  }

  private clearNightlySelectionWhenAdoptionIsIneligible(): void {
    if (this.numberOfNights() === this.stay()?.numberOfNights) {
      this.selectedNightlyRate.set(null);
      this.workingRetainedNightlyRate.set(this.stay()?.retainedNightlyRate ?? null);
      this.agreedAmountBeforeCurrentRate = null;
    }
  }

  private clearVaccineOverrideRecovery(): void {
    this.vaccineOverrideRecoveryBasis = null;
  }

  private toDateTimeLocalValue(value: string): string {
    return value.slice(0, 16);
  }

  private showError(message: string): void {
    this.error.set(message);
  }

  private setSubmitting(value: boolean): void {
    this.submitting.set(value);
    this.submittingChanged.emit(value);
  }

  private getApiErrorMessage(error: unknown, fallbackMessage: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallbackMessage;
    }

    const responseBody: unknown = error.error;

    if (!responseBody) {
      return fallbackMessage;
    }

    if (typeof responseBody === 'string') {
      return responseBody.trim() || fallbackMessage;
    }

    if (this.isValidationErrorMap(responseBody)) {
      const messages = Object.entries(responseBody).map(
        ([field, message]) => `${field}: ${message}`,
      );

      return messages.length > 0 ? messages.join('. ') : fallbackMessage;
    }

    return fallbackMessage;
  }

  private isValidationErrorMap(value: unknown): value is Record<string, string> {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      Object.values(value).every((message) => typeof message === 'string')
    );
  }
}
