import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { Cat } from '../../../cats/models/cat.model';
import { CatApiService } from '../../../cats/services/cat-api.service';
import { Owner } from '../../../owners/models/owner.model';
import { OwnerApiService } from '../../../owners/services/owner-api.service';
import {
  VaccineConflictDialog,
  VaccineConflictDialogData,
} from '../../components/vaccine-conflict-dialog/vaccine-conflict-dialog';
import {
  CreateStayRequest,
  CreationPricingPreview,
  isStalePricingConfirmationError,
  isVaccineConflictError,
  VaccineConflictResponse,
} from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { calculateStayNights } from '../../utils/stay-nights.util';
import { isValidWholeMoney, sameWholeMoney } from '../../utils/stay-money.util';

@Component({
  selector: 'app-stay-create-page',
  imports: [
    FormsModule,
    MatButton,
    MatCheckbox,
    MatFormField,
    MatError,
    MatInput,
    MatLabel,
    RouterLink,
    UiStateComponent,
  ],
  templateUrl: './stay-create-page.html',
  styleUrl: './stay-create-page.scss',
})
export class StayCreatePage {
  private readonly ownerApiService = inject(OwnerApiService);
  private readonly catApiService = inject(CatApiService);
  private readonly stayApiService = inject(StayApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18nService = inject(I18nService);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly dialog = inject(MatDialog);

  readonly text = this.i18nService.text;

  readonly owners = signal<Owner[]>([]);
  readonly cats = signal<Cat[]>([]);

  readonly selectedOwnerId = signal('');
  readonly selectedCatIds = signal<string[]>([]);

  readonly startAt = signal(this.getDefaultDateTimeLocalValue(0));
  readonly endAt = signal(this.getDefaultDateTimeLocalValue(7));
  readonly notes = signal('');
  readonly agreedAmount = signal('');
  readonly pricingReason = signal('');
  readonly pricingPreview = signal<CreationPricingPreview | null>(null);
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

  readonly loadingData = signal(false);
  readonly submitting = signal(false);
  readonly error = createLanguageResetError(this.i18nService.language);

  readonly filteredCats = computed(() =>
    this.cats().filter((cat) => cat.ownerId === this.selectedOwnerId()),
  );
  readonly selectedOwnerName = computed(
    () => this.owners().find((owner) => owner.id === this.selectedOwnerId())?.fullName ?? '',
  );
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
      (!this.reasonRequired() || this.pricingReason().trim().length > 0),
  );
  readonly amountValid = computed(() => isValidWholeMoney(this.agreedAmount()));

  private previewRequestSequence = 0;
  private vaccineOverrideRecoveryBasis: string | null = null;

  constructor() {
    this.loadData();
  }

  loadData(): void {
    this.loadingData.set(true);
    this.error.set(null);

    forkJoin({
      owners: this.ownerApiService.getOwners(),
      cats: this.catApiService.getCats(),
    }).subscribe({
      next: ({ owners, cats }) => {
        this.owners.set(owners);
        this.cats.set(cats);
        this.setInitialSelectionFromQueryParams();
        this.loadingData.set(false);
      },
      error: () => {
        this.error.set(this.text().stays.create.errors.loadFormDataFailed);
        this.loadingData.set(false);
      },
    });
  }

  onOwnerChange(ownerId: string): void {
    this.clearVaccineOverrideRecovery();
    this.selectedOwnerId.set(ownerId);
    this.selectedCatIds.set([]);
    this.refreshPricingPreview();
  }

  onCatToggle(catId: string, checked: boolean): void {
    this.clearVaccineOverrideRecovery();
    if (checked) {
      this.selectedCatIds.update((catIds) => [...catIds, catId]);
      this.refreshPricingPreview();
      return;
    }

    this.selectedCatIds.update((catIds) => catIds.filter((currentCatId) => currentCatId !== catId));
    this.refreshPricingPreview();
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
    if (this.pricingPreview() && this.decisionValid()) {
      this.pricingConfirmed.set(true);
      this.stalePricing.set(false);
    }
  }

  toggleCatFromPill(event: MouseEvent, catId: string): void {
    if (event.target !== event.currentTarget) {
      return;
    }

    this.onCatToggle(catId, !this.isCatSelected(catId));
  }

  isCatSelected(catId: string): boolean {
    return this.selectedCatIds().includes(catId);
  }

  submit(): void {
    this.error.set(null);

    if (this.selectedCatIds().length === 0) {
      this.error.set(this.text().stays.create.errors.selectAtLeastOneCat);
      return;
    }

    if (!this.startAt() || !this.endAt()) {
      this.error.set(this.text().stays.create.errors.datesRequired);
      return;
    }

    if (new Date(this.endAt()) <= new Date(this.startAt())) {
      this.error.set(this.text().stays.create.errors.endAfterStart);
      return;
    }

    const preview = this.pricingPreview();
    if (!preview || !this.pricingConfirmed() || !this.decisionValid()) {
      this.error.set(this.text().stays.pricing.errors.confirmationRequired);
      return;
    }

    const basis = this.currentPreviewBasis();
    const overrideVaccineConflicts = this.vaccineOverrideRecoveryBasis === basis;
    const request: CreateStayRequest = {
      catIds: this.selectedCatIds(),
      startAt: this.startAt(),
      endAt: this.endAt(),
      notes: this.notes().trim() || null,
      overrideVaccineConflicts,
      pricingDecision: {
        agreedAmount: this.agreedAmount(),
        reason: this.pricingReason().trim() || null,
      },
      confirmation: preview.confirmation,
    };

    this.saveStay(request, !overrideVaccineConflicts, basis);
  }

  private saveStay(request: CreateStayRequest, showVaccineConflict: boolean, basis: string): void {
    this.submitting.set(true);

    this.stayApiService.createStay(request).subscribe({
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
          this.error.set(this.text().stays.pricing.errors.stale);
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
        this.error.set(this.getCreateStayErrorMessage(error));
        this.submitting.set(false);
      },
    });
  }

  private openVaccineConflictDialog(
    conflict: VaccineConflictResponse,
    request: CreateStayRequest,
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

  private setInitialSelectionFromQueryParams(): void {
    const queryOwnerId = this.route.snapshot.queryParamMap.get('ownerId');
    const queryCatId = this.route.snapshot.queryParamMap.get('catId');

    if (!queryOwnerId) {
      return;
    }

    const ownerExists = this.owners().some((owner) => owner.id === queryOwnerId);

    if (!ownerExists) {
      return;
    }

    this.selectedOwnerId.set(queryOwnerId);

    if (!queryCatId) {
      return;
    }

    const catExistsForOwner = this.cats().some(
      (cat) => cat.id === queryCatId && cat.ownerId === queryOwnerId,
    );

    if (catExistsForOwner) {
      this.selectedCatIds.set([queryCatId]);
    }

    this.refreshPricingPreview();
  }

  private refreshPricingPreview(): void {
    this.pricingConfirmed.set(false);
    this.pricingPreview.set(null);
    this.previewError.set(null);
    const sequence = ++this.previewRequestSequence;

    if (
      this.selectedCatIds().length === 0 ||
      !this.startAt() ||
      !this.endAt() ||
      new Date(this.endAt()) <= new Date(this.startAt())
    ) {
      this.previewLoading.set(false);
      return;
    }

    const catIds = [...this.selectedCatIds()].sort();
    const basis = JSON.stringify([this.startAt(), this.endAt(), catIds]);
    this.previewLoading.set(true);

    this.stayApiService
      .previewCreationPricing({ startAt: this.startAt(), endAt: this.endAt(), catIds })
      .subscribe({
        next: (preview) => {
          if (sequence !== this.previewRequestSequence || basis !== this.currentPreviewBasis()) {
            return;
          }
          this.pricingPreview.set(preview);
          this.previewLoading.set(false);
        },
        error: () => {
          if (sequence !== this.previewRequestSequence) return;
          this.previewLoading.set(false);
          this.previewError.set(this.text().stays.pricing.errors.previewFailed);
        },
      });
  }

  private currentPreviewBasis(): string {
    return JSON.stringify([this.startAt(), this.endAt(), [...this.selectedCatIds()].sort()]);
  }

  private clearVaccineOverrideRecovery(): void {
    this.vaccineOverrideRecoveryBasis = null;
  }

  private getCreateStayErrorMessage(error: unknown): string {
    const fallbackMessage = this.text().stays.create.errors.createFailed;

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

  private getDefaultDateTimeLocalValue(daysToAdd: number): string {
    const date = new Date();

    date.setDate(date.getDate() + daysToAdd);
    date.setHours(10, 0, 0, 0);

    return this.toDateTimeLocalValue(date);
  }

  private toDateTimeLocalValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
