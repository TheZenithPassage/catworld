import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { StayPayments } from '../../components/stay-payments/stay-payments';
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
  selector: 'app-stay-edit-page',
  imports: [
    FormsModule,
    MatButton,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    RouterLink,
    UiStateComponent,
    StayPayments,
  ],
  templateUrl: './stay-edit-page.html',
  styleUrl: './stay-edit-page.scss',
})
export class StayEditPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly stayApiService = inject(StayApiService);
  private readonly i18nService = inject(I18nService);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly dialog = inject(MatDialog);

  readonly text = this.i18nService.text;

  readonly ownerName = signal('');
  readonly catNames = signal('');

  readonly startAt = signal('');
  readonly endAt = signal('');
  readonly notes = signal('');
  readonly agreedAmount = signal('');
  readonly pricingReason = signal('');
  readonly pricingPreview = signal<StayDatePricingPreview | null>(null);
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
  readonly stayLoaded = signal(false);
  readonly stay = signal<Stay | null>(null);
  readonly canEditStay = computed(() => {
    const current = this.stay();
    return current !== null && canModifyStay(current);
  });
  readonly isAdmin = computed(() => this.authSessionService.hasRole('ADMIN'));
  readonly reasonRequired = computed(() => {
    const suggestion = this.pricingPreview()?.suggestedAmount;
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

  private readonly stayId = this.route.snapshot.paramMap.get('id');
  private previewRequestSequence = 0;
  private vaccineOverrideRecoveryBasis: string | null = null;

  constructor() {
    this.loadStay();
  }

  loadStay(): void {
    this.error.set(null);
    this.stayLoaded.set(false);

    if (!this.stayId) {
      this.showError(this.text().stays.edit.errors.stayIdMissing);
      return;
    }

    this.loading.set(true);

    this.stayApiService.getStayById(this.stayId).subscribe({
      next: (stay) => {
        this.stay.set(stay);
        this.setFormValues(stay);
        this.stayLoaded.set(true);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.showError(this.getApiErrorMessage(error, this.text().stays.edit.errors.loadFailed));
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    this.error.set(null);

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
    if (!preview) {
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

    this.submitting.set(true);

    this.stayApiService.updateStay(this.stayId, request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/stays']);
      },
      error: (error: unknown) => {
        if (isStalePricingConfirmationError(error)) {
          this.vaccineOverrideRecoveryBasis = request.overrideVaccineConflicts ? basis : null;
          this.submitting.set(false);
          this.stalePricing.set(true);
          this.pricingConfirmed.set(false);
          this.showError(this.text().stays.pricing.errors.stale);
          this.refreshPricingPreview();
          return;
        }
        if (showVaccineConflict && isVaccineConflictError(error)) {
          this.submitting.set(false);
          this.openVaccineConflictDialog(error.error, request, basis);
          return;
        }

        if (request.overrideVaccineConflicts) {
          this.clearVaccineOverrideRecovery();
        }
        this.showError(this.getApiErrorMessage(error, this.text().stays.edit.errors.updateFailed));
        this.submitting.set(false);
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
    this.ownerName.set(stay.ownerName);
    this.catNames.set(stay.cats.map((cat) => cat.name).join(', '));
    this.startAt.set(this.toDateTimeLocalValue(stay.startAt));
    this.endAt.set(this.toDateTimeLocalValue(stay.endAt));
    this.notes.set(stay.notes ?? '');
    this.agreedAmount.set(stay.agreedAmount ?? '');
    this.refreshPricingPreview();
  }

  onStayChanged(stay: Stay): void {
    this.stay.set(stay);
  }

  onStartAtChange(value: string): void {
    this.clearVaccineOverrideRecovery();
    this.startAt.set(value);
    this.refreshPricingPreview();
  }

  onEndAtChange(value: string): void {
    this.clearVaccineOverrideRecovery();
    this.endAt.set(value);
    this.refreshPricingPreview();
  }

  onPricingDecisionChange(): void {
    this.pricingConfirmed.set(false);
  }

  confirmPricing(): void {
    if (this.isAdmin() && this.pricingPreview()?.pricingDecisionRequired && this.decisionValid()) {
      this.pricingConfirmed.set(true);
      this.stalePricing.set(false);
    }
  }

  private refreshPricingPreview(): void {
    this.pricingConfirmed.set(false);
    this.pricingPreview.set(null);
    this.previewError.set(null);
    const sequence = ++this.previewRequestSequence;

    if (
      !this.stayId ||
      !this.startAt() ||
      !this.endAt() ||
      new Date(this.endAt()) <= new Date(this.startAt())
    ) {
      this.previewLoading.set(false);
      return;
    }

    const basis = this.currentPreviewBasis();
    this.previewLoading.set(true);
    this.stayApiService
      .previewDateChangePricing(this.stayId, { startAt: this.startAt(), endAt: this.endAt() })
      .subscribe({
        next: (preview) => {
          if (sequence !== this.previewRequestSequence || basis !== this.currentPreviewBasis())
            return;
          this.pricingPreview.set(preview);
          this.previewLoading.set(false);
        },
        error: (error: unknown) => {
          if (sequence !== this.previewRequestSequence) return;
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
    return JSON.stringify([this.stayId, this.startAt(), this.endAt()]);
  }

  private clearVaccineOverrideRecovery(): void {
    this.vaccineOverrideRecoveryBasis = null;
  }

  private toDateTimeLocalValue(value: string): string {
    return value.slice(0, 16);
  }

  private showError(message: string): void {
    this.error.set(message);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
