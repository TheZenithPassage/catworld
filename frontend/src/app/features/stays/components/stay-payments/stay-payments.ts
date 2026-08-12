import { HttpErrorResponse } from '@angular/common/http';
import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatDialog } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { formatLocalDate } from '../../../../shared/date/local-date-format';
import { BusinessTimeService } from '../../../../core/time/business-time.service';
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
type FocusContext = 'form' | 'removal';

@Component({
  selector: 'app-stay-payments',
  imports: [
    FormsModule,
    MatButton,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    NgTemplateOutlet,
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
  private readonly businessTime = inject(BusinessTimeService);

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
  readonly attemptedErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => this.attempted(),
  };
  readonly removalPayment = signal<StayPayment | null>(null);
  readonly removalReason = signal('');

  private formReturnFocusSelector: string | null = null;
  private formReturnFocusPaymentId: string | null = null;
  private removalReturnFocusSelector: string | null = null;
  private removalReturnFocusPaymentId: string | null = null;
  private errorFocusContext: FocusContext = 'form';

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
      next: (stay) => this.complete(stay, 'form'),
      error: (error: unknown) => this.fail(error, 'form'),
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
          subject: `${copy.removingSubject} ${payment.amount} · ${this.formatPaymentDate(payment.paymentDate)}`,
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
              this.complete(stay, 'removal');
            },
            error: (error: unknown) => this.fail(error, 'removal'),
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
    this.restoreFocus(this.errorFocusContext);
  }

  formatRegisteredAt(value: string): string {
    return this.businessTime.formatInstant(value, this.dateLocale());
  }

  formatPaymentDate(value: string): string {
    return formatLocalDate(value, this.dateLocale());
  }

  private actionIsValid(action: Exclude<PaymentAction, null>): boolean {
    if ((action === 'register' || action === 'edit') && !this.amountValid()) return false;
    if (action === 'register' && !this.paymentDate()) return false;
    return action === 'register' || this.reason().trim().length > 0;
  }

  private complete(stay: Stay, focusContext: FocusContext): void {
    this.submitting.set(false);
    const focusSelector = this.returnFocusSelector(focusContext);
    const focusPaymentId = this.returnFocusPaymentId(focusContext);
    this.resetForm();
    this.stayChange.emit(stay);
    this.restoreFocus(focusContext, focusSelector, focusPaymentId);
  }

  private fail(error: unknown, focusContext: FocusContext): void {
    this.submitting.set(false);
    this.errorFocusContext = focusContext;
    this.error.set(this.errorMessage(error));
  }

  private resetForm(restoreFocus = false): void {
    this.action.set(null);
    this.selectedPayment.set(null);
    this.amount.set('');
    this.paymentDate.set('');
    this.note.set('');
    this.reason.set('');
    this.error.set(null);
    this.attempted.set(false);
    if (restoreFocus) this.restoreFocus('form');
  }

  private captureReturnFocus(
    trigger: EventTarget | null | undefined,
    action: 'register' | 'edit' | 'annul' | 'remove',
    paymentId?: string,
  ): void {
    const context: FocusContext = action === 'remove' ? 'removal' : 'form';
    let selector = paymentId
      ? `[data-payment-id="${paymentId}"][data-payment-action="${action}"]`
      : `[data-payment-action="${action}"]`;
    if (trigger instanceof HTMLElement && !trigger.matches(selector)) {
      selector = '';
    }
    if (context === 'form') {
      this.formReturnFocusSelector = selector || null;
      this.formReturnFocusPaymentId = paymentId ?? null;
    } else {
      this.removalReturnFocusSelector = selector || null;
      this.removalReturnFocusPaymentId = paymentId ?? null;
    }
  }

  private focusFormControl(name: 'paymentAmount' | 'paymentReason'): void {
    setTimeout(() => document.querySelector<HTMLElement>(`[name="${name}"]`)?.focus());
  }

  private restoreFocus(
    context: FocusContext,
    selector = this.returnFocusSelector(context),
    paymentId = this.returnFocusPaymentId(context),
  ): void {
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
    const selector = this.removalReturnFocusSelector;
    const paymentId = this.removalReturnFocusPaymentId;
    this.removalPayment.set(null);
    this.removalReason.set('');
    if (restoreFocus) this.restoreFocus('removal', selector, paymentId);
  }

  private returnFocusSelector(context: FocusContext): string | null {
    return context === 'form' ? this.formReturnFocusSelector : this.removalReturnFocusSelector;
  }

  private returnFocusPaymentId(context: FocusContext): string | null {
    return context === 'form' ? this.formReturnFocusPaymentId : this.removalReturnFocusPaymentId;
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
