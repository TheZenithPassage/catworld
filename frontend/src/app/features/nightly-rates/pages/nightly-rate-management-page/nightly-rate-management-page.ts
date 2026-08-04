import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { finalize } from 'rxjs';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import {
  NightlyRateThreshold,
  NightlyReferenceRate,
  NightlyReferenceRateApiService,
} from '../../services/nightly-reference-rate-api.service';

interface RateCategory {
  threshold: NightlyRateThreshold;
  labelKey: 'one' | 'two' | 'threePlus';
}
type PendingAction = 'save' | 'clear';
type ValidationErrorCode = 'required' | 'positiveWhole' | 'tooLong';

@Component({
  selector: 'app-nightly-rate-management-page',
  imports: [
    FormsModule,
    MatButton,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatFormField,
    MatInput,
    MatLabel,
    UiStateComponent,
  ],
  templateUrl: './nightly-rate-management-page.html',
  styleUrl: './nightly-rate-management-page.scss',
})
export class NightlyRateManagementPage {
  private readonly api = inject(NightlyReferenceRateApiService);
  private readonly auth = inject(AuthSessionService);
  private readonly i18n = inject(I18nService);
  readonly text = this.i18n.text;
  readonly categories: readonly RateCategory[] = [
    { threshold: 1, labelKey: 'one' },
    { threshold: 2, labelKey: 'two' },
    { threshold: 3, labelKey: 'threePlus' },
  ];
  readonly rates = signal<Partial<Record<NightlyRateThreshold, string | null>>>({});
  readonly entries = signal<Record<NightlyRateThreshold, string>>({ 1: '', 2: '', 3: '' });
  readonly validationErrors = signal<Partial<Record<NightlyRateThreshold, ValidationErrorCode>>>(
    {},
  );
  readonly loading = signal(true);
  readonly loadError = createLanguageResetError(this.i18n.language);
  readonly actionError = createLanguageResetError(this.i18n.language);
  readonly pending = signal<{ threshold: NightlyRateThreshold; action: PendingAction } | null>(
    null,
  );
  readonly isAdmin = computed(() => this.auth.hasRole('ADMIN'));

  constructor() {
    this.loadRates();
  }

  loadRates(afterMutation: NightlyRateThreshold | null = null): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.api.getCurrentRates().subscribe({
      next: (rates) => {
        const mapped = this.mapRates(rates);
        if (!mapped) this.loadError.set(this.text().nightlyRates.loadError);
        else {
          this.rates.set(mapped);
          this.entries.set({ 1: mapped[1] ?? '', 2: mapped[2] ?? '', 3: mapped[3] ?? '' });
        }
        this.loading.set(false);
        if (afterMutation !== null && !mapped) {
          this.actionError.set(this.text().nightlyRates.errors.refresh);
          this.focusFeedback();
        } else if (afterMutation !== null) {
          this.focusField(afterMutation);
        }
      },
      error: () => {
        this.loading.set(false);
        this.loadError.set(this.text().nightlyRates.loadError);
        if (afterMutation !== null) {
          this.actionError.set(this.text().nightlyRates.errors.refresh);
          this.focusFeedback();
        }
      },
    });
  }
  entry(threshold: NightlyRateThreshold): string {
    return this.entries()[threshold];
  }
  setEntry(threshold: NightlyRateThreshold, value: string): void {
    this.entries.update((entries) => ({ ...entries, [threshold]: value }));
    this.validationErrors.update((errors) => ({ ...errors, [threshold]: undefined }));
    this.actionError.set(null);
  }
  rate(threshold: NightlyRateThreshold): string | null {
    return this.rates()[threshold] ?? null;
  }

  save(threshold: NightlyRateThreshold): void {
    if (!this.isAdmin() || this.pending()) return;
    const value = this.entry(threshold);
    const error = this.validate(value);
    if (error) {
      this.validationErrors.update((errors) => ({ ...errors, [threshold]: error }));
      this.focusField(threshold);
      return;
    }
    this.startMutation(threshold, 'save');
    this.api
      .configureRate(threshold, value)
      .pipe(finalize(() => this.pending.set(null)))
      .subscribe({
        next: () => this.loadRates(threshold),
        error: (apiError: unknown) => this.handleMutationError(apiError),
      });
  }
  clear(threshold: NightlyRateThreshold): void {
    if (!this.isAdmin() || this.pending()) return;
    this.startMutation(threshold, 'clear');
    this.api
      .clearRate(threshold)
      .pipe(finalize(() => this.pending.set(null)))
      .subscribe({
        next: () => this.loadRates(threshold),
        error: (apiError: unknown) => this.handleMutationError(apiError),
      });
  }
  isPending(threshold: NightlyRateThreshold, action?: PendingAction): boolean {
    const pending = this.pending();
    return pending?.threshold === threshold && (!action || pending.action === action);
  }
  validationError(threshold: NightlyRateThreshold): string | null {
    const code = this.validationErrors()[threshold];
    return code ? this.text().nightlyRates.form.errors[code] : null;
  }

  private validate(value: string): ValidationErrorCode | null {
    if (!value) return 'required';
    if (!/^\d+$/.test(value) || /^0+$/.test(value)) return 'positiveWhole';
    if (value.length > 19) return 'tooLong';
    return null;
  }
  private mapRates(
    rates: NightlyReferenceRate[],
  ): Partial<Record<NightlyRateThreshold, string | null>> | null {
    const mapped: Partial<Record<NightlyRateThreshold, string | null>> = {};
    for (const rate of rates) {
      if (![1, 2, 3].includes(rate.minimumCatCount) || rate.minimumCatCount in mapped) return null;
      mapped[rate.minimumCatCount] = rate.nightlyRate;
    }
    return this.categories.every(({ threshold }) => threshold in mapped) ? mapped : null;
  }
  private startMutation(threshold: NightlyRateThreshold, action: PendingAction): void {
    this.actionError.set(null);
    this.validationErrors.update((errors) => ({ ...errors, [threshold]: undefined }));
    this.pending.set({ threshold, action });
  }
  private handleMutationError(error: unknown): void {
    const messages = this.text().nightlyRates.errors;
    let message = messages.mutation;
    if (error instanceof HttpErrorResponse) {
      if (error.status === 400) message = messages.validation;
      else if (error.status === 403) message = messages.forbidden;
      else if (error.status === 409) message = messages.conflict;
    }
    this.actionError.set(message);
    this.focusFeedback();
  }
  private focusField(threshold: NightlyRateThreshold): void {
    setTimeout(() => document.getElementById(`nightly-rate-${threshold}`)?.focus());
  }
  private focusFeedback(): void {
    setTimeout(() => document.getElementById('nightly-rate-action-error')?.focus());
  }
}
