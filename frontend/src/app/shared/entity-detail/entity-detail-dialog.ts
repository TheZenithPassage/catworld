import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { CatDetail } from '../../features/cats/components/cat-detail/cat-detail';
import { OwnerDetail } from '../../features/owners/components/owner-detail/owner-detail';
import { VetDetail } from '../../features/vets/components/vet-detail/vet-detail';
import { EntityReference } from './entity-reference';
import { I18nService } from '../../core/i18n/i18n.service';
@Component({
  selector: 'app-entity-detail-dialog',
  imports: [
    MatButton,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    OwnerDetail,
    CatDetail,
    VetDetail,
  ],
  templateUrl: './entity-detail-dialog.html',
  styleUrl: './entity-detail-dialog.scss',
})
export class EntityDetailDialog {
  readonly reference = inject<EntityReference>(MAT_DIALOG_DATA);
  readonly text = inject(I18nService).text;
  title(): string {
    const text = this.text();
    return this.reference.entityType === 'owner'
      ? text.owners.detail.title
      : this.reference.entityType === 'cat'
        ? text.cats.detail.title
        : text.vets.detail.title;
  }
  closeLabel(): string {
    const text = this.text();
    return this.reference.entityType === 'owner'
      ? text.owners.detail.close
      : this.reference.entityType === 'cat'
        ? text.cats.detail.close
        : text.vets.detail.close;
  }
}
