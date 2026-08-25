import { Component, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { finalize } from 'rxjs';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { BusinessTimeService } from '../../../../core/time/business-time.service';
import { StayApiService } from '../../services/stay-api.service';

export interface StayCancellationDialogData {
  stayId: string;
  catNames: string[];
  ownerName: string;
  startAt: string;
  endAt: string;
}

@Component({
  selector: 'app-stay-cancellation-dialog',
  imports: [MatButton, MatDialogActions, MatDialogContent, MatDialogTitle],
  templateUrl: './stay-cancellation-dialog.html',
  styleUrl: './stay-cancellation-dialog.scss',
})
export class StayCancellationDialog {
  private readonly api = inject(StayApiService);
  private readonly businessTime = inject(BusinessTimeService);
  private readonly i18n = inject(I18nService);
  private readonly dialogRef = inject(MatDialogRef<StayCancellationDialog, boolean>);
  readonly data = inject<StayCancellationDialogData>(MAT_DIALOG_DATA);
  readonly text = this.i18n.text;
  readonly submitting = signal(false);
  readonly failed = signal(false);

  date(value: string): string {
    return this.businessTime.formatLocalDateTime(value, this.i18n.dateLocale());
  }

  stayContext(): string {
    return `${this.data.catNames.join(', ')} (${this.data.ownerName})`;
  }

  dismiss(): void {
    if (!this.submitting()) this.dialogRef.close(false);
  }

  confirm(): void {
    if (this.submitting()) return;
    this.submitting.set(true);
    this.failed.set(false);
    this.dialogRef.disableClose = true;
    this.api
      .cancelStay(this.data.stayId)
      .pipe(
        finalize(() => {
          this.submitting.set(false);
          this.dialogRef.disableClose = false;
        }),
      )
      .subscribe({
        next: () => this.dialogRef.close(true),
        error: () => this.failed.set(true),
      });
  }
}
