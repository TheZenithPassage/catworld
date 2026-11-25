import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { finalize, interval } from 'rxjs';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { BusinessTimeService } from '../../../../core/time/business-time.service';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import type {
  StayActualMovements,
  StayMovementDialogData,
  StayMovementType,
} from '../../models/stay-movement.model';
import { StayApiService } from '../../services/stay-api.service';
import { stayBookingConflictCatName } from '../../utils/stay-form-error';
import { STAY_MOVEMENT_TRANSLATIONS } from './stay-movement.translations';

type MovementError = 'invalid' | 'rejected' | 'conflict' | 'forbidden' | 'failed';

@Component({
  selector: 'app-stay-movement-dialog',
  imports: [
    MatButton,
    MatDialogActions,
    MatDialogContent,
    MatDialogTitle,
    MatFormField,
    MatInput,
    MatLabel,
    UiStateComponent,
  ],
  templateUrl: './stay-movement-dialog.html',
  styleUrl: './stay-movement-dialog.scss',
})
export class StayMovementDialog {
  private readonly api = inject(StayApiService);
  private readonly businessTime = inject(BusinessTimeService);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject(MatDialogRef<StayMovementDialog>);
  readonly data = inject<StayMovementDialogData>(MAT_DIALOG_DATA);
  readonly copy = computed(() => STAY_MOVEMENT_TRANSLATIONS[this.i18n.language()]);
  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly movements = signal<StayActualMovements | null>(null);
  private readonly error = signal<MovementError | { catName: string } | null>(null);
  readonly errorMessage = computed(() => {
    const error = this.error();
    if (!error) return null;
    return typeof error === 'string'
      ? this.copy()[error]
      : this.i18n.text().stays.create.errors.bookingConflict(error.catName);
  });
  readonly needsRefresh = signal(false);
  readonly time = signal('');
  readonly day = signal('');
  readonly manualTime = signal(false);
  readonly serverTime = signal<string | null>(null);
  readonly recording =
    this.data.action === 'record-arrival' || this.data.action === 'record-departure';
  private readonly today = computed(() => {
    const now = this.serverTime();
    return now ? this.businessTime.instantToLocalDateTime(now).slice(0, 10) : '';
  });
  readonly latestDay = computed(() => {
    const departure = this.movements()?.endAt.slice(0, 10);
    const today = this.today();
    return departure && departure < today ? departure : today;
  });
  readonly earliestDay = computed(() => {
    const movements = this.movements();
    return this.type === 'DEPARTURE' && movements?.arrival
      ? this.businessTime.instantToLocalDateTime(movements.arrival.occurredAt).slice(0, 10)
      : movements?.startAt.slice(0, 10);
  });

  readonly type: StayMovementType =
    this.data.action === 'record-departure' ? 'DEPARTURE' : 'ARRIVAL';
  readonly allowsNow = computed(() => {
    const movements = this.movements();
    if (!movements) return false;
    const today = this.today();
    return this.type === 'ARRIVAL'
      ? movements.arrivalAllowsNow && today === movements.startAt.slice(0, 10)
      : movements.departureAllowsNow && today <= movements.endAt.slice(0, 10);
  });
  readonly requiresTime = computed(
    () =>
      this.data.action === 'correct-arrival' ||
      (this.recording && (this.manualTime() || !this.allowsNow())),
  );
  readonly available = computed(() => {
    const movements = this.movements();
    if (!movements) return false;
    switch (this.data.action) {
      case 'correct-arrival':
        return movements.arrival?.canEdit === true;
      case 'reset-arrival':
        return movements.canResetArrival;
      case 'record-arrival':
        return movements.canRecordArrival;
      case 'record-departure':
        return movements.canRecordDeparture;
    }
  });
  readonly submitDisabled = computed(
    () =>
      this.saving() ||
      !this.available() ||
      this.needsRefresh() ||
      (this.requiresTime() && (!this.day() || !this.time())),
  );

  constructor() {
    this.api
      .getActualMovements(this.data.stayId)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (movements) => {
          this.serverTime.set(movements.serverNow);
          this.movements.set(movements);
          this.day.set(this.type === 'ARRIVAL' ? movements.startAt.slice(0, 10) : this.latestDay());
          if (!this.available()) this.needsRefresh.set(true);
          if (this.data.action === 'correct-arrival' && movements.arrival) {
            const local = this.businessTime.instantToLocalDateTime(movements.arrival.occurredAt);
            this.day.set(local.slice(0, 10));
            this.time.set(local.slice(11, 16));
          }
          if (this.recording && this.available()) {
            const sample = Date.parse(movements.serverNow);
            const receivedAt = performance.now();
            interval(1000)
              .pipe(takeUntilDestroyed(this.destroyRef))
              .subscribe(() => {
                this.serverTime.set(
                  new Date(sample + performance.now() - receivedAt).toISOString(),
                );
              });
          }
        },
        error: () => this.needsRefresh.set(true),
      });
  }

  formatServerTime(value: string): string {
    return this.businessTime.formatInstant(value, this.i18n.dateLocale(), 'medium');
  }

  dismiss(): void {
    if (!this.saving()) this.dialogRef.close();
  }

  confirm(): void {
    if (this.submitDisabled()) return;
    const movements = this.movements();
    if (!movements) return;

    let occurredAt: string | null = null;
    if (this.requiresTime()) {
      const wallTime = `${this.day()}T${this.time()}`;
      if (
        this.data.action === 'correct-arrival' &&
        movements.arrival &&
        wallTime === this.businessTime.instantToLocalDateTime(movements.arrival.occurredAt)
      ) {
        this.dismiss();
        return;
      }
      const resolution = this.businessTime.resolveLocalDateTime(wallTime);
      if (!resolution.valid) {
        this.error.set('invalid');
        return;
      }
      occurredAt = resolution.instant;
    }

    this.error.set(null);
    this.saving.set(true);
    this.dialogRef.disableClose = true;
    const { action, stayId } = this.data;
    const request =
      action === 'reset-arrival'
        ? this.api.resetActualArrival(stayId, movements.revision)
        : this.api.saveActualMovement(stayId, this.type, movements.revision, occurredAt);
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.saving.set(false);
          this.dialogRef.disableClose = false;
        }),
      )
      .subscribe({
        next: () => {
          this.needsRefresh.set(true);
          this.dialogRef.close();
        },
        error: (error: unknown) => {
          const status = error instanceof HttpErrorResponse ? error.status : 0;
          if (status === 409 || status === 404) {
            this.needsRefresh.set(true);
            const catName = stayBookingConflictCatName(error);
            this.error.set(catName === null ? 'conflict' : { catName });
          } else if (status === 403) {
            this.needsRefresh.set(true);
            this.error.set('forbidden');
          } else {
            this.error.set(status === 400 ? 'rejected' : 'failed');
          }
        },
      });
  }
}
