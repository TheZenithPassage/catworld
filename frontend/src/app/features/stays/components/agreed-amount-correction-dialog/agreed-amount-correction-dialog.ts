import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
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
import {
  isStalePricingConfirmationError,
  PendingPricePreview,
  Stay,
} from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { sameWholeMoney } from '../../utils/stay-money.util';

type PreviewState =
  | { status: 'loading' | 'error' | 'no-longer-pending' }
  | { status: 'loaded'; price: PendingPricePreview };

@Component({
  selector: 'app-agreed-amount-correction-dialog',
  imports: [
    FormsModule,
    MatButton,
    MatCheckbox,
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
  templateUrl: './agreed-amount-correction-dialog.html',
  styleUrl: './agreed-amount-correction-dialog.scss',
})
export class AgreedAmountCorrectionDialog {
  private readonly api = inject(StayApiService);
  private readonly ref = inject(MatDialogRef<AgreedAmountCorrectionDialog, Stay | 'reload'>);
  readonly stay = inject<Stay>(MAT_DIALOG_DATA);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);
  readonly text = this.i18n.text;
  readonly pricePending = signal(false);
  readonly amount = signal(this.stay.agreedAmount ?? '');
  readonly reason = signal('');
  readonly attempted = signal(false);
  readonly submitting = signal(false);
  readonly previewState = signal<PreviewState>({ status: 'loading' });
  readonly error = createLanguageResetError(this.i18n.language);
  readonly preview = computed(() => {
    const state = this.previewState();
    return state.status === 'loaded' ? state.price : null;
  });
  readonly amountValid = computed(() => /^\d{1,19}$/.test(this.amount()));
  readonly changed = computed(
    () =>
      this.pricePending() ||
      (this.amountValid() &&
        (this.stay.agreedAmount === null ||
          !sameWholeMoney(this.amount(), this.stay.agreedAmount))),
  );
  readonly reasonRequired = computed(() => {
    if (!this.stay.pricePending) return this.changed();
    const preview = this.preview();
    return (
      preview !== null &&
      (preview.previouslyAgreed ||
        (this.amountValid() &&
          preview.suggestedAmount !== null &&
          !sameWholeMoney(this.amount(), preview.suggestedAmount)))
    );
  });
  readonly matcher: ErrorStateMatcher = {
    isErrorState: (control) => this.attempted() && Boolean(control?.invalid),
  };

  constructor() {
    if (this.stay.pricePending) this.loadPreview();
  }

  loadPreview(): void {
    this.previewState.set({ status: 'loading' });
    this.api
      .previewPendingPrice(this.stay.stayId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (price) => this.previewState.set({ status: 'loaded', price }),
        error: (error) =>
          this.previewState.set({
            status: isStalePricingConfirmationError(error) ? 'no-longer-pending' : 'error',
          }),
      });
  }

  formatAmount(value: string | null): string {
    return value === null
      ? this.text().stays.pricing.unavailable
      : new Intl.NumberFormat(this.i18n.dateLocale()).format(BigInt(value));
  }

  submit(): void {
    const preview = this.preview();
    if (this.submitting() || (this.stay.pricePending && !preview)) return;
    this.attempted.set(true);
    this.error.set(null);
    if (
      (!this.pricePending() && !this.amountValid()) ||
      (this.reasonRequired() && !this.reason().trim())
    )
      return;
    const reason = this.stay.pricePending && !this.reasonRequired() ? null : this.reason().trim();
    this.submitting.set(true);
    this.ref.disableClose = true;
    this.api
      .correctAgreedAmount(
        this.stay.stayId,
        this.pricePending()
          ? { pricePending: true, reason: this.reason().trim() }
          : {
              agreedAmount: this.amount(),
              reason: reason || null,
              ...(preview ? { expectedPendingPriceVersion: preview.version } : {}),
            },
      )
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stay) => this.ref.close(stay),
        error: (error) => {
          this.submitting.set(false);
          this.ref.disableClose = false;
          if (preview && isStalePricingConfirmationError(error)) {
            this.error.set(this.text().stays.pricing.staleUpdate);
            this.loadPreview();
            return;
          }
          this.error.set(this.errorMessage(error));
        },
      });
  }
  private errorMessage(error: unknown): string {
    const copy = this.text().stays.pricing.errors;
    if (!(error instanceof HttpErrorResponse)) return copy.correctionFailed;
    if (error.status === 403) return this.text().stays.payments.errors.permission;
    if (error.status === 404) return this.text().stays.payments.errors.missing;
    if (error.status === 409) {
      const message = this.backendMessage(error.error).toLowerCase();
      return message.includes('below') || message.includes('active payment')
        ? this.text().stays.payments.errors.activeFloor
        : this.text().stays.payments.errors.conflict;
    }
    return copy.correctionFailed;
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
