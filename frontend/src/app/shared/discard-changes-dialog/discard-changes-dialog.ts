import { Component, computed, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { I18nService } from '../../core/i18n/i18n.service';

@Component({
  selector: 'app-discard-changes-dialog',
  imports: [MatButton, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle],
  template: `
    <h2 mat-dialog-title>{{ text().title }}</h2>
    <mat-dialog-content>{{ text().message }}</mat-dialog-content>
    <mat-dialog-actions align="end">
      <button class="keep-editing" mat-flat-button type="button" [mat-dialog-close]="false">
        {{ text().keepEditing }}
      </button>
      <button class="discard-changes" mat-button type="button" [mat-dialog-close]="true">
        {{ text().discard }}
      </button>
    </mat-dialog-actions>
  `,
  styles: `
    h2[mat-dialog-title] {
      padding-block-end: 0.75rem;
      font-weight: 750;
    }

    mat-dialog-actions {
      flex-wrap: wrap;
      gap: 0.5rem;
      padding: 0.5rem 1.5rem 1.25rem;
    }

    mat-dialog-actions button {
      margin: 0;
    }
  `,
})
export class DiscardChangesDialog {
  private readonly i18n = inject(I18nService);

  protected readonly text = computed(() => this.i18n.text().entityDetail.discardChanges);
}

export function openDiscardChangesDialog(
  dialog: MatDialog,
): MatDialogRef<DiscardChangesDialog, boolean> {
  return dialog.open<DiscardChangesDialog, void, boolean>(DiscardChangesDialog, {
    width: '30rem',
    maxWidth: 'calc(100vw - 2rem)',
    autoFocus: '.keep-editing',
    closeOnNavigation: false,
  });
}
