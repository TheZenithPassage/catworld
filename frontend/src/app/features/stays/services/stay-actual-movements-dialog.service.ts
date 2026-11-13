import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { defer, map, Observable, switchMap } from 'rxjs';

export type StayMovementType = 'ARRIVAL' | 'DEPARTURE';

export interface StayActualMovementsDialogData {
  stayId: string;
  focusType?: StayMovementType;
}

@Injectable({ providedIn: 'root' })
export class StayActualMovementsDialogService {
  private readonly dialog = inject(MatDialog);

  open(data: StayActualMovementsDialogData): Observable<boolean> {
    return defer(() => import('../components/stay-actual-movements/stay-actual-movements')).pipe(
      switchMap(({ StayActualMovements }) => {
        const ref = this.dialog.open<
          InstanceType<typeof StayActualMovements>,
          StayActualMovementsDialogData,
          boolean
        >(StayActualMovements, {
          data,
          width: '36rem',
          maxWidth: 'calc(100vw - 2rem)',
          maxHeight: 'calc(100dvh - 2rem)',
          autoFocus: 'dialog',
        });
        const editor = ref.componentInstance;
        return ref.afterClosed().pipe(map(() => editor.hasChanges()));
      }),
    );
  }
}
