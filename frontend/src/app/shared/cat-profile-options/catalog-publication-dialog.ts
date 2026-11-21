import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { finalize } from 'rxjs';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { I18nService } from '../../core/i18n/i18n.service';
import {
  CatProfileOption,
  CatProfileOptionFieldKey,
  CatProfileOptionsService,
} from './cat-profile-options.service';

export interface CatalogPublication {
  field: CatProfileOptionFieldKey | 'foodDetail';
  name: string;
  catalog: string;
  brandId: string | undefined;
}

@Component({
  imports: [MatButton, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle],
  template: `
    <h2 mat-dialog-title>{{ copy().confirm }}</h2>
    <mat-dialog-content>
      <p>{{ copy().description(data.name, data.catalog) }}</p>
      @if (failed()) {
        <p role="alert">{{ text().cats.form.publishOptionError }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" mat-dialog-close [disabled]="publishing()">
        {{ text().catalogs.cancel }}
      </button>
      <button mat-flat-button type="button" (click)="publish()" [disabled]="publishing()">
        {{ publishing() ? copy().publishing : copy().confirm }}
      </button>
    </mat-dialog-actions>
  `,
})
export class CatalogPublicationDialog {
  protected readonly data = inject<CatalogPublication>(MAT_DIALOG_DATA);
  private readonly options = inject(CatProfileOptionsService);
  private readonly auth = inject(AuthSessionService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog =
    inject<MatDialogRef<CatalogPublicationDialog, CatProfileOption>>(MatDialogRef);

  protected readonly text = inject(I18nService).text;
  protected readonly copy = computed(() => this.text().catalogs.publish);
  protected readonly publishing = signal(false);
  protected readonly failed = signal(false);

  protected publish(): void {
    if (this.publishing() || !this.auth.hasRole('ADMIN')) return;
    const { field, name, brandId } = this.data;
    this.publishing.set(true);
    this.failed.set(false);
    this.dialog.disableClose = true;
    this.options
      .publish(field, name, brandId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.publishing.set(false);
          this.dialog.disableClose = false;
        }),
      )
      .subscribe({
        next: (option) => this.dialog.close(option),
        error: () => this.failed.set(true),
      });
  }
}
