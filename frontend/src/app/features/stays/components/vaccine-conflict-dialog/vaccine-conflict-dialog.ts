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
import {
  VaccineConflictReason,
  VaccineConflictViolation,
  VaccineType,
} from '../../models/stay.model';

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

  vaccineLabel(vaccineType: VaccineType): string {
    return vaccineType === 'RABIES'
      ? this.text().stays.vaccineConflict.vaccine.rabies
      : this.text().stays.vaccineConflict.vaccine.tripleFeline;
  }

  reasonLabel(reason: VaccineConflictReason): string {
    return reason === 'MISSING'
      ? this.text().stays.vaccineConflict.reason.missing
      : this.text().stays.vaccineConflict.reason.expired;
  }
}
