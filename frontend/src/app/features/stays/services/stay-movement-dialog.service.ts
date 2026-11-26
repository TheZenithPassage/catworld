import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { EMPTY, map, Observable, takeUntil } from 'rxjs';

import { StayMovementDialog } from '../components/stay-movement-dialog/stay-movement-dialog';
import type { StayMovementDialogData } from '../models/stay-movement.model';

@Injectable({ providedIn: 'root' })
export class StayMovementDialogService {
  private readonly dialog = inject(MatDialog);

  open(data: StayMovementDialogData, parentClosing?: Observable<unknown>): Observable<boolean> {
    const id = `stay-movement-${data.stayId}`;
    if (this.dialog.getDialogById(id)) return EMPTY;
    const ref = this.dialog.open(StayMovementDialog, {
      id,
      data,
      width: '34rem',
      maxWidth: 'calc(100vw - 2rem)',
      maxHeight: 'calc(100dvh - 2rem)',
      autoFocus: 'dialog',
      ...(parentClosing && {
        enterAnimationDuration: 0,
        delayFocusTrap: false,
        restoreFocus: false,
      }),
    });
    parentClosing?.pipe(takeUntil(ref.afterClosed())).subscribe(() => ref.close());
    const instance = ref.componentInstance;
    return ref.afterClosed().pipe(map(() => instance.needsRefresh()));
  }
}
