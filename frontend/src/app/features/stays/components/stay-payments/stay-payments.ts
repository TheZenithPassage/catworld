import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';

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
import { PaymentActionDialog } from '../payment-action-dialog/payment-action-dialog';

@Component({
  selector: 'app-stay-payments',
  imports: [MatButton, UiStateComponent],
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

  readonly submitting = signal(false);
  readonly removalDialogOpen = signal(false);
  readonly actionDialogOpen = signal(false);
  readonly error = createLanguageResetError(this.i18n.language);
  readonly removalPayment = signal<StayPayment | null>(null);
  readonly removalReason = signal('');

  private removalReturnFocusSelector: string | null = null;
  private removalReturnFocusPaymentId: string | null = null;

  readonly isAdmin = computed(() => this.authSession.hasRole('ADMIN'));
  readonly canMutate = computed(() => {
    if (this.isAdmin()) return true;
    const status = getStayStatus(this.stay());
    return status === 'reserved' || status === 'checked-in';
  });
  readonly mutationLocked = computed(
    () => this.submitting() || this.removalDialogOpen() || this.actionDialogOpen(),
  );

  startRegister(trigger?: EventTarget | null): void {
    if (this.mutationLocked()) return;
    this.openActionDialog('register');
  }

  startEdit(payment: StayPayment, trigger?: EventTarget | null): void {
    if (this.mutationLocked()) return;
    this.openActionDialog('edit', payment);
  }

  startAnnul(payment: StayPayment, trigger?: EventTarget | null): void {
    if (this.mutationLocked()) return;
    this.openActionDialog('annul', payment);
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
              this.completeRemoval(stay);
            },
            error: (error: unknown) => this.failRemoval(error),
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
    this.restoreRemovalFocus();
  }

  formatRegisteredAt(value: string): string {
    return this.businessTime.formatInstant(value, this.dateLocale());
  }

  formatPaymentDate(value: string): string {
    return formatLocalDate(value, this.dateLocale());
  }

  private completeRemoval(stay: Stay): void {
    this.submitting.set(false);
    this.stayChange.emit(stay);
    this.restoreRemovalFocus();
  }

  private failRemoval(error: unknown): void {
    this.submitting.set(false);
    this.error.set(this.errorMessage(error));
  }

  private captureReturnFocus(
    trigger: EventTarget | null | undefined,
    action: 'remove',
    paymentId?: string,
  ): void {
    let selector = paymentId
      ? `[data-payment-id="${paymentId}"][data-payment-action="${action}"]`
      : `[data-payment-action="${action}"]`;
    if (trigger instanceof HTMLElement && !trigger.matches(selector)) {
      selector = '';
    }
    this.removalReturnFocusSelector = selector || null;
    this.removalReturnFocusPaymentId = paymentId ?? null;
  }

  private openActionDialog(mode: 'register' | 'edit' | 'annul', payment?: StayPayment): void {
    this.clearRemovalAttempt(false);
    this.actionDialogOpen.set(true);
    this.dialog
      .open(PaymentActionDialog, {
        data: { stay: this.stay(), mode, payment },
        width: '36rem',
        maxWidth: 'calc(100vw - 2rem)',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
      })
      .afterClosed()
      .subscribe((stay: Stay | undefined) => {
        this.actionDialogOpen.set(false);
        if (stay) this.stayChange.emit(stay);
      });
  }

  private restoreRemovalFocus(
    selector = this.removalReturnFocusSelector,
    paymentId = this.removalReturnFocusPaymentId,
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
    if (restoreFocus) this.restoreRemovalFocus(selector, paymentId);
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
