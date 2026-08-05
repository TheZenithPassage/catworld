import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { I18nService } from '../../core/i18n/i18n.service';

export interface PermanentDeletionConfirmationDialogData {
  subject: string;
  reasonLabel?: string;
  reasonRequiredMessage?: string;
}

export interface PermanentDeletionConfirmationResult {
  confirmed: true;
  reason?: string;
}

export function isPermanentDeletionConfirmed(
  result: boolean | PermanentDeletionConfirmationResult | undefined,
): result is true | PermanentDeletionConfirmationResult {
  return result === true || (typeof result === 'object' && result?.confirmed === true);
}

@Component({
  selector: 'app-permanent-deletion-confirmation-dialog',
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
  ],
  templateUrl: './permanent-deletion-confirmation-dialog.html',
  styleUrl: './permanent-deletion-confirmation-dialog.scss',
})
export class PermanentDeletionConfirmationDialog {
  readonly data = inject<PermanentDeletionConfirmationDialogData>(MAT_DIALOG_DATA);

  private readonly i18nService = inject(I18nService);

  readonly text = this.i18nService.text;
  readonly reason = signal('');
  readonly reasonRequired = computed(() => this.data.reasonLabel !== undefined);
  readonly confirmationResult = computed<true | PermanentDeletionConfirmationResult>(() =>
    this.reasonRequired() ? { confirmed: true, reason: this.reason().trim() } : true,
  );
  readonly canConfirm = computed(() => !this.reasonRequired() || this.reason().trim().length > 0);
}
