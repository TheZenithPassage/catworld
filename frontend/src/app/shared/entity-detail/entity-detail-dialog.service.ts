import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EntityDetailDialog } from './entity-detail-dialog';
import { EntityReference } from './entity-reference';
import { I18nService } from '../../core/i18n/i18n.service';
@Injectable({ providedIn: 'root' })
export class EntityDetailDialogService {
  private readonly dialog = inject(MatDialog);
  private readonly text = inject(I18nService).text;
  open(reference: EntityReference): void {
    this.dialog.open(EntityDetailDialog, {
      data: reference,
      width: 'min(52rem, calc(100vw - 2rem))',
      maxWidth: 'calc(100vw - 2rem)',
      maxHeight: 'calc(100vh - 2rem)',
      ariaLabel:
        reference.entityType === 'owner'
          ? this.text().owners.detail.title
          : reference.entityType === 'cat'
            ? this.text().cats.detail.title
            : reference.entityType === 'vet'
              ? this.text().vets.detail.title
              : undefined,
      autoFocus: 'dialog',
    });
  }
}
