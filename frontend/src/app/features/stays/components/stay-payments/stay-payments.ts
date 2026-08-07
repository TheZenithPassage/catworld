import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
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
  imports: [FormsModule, MatButton, MatError, MatFormField, MatInput, MatLabel, UiStateComponent],
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
  readonly dateLocale = this.i18n.dateLocale;

  readonly action = signal<PaymentAction>(null);
  readonly selectedPayment = signal<StayPayment | null>(null);
  readonly amount = signal('');
  readonly paymentDate = signal('');
  readonly note = signal('');
  readonly reason = signal('');
  readonly submitting = signal(false);
  readonly removalDialogOpen = signal(false);
  readonly error = createLanguageResetError(this.i18n.language);
  readonly attempted = signal(false);
  readonly removalPayment = signal<StayPayment | null>(null);
  readonly removalReason = signal('');

  private returnFocusSelector: string | null = null;
  private returnFocusPaymentId: string | null = null;

  readonly isAdmin = computed(() => this.authSession.hasRole('ADMIN'));
  readonly canMutate = computed(() => {
    if (this.isAdmin()) return true;
    const status = getStayStatus(this.stay());
    return status === 'reserved' || status === 'checked-in';
  });
  readonly amountValid = computed(() => /^(?!0+$)\d{1,19}$/.test(this.amount()));
  readonly mutationLocked = computed(() => this.submitting() || this.removalDialogOpen());

  startRegister(trigger?: EventTarget | null): void {
    if (this.mutationLocked()) return;
    this.clearRemovalAttempt(false);
    this.resetForm();
    this.captureReturnFocus(trigger, 'register');
    this.action.set('register');
    this.focusFormControl('paymentAmount');
  }

  startEdit(payment: StayPayment, trigger?: EventTarget | null): void {
    if (this.mutationLocked()) return;
    this.clearRemovalAttempt(false);
    this.resetForm();
    this.captureReturnFocus(trigger, 'edit', payment.paymentId);
    this.selectedPayment.set(payment);
    this.amount.set(payment.amount);
    this.action.set('edit');
    this.focusFormControl('paymentAmount');
  }

  startAnnul(payment: StayPayment, trigger?: EventTarget | null): void {
    if (this.mutationLocked()) return;
    this.clearRemovalAttempt(false);
    this.resetForm();
    this.captureReturnFocus(trigger, 'annul', payment.paymentId);
    this.selectedPayment.set(payment);
    this.action.set('annul');
    this.focusFormControl('paymentReason');
  }

  cancelAction(): void {
    if (this.mutationLocked()) return;
    this.resetForm(true);
  }

  submitAction(): void {
    if (this.mutationLocked()) return;
    this.attempted.set(true);
    this.error.set(null);
    const action = this.action();
    const payment = this.selectedPayment();

    if (!this.canMutate() || !action || !this.actionIsValid(action)) return;

    this.clearRemovalAttempt(false);
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

  remove(payment: StayPayment, trigger?: EventTarget | null): void {
    if (!this.isAdmin() || this.mutationLocked()) return;

    const previousTarget = this.removalPayment();
    if (previousTarget?.paymentId !== payment.paymentId) {
      this.removalReason.set('');
    }
    this.removalPayment.set(payment);
    this.captureReturnFocus(trigger, 'remove', payment.paymentId);
    this.removalDialogOpen.set(true);

    const copy = this.text().stays.payments;
    this.dialog
      .open<
        PermanentDeletionConfirmationDialog,
        {
          subject: string;
          reasonLabel: string;
          reasonRequiredMessage: string;
          initialReason: string;
        },
        boolean | PermanentDeletionConfirmationResult
      >(PermanentDeletionConfirmationDialog, {
        data: {
          subject: `${copy.removingSubject} ${payment.amount} · ${payment.paymentDate}`,
          reasonLabel: copy.removalReason,
          reasonRequiredMessage: copy.errors.reasonRequired,
          initialReason: this.removalReason(),
        },
        width: '36rem',
        maxWidth: 'calc(100vw - 2rem)',
      })
      .afterClosed()
      .subscribe((result) => {
        this.removalDialogOpen.set(false);
        if (!isPermanentDeletionConfirmed(result) || result === true || !result.reason) {
          this.clearRemovalAttempt(true);
          return;
        }
        this.removalReason.set(result.reason);
        this.error.set(null);
        this.submitting.set(true);
        this.api
          .removePayment(this.stay().stayId, payment.paymentId, { reason: result.reason })
          .subscribe({
            next: (stay) => {
              this.removalPayment.set(null);
              this.removalReason.set('');
              this.complete(stay);
            },
            error: (error: unknown) => this.fail(error),
          });
      });
  }

  retryRemoval(): void {
    if (this.mutationLocked()) return;
    const payment = this.removalPayment();
    if (payment) this.remove(payment);
  }

  abandonRemoval(): void {
    this.clearRemovalAttempt(true);
    this.error.set(null);
  }

  dismissError(): void {
    this.error.set(null);
    this.restoreFocus();
  }

  formatRegisteredAt(value: string): string {
    return new Intl.DateTimeFormat(this.dateLocale(), {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  private actionIsValid(action: Exclude<PaymentAction, null>): boolean {
    if ((action === 'register' || action === 'edit') && !this.amountValid()) return false;
    if (action === 'register' && !this.paymentDate()) return false;
    return action === 'register' || this.reason().trim().length > 0;
  }

  private complete(stay: Stay): void {
    this.submitting.set(false);
    const focusSelector = this.returnFocusSelector;
    this.resetForm();
    this.stayChange.emit(stay);
    this.restoreFocus(focusSelector);
  }

  private fail(error: unknown): void {
    this.submitting.set(false);
    this.error.set(this.errorMessage(error));
  }

  private resetForm(restoreFocus = false): void {
    const focusSelector = restoreFocus ? this.returnFocusSelector : null;
    this.action.set(null);
    this.selectedPayment.set(null);
    this.amount.set('');
    this.paymentDate.set('');
    this.note.set('');
    this.reason.set('');
    this.error.set(null);
    this.attempted.set(false);
    if (restoreFocus) this.restoreFocus(focusSelector);
  }

  private captureReturnFocus(
    trigger: EventTarget | null | undefined,
    action: 'register' | 'edit' | 'annul' | 'remove',
    paymentId?: string,
  ): void {
    this.returnFocusPaymentId = paymentId ?? null;
    this.returnFocusSelector = paymentId
      ? `[data-payment-id="${paymentId}"][data-payment-action="${action}"]`
      : `[data-payment-action="${action}"]`;
    if (trigger instanceof HTMLElement && !trigger.matches(this.returnFocusSelector)) {
      this.returnFocusSelector = null;
    }
  }

  private focusFormControl(name: 'paymentAmount' | 'paymentReason'): void {
    setTimeout(() => document.querySelector<HTMLElement>(`[name="${name}"]`)?.focus());
  }

  private restoreFocus(selector = this.returnFocusSelector): void {
    const paymentId = this.returnFocusPaymentId;
    setTimeout(() => {
      const target = selector ? document.querySelector<HTMLElement>(selector) : null;
      const row = paymentId
        ? document.querySelector<HTMLElement>(`[data-payment-row-id="${paymentId}"]`)
        : null;
      (
        target ??
        row ??
        document.querySelector<HTMLElement>('[data-payment-action="register"]')
      )?.focus();
    });
  }

  private clearRemovalAttempt(restoreFocus: boolean): void {
    const selector = this.returnFocusSelector;
    this.removalPayment.set(null);
    this.removalReason.set('');
    if (restoreFocus) this.restoreFocus(selector);
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
