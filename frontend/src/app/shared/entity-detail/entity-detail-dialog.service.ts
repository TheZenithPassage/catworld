import { effect, inject, Injectable, untracked } from '@angular/core';
import { MatDialog, MatDialogState } from '@angular/material/dialog';
import { Observable, Subject } from 'rxjs';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { EntityDetailDialog } from './entity-detail-dialog';
import { EntityDetailUpdate, EntityReference } from './entity-reference';

export const ENTITY_DETAIL_DIALOG_WIDTH = 'min(52rem, calc(100vw - 2rem))';
@Injectable({ providedIn: 'root' })
export class EntityDetailDialogService {
  private readonly dialog = inject(MatDialog);
  private readonly authSession = inject(AuthSessionService);

  constructor() {
    let hadSession = this.authSession.authenticated() !== null;
    effect(() => {
      const authenticated = this.authSession.authenticated() !== null;
      if (hadSession && !authenticated) {
        untracked(() => {
          for (const ref of this.dialog.openDialogs) {
            if (
              ref.componentInstance instanceof EntityDetailDialog &&
              ref.getState() === MatDialogState.OPEN
            ) {
              ref.close();
            }
          }
        });
      }
      hadSession = authenticated;
    });
  }

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
