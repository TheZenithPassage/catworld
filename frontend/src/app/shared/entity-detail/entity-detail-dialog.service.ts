import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EntityDetailDialog } from './entity-detail-dialog';
import { EntityDetailUpdate, EntityReference } from './entity-reference';
import { Observable, Subject } from 'rxjs';

export const ENTITY_DETAIL_DIALOG_WIDTH = 'min(52rem, calc(100vw - 2rem))';
@Injectable({ providedIn: 'root' })
export class EntityDetailDialogService {
  private readonly dialog = inject(MatDialog);
  open(reference: EntityReference): Observable<EntityDetailUpdate> {
    const updates = new Subject<EntityDetailUpdate>();
    const ref = this.dialog.open(EntityDetailDialog, {
      data: reference,
      width: ENTITY_DETAIL_DIALOG_WIDTH,
      maxWidth: 'calc(100vw - 2rem)',
      maxHeight: 'calc(100dvh - 2rem)',
      autoFocus: 'dialog',
    });
    ref.componentInstance.entityUpdated.subscribe((update) => updates.next(update));
    ref.afterClosed().subscribe(() => updates.complete());
    return updates.asObservable();
  }
}
