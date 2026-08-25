import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { Stay, StayPayment } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { sameWholeMoney } from '../../utils/stay-money.util';

export type PaymentActionDialogMode = 'register' | 'edit' | 'annul';
export interface PaymentActionDialogData {
  stay: Stay;
  mode: PaymentActionDialogMode;
  payment?: StayPayment;
}

@Component({
  selector: 'app-payment-action-dialog',
  imports: [
    FormsModule,
    MatButton,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    UiStateComponent,
  ],
  templateUrl: './payment-action-dialog.html',
  styleUrl: './payment-action-dialog.scss',
})
export class PaymentActionDialog {
  private readonly api = inject(StayApiService);
  private readonly dialogRef = inject(MatDialogRef<PaymentActionDialog, Stay>);
  readonly data = inject<PaymentActionDialogData>(MAT_DIALOG_DATA);
  private readonly i18n = inject(I18nService);
  readonly text = this.i18n.text;
  readonly amount = signal(this.data.mode === 'edit' ? (this.data.payment?.amount ?? '') : '');
  readonly paymentDate = signal('');
  readonly note = signal('');
  readonly reason = signal('');
  readonly submitting = signal(false);
  readonly attempted = signal(false);
  readonly error = createLanguageResetError(this.i18n.language);
  readonly amountValid = computed(() => /^(?!0+$)\d{1,19}$/.test(this.amount()));
  readonly amountUnchanged = computed(
    () =>
      this.data.mode === 'edit' &&
      Boolean(this.data.payment) &&
      this.amountValid() &&
      sameWholeMoney(this.amount(), this.data.payment!.amount),
  );
  readonly attemptedMatcher: ErrorStateMatcher = {
    isErrorState: (control) => this.attempted() && Boolean(control?.invalid),
  };
  readonly amountMatcher: ErrorStateMatcher = {
    isErrorState: (control) =>
      this.attempted() && (Boolean(control?.invalid) || this.amountUnchanged()),
  };

  submit(): void {
    if (this.submitting()) return;
    this.attempted.set(true);
    this.error.set(null);
    if (!this.valid()) return;
    this.submitting.set(true);
    this.dialogRef.disableClose = true;
    const payment = this.data.payment;
    const request =
      this.data.mode === 'register'
        ? this.api.registerPayment(this.data.stay.stayId, {
            amount: this.amount(),
            paymentDate: this.paymentDate(),
            note: this.note().trim() || null,
          })
        : this.data.mode === 'edit' && payment
          ? this.api.editPayment(this.data.stay.stayId, payment.paymentId, {
              amount: this.amount(),
              reason: this.reason().trim(),
            })
          : this.data.mode === 'annul' && payment
            ? this.api.annulPayment(this.data.stay.stayId, payment.paymentId, {
                reason: this.reason().trim(),
              })
            : null;
    if (!request) {
      this.submitting.set(false);
      return;
    }
    request.subscribe({
      next: (stay) => this.dialogRef.close(stay),
      error: (error) => {
        this.submitting.set(false);
        this.dialogRef.disableClose = false;
        this.error.set(this.errorMessage(error));
      },
    });
  }

  private valid(): boolean {
    if (this.data.mode !== 'annul' && !this.amountValid()) return false;
    if (this.data.mode === 'register') return Boolean(this.paymentDate());
    if (!this.data.payment || !this.reason().trim()) return false;
    return this.data.mode === 'annul' || !this.amountUnchanged();
  }
  private errorMessage(error: unknown): string {
    const copy = this.text().stays.payments.errors;
    if (!(error instanceof HttpErrorResponse)) return copy.generic;
    if (error.status === 403) return copy.permission;
    if (error.status === 404) return copy.missing;
    if (error.status === 400) return copy.validation;
    if (error.status === 409) {
      const value = this.backendMessage(error.error).toLowerCase();
      if (value.includes('exceed')) return copy.overpayment;
      if (value.includes('below') || value.includes('active payment')) return copy.activeFloor;
      return copy.conflict;
    }
    return copy.generic;
  }
  private backendMessage(body: unknown): string {
    if (typeof body === 'string') return body;
    if (body && typeof body === 'object') {
      return Object.values(body as Record<string, unknown>)
        .filter((value): value is string => typeof value === 'string')
        .join(' ');
    }
    return '';
  }
}
