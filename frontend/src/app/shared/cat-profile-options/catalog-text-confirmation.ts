import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, Injectable, computed } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { catchError, EMPTY, finalize, Observable, switchMap, throwError } from 'rxjs';

import { I18nService } from '../../core/i18n/i18n.service';
import type {
  CatCatalogSelectionField,
  CatCatalogText,
} from '../../features/cats/models/cat.model';

@Component({
  imports: [MatButton, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle],
  template: `
    <h2 mat-dialog-title>{{ copy().title }}</h2>
    <mat-dialog-content>
      <p>{{ copy().description }}</p>
      <ul>
        @for (row of rows(); track row.field) {
          <li>
            <strong>{{ row.label }}</strong> · {{ row.value }}
          </li>
        }
      </ul>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button type="button" [mat-dialog-close]="false">{{ copy().review }}</button>
      <button mat-flat-button type="button" [mat-dialog-close]="true">{{ copy().save }}</button>
    </mat-dialog-actions>
  `,
})
export class CatalogTextConfirmationDialog {
  private readonly fields = inject<CatCatalogText>(MAT_DIALOG_DATA);
  private readonly text = inject(I18nService).text;
  protected readonly copy = computed(() => this.text().catalogs.saveText);
  protected readonly rows = computed(() => {
    const form = this.text().cats.form;
    const labels: Record<CatCatalogSelectionField, string> = {
      breed: form.breed,
      foodBrand: form.foodBrand,
      foodDetail: form.foodDetail,
      litterDetail: form.ownLitterDetail,
      lastInternalDewormerName: form.lastInternalDewormerName,
      lastExternalDewormerName: form.lastExternalDewormerName,
    };
    return (Object.keys(labels) as CatCatalogSelectionField[]).flatMap((field) => {
      const value = this.fields[field];
      return value ? [{ field, label: labels[field], value }] : [];
    });
  });
}

@Injectable({ providedIn: 'root' })
export class CatalogTextConfirmation {
  private readonly dialog = inject(MatDialog);

  save<T>(
    request: (confirmation?: CatCatalogText) => Observable<T>,
    review?: () => void,
  ): Observable<T> {
    return request().pipe(
      catchError((error: unknown) => {
        if (
          !(error instanceof HttpErrorResponse) ||
          error.status !== 409 ||
          error.error?.code !== 'CAT_CATALOG_TEXT_CONFIRMATION_REQUIRED' ||
          !error.error.fields
        ) {
          return throwError(() => error);
        }
        const fields: CatCatalogText = error.error.fields;
        const dialog = this.dialog.open<CatalogTextConfirmationDialog, CatCatalogText, boolean>(
          CatalogTextConfirmationDialog,
          { data: fields },
        );
        return dialog.afterClosed().pipe(
          finalize(() => dialog.close()),
          switchMap((confirmed) => {
            if (confirmed === true) return request(fields);
            if (confirmed === false) review?.();
            return EMPTY;
          }),
        );
      }),
    );
  }
}
