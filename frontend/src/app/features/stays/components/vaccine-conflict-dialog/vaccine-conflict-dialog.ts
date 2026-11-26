import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { VaccineConflictViolation } from '../../models/stay.model';
import { vaccineConflictLabels } from '../../models/vaccine-conflict-label';

export interface VaccineConflictDialogData {
  violations: VaccineConflictViolation[];
  canOverride: boolean;
}

@Component({
  selector: 'app-vaccine-conflict-dialog',
  imports: [MatButton, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle],
  templateUrl: './vaccine-conflict-dialog.html',
  styleUrl: './vaccine-conflict-dialog.scss',
})
export class VaccineConflictDialog {
  readonly data = inject<VaccineConflictDialogData>(MAT_DIALOG_DATA);

  private readonly i18nService = inject(I18nService);

  readonly text = this.i18nService.text;

  labels(violation: VaccineConflictViolation) {
    return vaccineConflictLabels(
      violation,
      this.text().stays.vaccineConflict,
      this.i18nService.dateLocale(),
    );
  }
}
