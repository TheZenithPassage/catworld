import { Component, inject, signal } from '@angular/core';
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
import { UiStateComponent } from '../ui-state/ui-state';
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
    UiStateComponent,
  ],
  templateUrl: './entity-detail-dialog.html',
  styleUrl: './entity-detail-dialog.scss',
})
export class EntityDetailDialog {
  readonly reference = signal(inject<EntityReference>(MAT_DIALOG_DATA));
  readonly editing = signal(false);
  readonly text = inject(I18nService).text;
  title(): string {
    const text = this.text();
    return this.reference().entityType === 'owner'
      ? text.owners.detail.title
      : this.reference().entityType === 'cat'
        ? text.cats.detail.title
        : this.reference().entityType === 'vet'
          ? text.vets.detail.title
          : text.stays.edit.title;
  }
  closeLabel(): string {
    const text = this.text();
    return this.reference().entityType === 'owner'
      ? text.owners.detail.close
      : this.reference().entityType === 'cat'
        ? text.cats.detail.close
        : this.reference().entityType === 'vet'
          ? text.vets.detail.close
          : text.owners.detail.close;
  }
  showReference(reference: EntityReference): void {
    this.editing.set(false);
    this.reference.set(reference);
  }
  enterEdit(): void {
    this.editing.set(true);
  }
  leaveEdit(): void {
    this.editing.set(false);
  }
}
