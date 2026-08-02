import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';

import { I18nService } from '../../core/i18n/i18n.service';

export interface PermanentDeletionConfirmationDialogData {
  subject: string;
}

export function isPermanentDeletionConfirmed(result: boolean | undefined): result is true {
  return result === true;
}

@Component({
  selector: 'app-permanent-deletion-confirmation-dialog',
  imports: [MatButton, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle],
  templateUrl: './permanent-deletion-confirmation-dialog.html',
  styleUrl: './permanent-deletion-confirmation-dialog.scss',
})
export class PermanentDeletionConfirmationDialog {
  readonly data = inject<PermanentDeletionConfirmationDialogData>(MAT_DIALOG_DATA);

  private readonly i18nService = inject(I18nService);

  readonly text = this.i18nService.text;
}
