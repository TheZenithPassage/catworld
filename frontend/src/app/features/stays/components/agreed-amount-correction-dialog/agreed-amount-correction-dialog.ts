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
import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { sameWholeMoney } from '../../utils/stay-money.util';

@Component({
  selector: 'app-agreed-amount-correction-dialog',
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
  templateUrl: './agreed-amount-correction-dialog.html',
  styleUrl: './agreed-amount-correction-dialog.scss',
})
export class AgreedAmountCorrectionDialog {
  private readonly api = inject(StayApiService);
  private readonly ref = inject(MatDialogRef<AgreedAmountCorrectionDialog, Stay>);
  readonly stay = inject<Stay>(MAT_DIALOG_DATA);
  private readonly i18n = inject(I18nService);
  readonly text = this.i18n.text;
  readonly amount = signal(this.stay.agreedAmount ?? '');
  readonly reason = signal('');
  readonly attempted = signal(false);
  readonly submitting = signal(false);
  readonly error = createLanguageResetError(this.i18n.language);
  readonly amountValid = computed(() => /^\d{1,19}$/.test(this.amount()));
  readonly changed = computed(
    () =>
      this.stay.agreedAmount !== null &&
      this.amountValid() &&
      !sameWholeMoney(this.amount(), this.stay.agreedAmount),
  );
  readonly matcher: ErrorStateMatcher = {
    isErrorState: (control) => this.attempted() && Boolean(control?.invalid),
  };
  submit(): void {
    if (this.submitting()) return;
    this.attempted.set(true);
    this.error.set(null);
    if (!this.amountValid() || (this.changed() && !this.reason().trim())) return;
    this.submitting.set(true);
    this.api
      .correctAgreedAmount(this.stay.stayId, {
        agreedAmount: this.amount(),
        reason: this.reason().trim() || null,
      })
      .subscribe({
        next: (stay) => this.ref.close(stay),
        error: (error) => {
          this.submitting.set(false);
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
      const message = JSON.stringify(error.error).toLowerCase();
      return message.includes('below') || message.includes('active payment')
        ? this.text().stays.payments.errors.activeFloor
        : this.text().stays.payments.errors.conflict;
    }
    return copy.correctionFailed;
  }
}
