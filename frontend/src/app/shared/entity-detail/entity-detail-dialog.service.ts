import { Location } from '@angular/common';
import { DestroyRef, effect, inject, Injectable, untracked } from '@angular/core';
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
  private readonly location = inject(Location);
  private readonly destroyRef = inject(DestroyRef);

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
              ref.componentInstance.closeImmediately();
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
      // The Router guard must decide whether to discard a draft before closing on popstate.
      closeOnNavigation: false,
      closePredicate: (_result, _config, component) =>
        this.destroyRef.destroyed ||
        !(component instanceof EntityDetailDialog) ||
        component.allowClose(),
    });
    ref.componentInstance.entityUpdated.subscribe((update) => updates.next(update));
    const locationChanges = this.location.subscribe(() => {
      if (ref.getState() === MatDialogState.OPEN && !ref.componentInstance.hasCatDraft()) {
        ref.componentInstance.closeImmediately();
      }
    });
    ref.afterClosed().subscribe(() => {
      locationChanges.unsubscribe();
      updates.complete();
    });
    return updates.asObservable();
  }

  confirmCatDraftNavigation(destination: string): boolean | Observable<boolean> {
    if (!this.authSession.authenticated()) return true;
    for (const ref of this.dialog.openDialogs) {
      if (
        ref.componentInstance instanceof EntityDetailDialog &&
        ref.getState() === MatDialogState.OPEN &&
        ref.componentInstance.hasCatDraft()
      ) {
        return ref.componentInstance.confirmCatNavigation(destination);
      }
    }
    return true;
  }
}
