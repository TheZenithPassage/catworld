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
  NIGHTLY_REFERENCE_RATE_KEYS,
  NightlyReferenceRate,
  NightlyReferenceRateKey,
} from '../../models/nightly-reference-rate.model';
import { NightlyReferenceRateApiService } from '../../services/nightly-reference-rate-api.service';
import { TransferRateApiService } from '../../services/transfer-rate-api.service';

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
  private readonly transferApi = inject(TransferRateApiService);
  readonly text = this.i18n.text;
  readonly keys = NIGHTLY_REFERENCE_RATE_KEYS;
  readonly rates = signal<Partial<Record<NightlyReferenceRateKey, string | null>>>({});
  readonly entries = signal<Record<NightlyReferenceRateKey, string>>({
    ONE_CAT: '',
    ONE_CAT_7_TO_14: '',
    ONE_CAT_15_TO_29: '',
    ONE_CAT_30_PLUS: '',
    TWO_CATS: '',
    THREE_PLUS_CATS: '',
  });
  readonly validationErrors = signal<Partial<Record<NightlyReferenceRateKey, ValidationErrorCode>>>(
    {},
  );
  readonly loading = signal(true);
  readonly loadError = createLanguageResetError(this.i18n.language);
  readonly actionError = createLanguageResetError(this.i18n.language);
  readonly pending = signal<{ key: NightlyReferenceRateKey; action: PendingAction } | null>(null);
  readonly isAdmin = computed(() => this.auth.hasRole('ADMIN'));
  readonly transferRate = signal<string | null>(null);
  readonly transferEntry = signal('');
  readonly transferLoading = signal(true);
  readonly transferPending = signal<PendingAction | null>(null);
  readonly transferValidationError = signal<ValidationErrorCode | null>(null);
  readonly transferError = createLanguageResetError(this.i18n.language);

  constructor() {
    this.loadRates();
    this.loadTransferRate();
  }
  loadTransferRate(): void {
    this.transferLoading.set(true);
    this.transferError.set(null);
    this.transferApi.getCurrentRate().subscribe({
      next: ({ transferRate }) => {
        this.transferRate.set(transferRate);
        this.transferEntry.set(transferRate ?? '');
        this.transferLoading.set(false);
      },
      error: () => {
        this.transferLoading.set(false);
        this.transferError.set(this.text().nightlyRates.loadError);
      },
    });
  }
  saveTransferRate(): void {
    const error = this.validate(this.transferEntry());
    if (!this.isAdmin() || this.transferPending()) return;
    if (error) {
      this.transferValidationError.set(error);
      setTimeout(() => document.getElementById('transfer-rate')?.focus());
      return;
    }
    this.transferPending.set('save');
    this.transferApi
      .configureRate(this.transferEntry())
      .pipe(finalize(() => this.transferPending.set(null)))
      .subscribe({
        next: () => this.loadTransferRate(),
        error: (e: unknown) => this.handleMutationError(e),
      });
  }
  clearTransferRate(): void {
    if (!this.isAdmin() || this.transferPending()) return;
    this.transferPending.set('clear');
    this.transferApi
      .clearRate()
      .pipe(finalize(() => this.transferPending.set(null)))
      .subscribe({
        next: () => this.loadTransferRate(),
        error: (e: unknown) => this.handleMutationError(e),
      });
  }

  loadRates(afterMutation: NightlyReferenceRateKey | null = null): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.api.getCurrentRates().subscribe({
      next: (rates) => {
        const mapped = this.mapRates(rates);
        if (!mapped) this.loadError.set(this.text().nightlyRates.loadError);
        else {
          this.rates.set(mapped);
          this.entries.set({
            ONE_CAT: mapped.ONE_CAT ?? '',
            ONE_CAT_7_TO_14: mapped.ONE_CAT_7_TO_14 ?? '',
            ONE_CAT_15_TO_29: mapped.ONE_CAT_15_TO_29 ?? '',
            ONE_CAT_30_PLUS: mapped.ONE_CAT_30_PLUS ?? '',
            TWO_CATS: mapped.TWO_CATS ?? '',
            THREE_PLUS_CATS: mapped.THREE_PLUS_CATS ?? '',
          });
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
  entry(key: NightlyReferenceRateKey): string {
    return this.entries()[key];
  }
  setEntry(key: NightlyReferenceRateKey, value: string): void {
    this.entries.update((entries) => ({ ...entries, [key]: value }));
    this.validationErrors.update((errors) => ({ ...errors, [key]: undefined }));
    this.actionError.set(null);
  }
  rate(key: NightlyReferenceRateKey): string | null {
    return this.rates()[key] ?? null;
  }

  save(key: NightlyReferenceRateKey): void {
    if (!this.isAdmin() || this.pending()) return;
    const value = this.entry(key);
    const error = this.validate(value);
    if (error) {
      this.validationErrors.update((errors) => ({ ...errors, [key]: error }));
      this.focusField(key);
      return;
    }
    this.startMutation(key, 'save');
    this.api
      .configureRate(key, value)
      .pipe(finalize(() => this.pending.set(null)))
      .subscribe({
        next: () => this.loadRates(key),
        error: (apiError: unknown) => this.handleMutationError(apiError),
      });
  }
  clear(key: NightlyReferenceRateKey): void {
    if (!this.isAdmin() || this.pending()) return;
    this.startMutation(key, 'clear');
    this.api
      .clearRate(key)
      .pipe(finalize(() => this.pending.set(null)))
      .subscribe({
        next: () => this.loadRates(key),
        error: (apiError: unknown) => this.handleMutationError(apiError),
      });
  }
  isPending(key: NightlyReferenceRateKey, action?: PendingAction): boolean {
    const pending = this.pending();
    return pending?.key === key && (!action || pending.action === action);
  }
  validationError(key: NightlyReferenceRateKey): string | null {
    const code = this.validationErrors()[key];
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
  ): Partial<Record<NightlyReferenceRateKey, string | null>> | null {
    const mapped: Partial<Record<NightlyReferenceRateKey, string | null>> = {};
    for (const rate of rates) {
      if (!this.keys.includes(rate.key) || rate.key in mapped) return null;
      mapped[rate.key] = rate.nightlyRate;
    }
    return this.keys.every((key) => key in mapped) ? mapped : null;
  }
  private startMutation(key: NightlyReferenceRateKey, action: PendingAction): void {
    this.actionError.set(null);
    this.validationErrors.update((errors) => ({ ...errors, [key]: undefined }));
    this.pending.set({ key, action });
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
  private focusField(key: NightlyReferenceRateKey): void {
    setTimeout(() => document.getElementById(`nightly-rate-${key}`)?.focus());
  }
  private focusFeedback(): void {
    setTimeout(() => document.getElementById('nightly-rate-action-error')?.focus());
  }
}
