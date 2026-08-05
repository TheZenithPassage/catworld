import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { PaymentCondition, Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { StayStatusVisibilityPreferencesService } from '../../services/stay-status-visibility-preferences.service';
import { StaySearchFiltersComponent } from '../../components/stay-search-filters/stay-search-filters';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import {
  getDefaultStayPaymentFilters,
  getDefaultStaySearchFilters,
  isStayVisibleByPaymentFilters,
  isStayVisibleBySearchFilters,
  PAYMENT_CONDITION_FILTER_OPTIONS,
  PaymentConditionVisibility,
  StaySearchFilters,
} from '../../utils/stay-search-filter.util';
import {
  canCancelStay,
  canModifyStay,
  getStayStatus,
  isStayVisibleByStatus,
  STAY_STATUS_FILTER_OPTIONS,
  StayStatus,
  StayStatusVisibility,
} from '../../utils/stay-status.util';
import { isValidWholeMoney } from '../../utils/stay-money.util';

@Component({
  selector: 'app-stays-overview-page',
  imports: [
    MatButton,
    MatCheckbox,
    MatFormField,
    MatInput,
    MatLabel,
    MatTableModule,
    FormsModule,
    RouterLink,
    StaySearchFiltersComponent,
    UiStateComponent,
  ],
  templateUrl: './stays-overview-page.html',
  styleUrl: './stays-overview-page.scss',
})
export class StaysOverviewPage {
  private readonly stayApiService = inject(StayApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18nService = inject(I18nService);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly stayStatusVisibilityPreferencesService = inject(
    StayStatusVisibilityPreferencesService,
  );

  readonly text = this.i18nService.text;
  readonly dateLocale = this.i18nService.dateLocale;
  readonly selectedStayId = signal<string | null>(null);
  readonly statusFilterOptions = STAY_STATUS_FILTER_OPTIONS;
  readonly paymentConditionFilterOptions = PAYMENT_CONDITION_FILTER_OPTIONS;
  readonly statusVisibility = signal<StayStatusVisibility>(
    this.stayStatusVisibilityPreferencesService.read(),
  );
  readonly searchFilters = signal<StaySearchFilters>(getDefaultStaySearchFilters());
  readonly paymentFilters = signal(getDefaultStayPaymentFilters());
  readonly displayedColumns = [
    'state',
    'start',
    'end',
    'nights',
    'economics',
    'cats',
    'owner',
    'notes',
    'actions',
  ];

  readonly filteredStays = computed(() =>
    this.stays().filter(
      (stay) =>
        isStayVisibleByStatus(stay, this.statusVisibility()) &&
        isStayVisibleBySearchFilters(stay, this.searchFilters()) &&
        isStayVisibleByPaymentFilters(stay, this.paymentFilters()),
    ),
  );

  readonly stays = signal<Stay[]>([]);
  readonly loading = signal(false);
  readonly error = createLanguageResetError(this.i18nService.language);
  readonly cancellingStayId = signal<string | null>(null);
  readonly correctingStayId = signal<string | null>(null);
  readonly correctionAmount = signal('');
  readonly correctionReason = signal('');
  readonly correctionSubmitting = signal(false);
  readonly isAdmin = computed(() => this.authSessionService.hasRole('ADMIN'));

  constructor() {
    effect(() => {
      this.stayStatusVisibilityPreferencesService.store(this.statusVisibility());
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.selectedStayId.set(params.get('selectedStayId'));
    });

    this.loadStays();
  }

  loadStays(): void {
    this.loading.set(true);
    this.error.set(null);

    this.stayApiService.getStays().subscribe({
      next: (stays) => {
        this.stays.set(stays);
        this.loading.set(false);
        this.scrollSelectedStayIntoView();
      },
      error: () => {
        this.error.set(this.text().stays.overview.errorLoading);
        this.loading.set(false);
      },
    });
  }

  getStayStatus(stay: Stay): string {
    return this.text().stays.status[getStayStatus(stay)];
  }

  getPaymentCondition(stay: Stay): string {
    return this.text().stays.filters.paymentCondition[stay.paymentCondition];
  }

  formatDate(value: string | null): string {
    if (!value) {
      return this.text().stays.emptyValue;
    }

    return new Intl.DateTimeFormat(this.dateLocale(), {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  getCatSummary(stay: Stay): string {
    return stay.cats.length === 1
      ? `1 ${this.text().stays.overview.catSingular}`
      : `${stay.cats.length} ${this.text().stays.overview.catPlural}`;
  }

  getNightCountLabel(numberOfNights: number): string {
    const unit =
      numberOfNights === 1 ? this.text().stays.nights.singular : this.text().stays.nights.plural;

    return `${numberOfNights} ${unit}`;
  }

  getCatNames(stay: Stay): string {
    return stay.cats.map((cat) => cat.name).join(', ');
  }

  canCancelStay(stay: Stay): boolean {
    return canCancelStay(stay);
  }

  canEditStay(stay: Stay): boolean {
    return canModifyStay(stay);
  }

  cancelStay(stay: Stay): void {
    const confirmed = window.confirm(
      `${this.text().stays.overview.cancelConfirmPrefix}${this.getCatNames(stay)}${this.text().stays.overview.cancelConfirmSuffix}`,
    );

    if (!confirmed) {
      return;
    }

    this.error.set(null);
    this.cancellingStayId.set(stay.stayId);

    this.stayApiService.cancelStay(stay.stayId).subscribe({
      next: () => {
        this.cancellingStayId.set(null);
        this.loadStays();
      },
      error: (error: unknown) => {
        this.error.set(this.getApiErrorMessage(error, this.text().stays.overview.errorCancelling));
        this.cancellingStayId.set(null);
      },
    });
  }

  startCorrection(stay: Stay): void {
    this.correctingStayId.set(stay.stayId);
    this.correctionAmount.set(stay.agreedAmount ?? '');
    this.correctionReason.set('');
    this.error.set(null);
  }

  cancelCorrection(): void {
    this.correctingStayId.set(null);
    this.correctionAmount.set('');
    this.correctionReason.set('');
  }

  submitCorrection(stay: Stay): void {
    if (!this.isAdmin() || !isValidWholeMoney(this.correctionAmount())) {
      this.error.set(this.text().stays.pricing.errors.invalidAmount);
      return;
    }

    const amountChanged =
      this.correctionAmount().replace(/^0+(?=\d)/, '') !==
      (stay.agreedAmount ?? '').replace(/^0+(?=\d)/, '');
    if (amountChanged && !this.correctionReason().trim()) {
      this.error.set(this.text().stays.pricing.errors.correctionReasonRequired);
      return;
    }

    this.correctionSubmitting.set(true);
    this.error.set(null);
    this.stayApiService
      .correctAgreedAmount(stay.stayId, {
        agreedAmount: this.correctionAmount(),
        reason: this.correctionReason().trim() || null,
      })
      .subscribe({
        next: (updatedStay) => {
          this.stays.update((stays) =>
            stays.map((item) => (item.stayId === updatedStay.stayId ? updatedStay : item)),
          );
          this.correctionSubmitting.set(false);
          this.cancelCorrection();
        },
        error: (error: unknown) => {
          this.error.set(
            this.getApiErrorMessage(error, this.text().stays.pricing.errors.correctionFailed),
          );
          this.correctionSubmitting.set(false);
        },
      });
  }

  isSelectedStay(stay: Stay): boolean {
    return this.selectedStayId() === stay.stayId;
  }

  getUnavailableActionLabel(stay: Stay): string {
    const status = getStayStatus(stay);

    if (status === 'cancelled') {
      return this.text().stays.overview.alreadyCancelled;
    }

    if (status === 'checked-out') {
      return this.text().stays.overview.alreadyCheckedOut;
    }

    return this.text().stays.emptyValue;
  }

  isStatusVisible(status: StayStatus): boolean {
    return this.statusVisibility()[status];
  }

  setStatusVisibility(status: StayStatus, checked: boolean): void {
    this.statusVisibility.update((currentVisibility) => ({
      ...currentVisibility,
      [status]: checked,
    }));
  }

  setSearchFilters(filters: StaySearchFilters): void {
    this.searchFilters.set(filters);
  }

  isPaymentConditionVisible(condition: PaymentCondition): boolean {
    return this.paymentFilters().conditionVisibility[condition];
  }

  setPaymentConditionVisibility(condition: PaymentCondition, checked: boolean): void {
    this.paymentFilters.update((filters) => ({
      ...filters,
      conditionVisibility: {
        ...filters.conditionVisibility,
        [condition]: checked,
      } satisfies PaymentConditionVisibility,
    }));
  }

  setOutstandingOnly(checked: boolean): void {
    this.paymentFilters.update((filters) => ({ ...filters, outstandingOnly: checked }));
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

  private scrollSelectedStayIntoView(): void {
    const selectedStayId = this.selectedStayId();

    if (!selectedStayId) {
      return;
    }

    setTimeout(() => {
      document.getElementById(`stay-${selectedStayId}`)?.scrollIntoView({ block: 'center' });
    });
  }
}
