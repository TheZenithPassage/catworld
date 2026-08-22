import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EntityDetailDialog } from './entity-detail-dialog';
import { EntityReference } from './entity-reference';
import { Observable, Subject } from 'rxjs';
@Injectable({ providedIn: 'root' })
export class EntityDetailDialogService {
  private readonly dialog = inject(MatDialog);
  open(reference: EntityReference): Observable<string> {
    const updates = new Subject<string>();
    const ref = this.dialog.open(EntityDetailDialog, {
      data: reference,
      width: 'min(52rem, calc(100vw - 2rem))',
      maxWidth: 'calc(100vw - 2rem)',
      maxHeight: 'calc(100vh - 2rem)',
      autoFocus: 'dialog',
    });
    ref.componentInstance.stayUpdated.subscribe((stayId) => updates.next(stayId));
    ref.afterClosed().subscribe(() => updates.complete());
    return updates.asObservable();
  }
}
