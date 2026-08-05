import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import {
  isPermanentDeletionConfirmed,
  PermanentDeletionConfirmationDialog,
  PermanentDeletionConfirmationResult,
} from '../../../../shared/permanent-deletion/permanent-deletion-confirmation-dialog';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { Stay, StayPayment } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { getStayStatus } from '../../utils/stay-status.util';

type PaymentAction = 'register' | 'edit' | 'annul' | null;

@Component({
  selector: 'app-stay-payments',
  imports: [
    DatePipe,
    FormsModule,
    MatButton,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    UiStateComponent,
  ],
  templateUrl: './stay-payments.html',
  styleUrl: './stay-payments.scss',
})
export class StayPayments {
  private readonly authSession = inject(AuthSessionService);
  private readonly api = inject(StayApiService);
  private readonly dialog = inject(MatDialog);
  private readonly i18n = inject(I18nService);

  readonly stay = input.required<Stay>();
  readonly stayChange = output<Stay>();
  readonly text = this.i18n.text;

  readonly action = signal<PaymentAction>(null);
  readonly selectedPayment = signal<StayPayment | null>(null);
  readonly amount = signal('');
  readonly paymentDate = signal('');
  readonly note = signal('');
  readonly reason = signal('');
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly attempted = signal(false);

  readonly isAdmin = computed(() => this.authSession.hasRole('ADMIN'));
  readonly canMutate = computed(() => {
    if (this.isAdmin()) return true;
    const status = getStayStatus(this.stay());
    return status === 'reserved' || status === 'checked-in';
  });
  readonly amountValid = computed(() => /^(?!0+$)\d{1,19}$/.test(this.amount()));

  startRegister(): void {
    this.resetForm();
    this.action.set('register');
  }

  startEdit(payment: StayPayment): void {
    this.resetForm();
    this.selectedPayment.set(payment);
    this.amount.set(payment.amount);
    this.action.set('edit');
  }

  startAnnul(payment: StayPayment): void {
    this.resetForm();
    this.selectedPayment.set(payment);
    this.action.set('annul');
  }

  cancelAction(): void {
    this.resetForm();
  }

  submitAction(): void {
    this.attempted.set(true);
    this.error.set(null);
    const action = this.action();
    const payment = this.selectedPayment();

    if (!this.canMutate() || !action || !this.actionIsValid(action)) return;

    this.submitting.set(true);
    const request =
      action === 'register'
        ? this.api.registerPayment(this.stay().stayId, {
            amount: this.amount(),
            paymentDate: this.paymentDate(),
            note: this.note().trim() || null,
          })
        : action === 'edit' && payment
          ? this.api.editPayment(this.stay().stayId, payment.paymentId, {
              amount: this.amount(),
              reason: this.reason().trim(),
            })
          : action === 'annul' && payment
            ? this.api.annulPayment(this.stay().stayId, payment.paymentId, {
                reason: this.reason().trim(),
              })
            : null;

    if (!request) {
      this.submitting.set(false);
      return;
    }

    request.subscribe({
      next: (stay) => this.complete(stay),
      error: (error: unknown) => this.fail(error),
    });
  }

  remove(payment: StayPayment): void {
    if (!this.isAdmin()) return;

    const copy = this.text().stays.payments;
    this.dialog
      .open<
        PermanentDeletionConfirmationDialog,
        { subject: string; reasonLabel: string; reasonRequiredMessage: string },
        boolean | PermanentDeletionConfirmationResult
      >(PermanentDeletionConfirmationDialog, {
        data: {
          subject: `${copy.removingSubject} ${payment.amount} · ${payment.paymentDate}`,
          reasonLabel: copy.removalReason,
          reasonRequiredMessage: copy.errors.reasonRequired,
        },
        width: '36rem',
        maxWidth: 'calc(100vw - 2rem)',
      })
      .afterClosed()
      .subscribe((result) => {
        if (!isPermanentDeletionConfirmed(result) || result === true || !result.reason) return;
        this.error.set(null);
        this.submitting.set(true);
        this.api
          .removePayment(this.stay().stayId, payment.paymentId, { reason: result.reason })
          .subscribe({
            next: (stay) => this.complete(stay),
            error: (error: unknown) => this.fail(error),
          });
      });
  }

  private actionIsValid(action: Exclude<PaymentAction, null>): boolean {
    if ((action === 'register' || action === 'edit') && !this.amountValid()) return false;
    if (action === 'register' && !this.paymentDate()) return false;
    return action === 'register' || this.reason().trim().length > 0;
  }

  private complete(stay: Stay): void {
    this.submitting.set(false);
    this.resetForm();
    this.stayChange.emit(stay);
  }

  private fail(error: unknown): void {
    this.submitting.set(false);
    this.error.set(this.errorMessage(error));
  }

  private resetForm(): void {
    this.action.set(null);
    this.selectedPayment.set(null);
    this.amount.set('');
    this.paymentDate.set('');
    this.note.set('');
    this.reason.set('');
    this.error.set(null);
    this.attempted.set(false);
  }

  private errorMessage(error: unknown): string {
    const copy = this.text().stays.payments.errors;
    if (!(error instanceof HttpErrorResponse)) return copy.generic;
    if (error.status === 403) return copy.permission;
    if (error.status === 404) return copy.missing;
    if (error.status === 409) {
      const message = this.backendMessage(error).toLowerCase();
      if (message.includes('exceed')) return copy.overpayment;
      if (message.includes('below') || message.includes('active payment')) return copy.activeFloor;
      return copy.conflict;
    }
    if (error.status === 400) return copy.validation;
    return copy.generic;
  }

  private backendMessage(error: HttpErrorResponse): string {
    if (typeof error.error === 'string') return error.error;
    if (error.error && typeof error.error === 'object') {
      return Object.values(error.error as Record<string, unknown>)
        .filter((value): value is string => typeof value === 'string')
        .join(' ');
    }
    return '';
  }
}
