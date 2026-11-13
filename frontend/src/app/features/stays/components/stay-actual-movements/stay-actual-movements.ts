import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
import { finalize } from 'rxjs';

import { API_BASE_URL } from '../../../../core/config/api.config';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { BusinessTimeService } from '../../../../core/time/business-time.service';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import type {
  StayActualMovementsDialogData,
  StayMovementType,
} from '../../services/stay-actual-movements-dialog.service';
import { ACTUAL_MOVEMENT_TRANSLATIONS } from './stay-actual-movements.translations';

interface ActualMovement {
  occurredAt: string;
  revision: number;
  recordedBy: string;
  correctedBy: string | null;
  canEdit: boolean;
}

interface ActualMovements {
  startAt: string;
  endAt: string;
  cancelled: boolean;
  arrival: ActualMovement | null;
  departure: ActualMovement | null;
}

type SaveError = 'invalid' | 'rejected' | 'conflict' | 'forbidden' | 'failed';

@Component({
  selector: 'app-stay-actual-movements',
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
  templateUrl: './stay-actual-movements.html',
  styleUrl: './stay-actual-movements.scss',
})
export class StayActualMovements {
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(I18nService);
  private readonly businessTime = inject(BusinessTimeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialogRef = inject(MatDialogRef<StayActualMovements, boolean>);
  private readonly data = inject<StayActualMovementsDialogData>(MAT_DIALOG_DATA);
  private readonly url = `${API_BASE_URL}/stays/${this.data.stayId}/actual-movements`;
  private changed = false;

  readonly copy = computed(() => ACTUAL_MOVEMENT_TRANSLATIONS[this.i18n.language()]);
  readonly movements = signal<ActualMovements | null>(null);
  readonly loading = signal(false);
  readonly saving = signal(false);
  readonly error = signal<SaveError | null>(null);
  readonly reloadRequired = computed(
    () => this.error() === 'conflict' || this.error() === 'forbidden',
  );
  readonly editing = signal<StayMovementType | null>(null);
  readonly localTime = signal('');
  readonly rows = computed(() => {
    const movements = this.movements();
    if (!movements) return [];
    return [
      { type: 'ARRIVAL' as const, scheduledAt: movements.startAt, actual: movements.arrival },
      { type: 'DEPARTURE' as const, scheduledAt: movements.endAt, actual: movements.departure },
    ];
  });
  readonly focusType = this.data.focusType;

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.movements.set(null);
    this.cancelEdit();
    this.http
      .get<ActualMovements>(this.url)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (movements) => this.movements.set(movements),
        error: () => this.movements.set(null),
      });
  }

  canEdit(actual: ActualMovement | null): boolean {
    return this.movements()?.cancelled === false && (actual?.canEdit ?? true);
  }

  startEdit(type: StayMovementType, actual: ActualMovement | null): void {
    if (!this.canEdit(actual) || this.saving() || this.reloadRequired()) return;
    this.localTime.set(actual ? this.businessTime.instantToLocalDateTime(actual.occurredAt) : '');
    this.error.set(null);
    this.editing.set(type);
  }

  cancelEdit(): void {
    this.editing.set(null);
    this.error.set(null);
  }

  recordNow(type: StayMovementType): void {
    this.save(type, null);
  }

  saveLocalTime(type: StayMovementType, actual: ActualMovement | null): void {
    if (
      actual &&
      this.localTime() === this.businessTime.instantToLocalDateTime(actual.occurredAt)
    ) {
      this.cancelEdit();
      return;
    }
    const time = this.businessTime.resolveLocalDateTime(this.localTime());
    if (!time.valid) {
      this.error.set('invalid');
      return;
    }
    this.save(type, time.instant);
  }

  close(): void {
    if (!this.saving()) this.dialogRef.close(this.changed);
  }

  formatScheduled(value: string): string {
    return this.businessTime.formatLocalDateTime(value, this.i18n.dateLocale());
  }

  formatActual(value: string): string {
    return this.businessTime.formatInstant(value, this.i18n.dateLocale());
  }

  hasChanges(): boolean {
    return this.changed;
  }

  private save(type: StayMovementType, occurredAt: string | null): void {
    const actual = this.rows().find((row) => row.type === type)?.actual ?? null;
    if (!this.canEdit(actual) || this.saving() || this.reloadRequired()) return;
    this.saving.set(true);
    this.error.set(null);
    this.dialogRef.disableClose = true;
    this.http
      .put<ActualMovements>(`${this.url}/${type}`, {
        expectedRevision: actual?.revision ?? 0,
        occurredAt,
      })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => {
          this.saving.set(false);
          this.dialogRef.disableClose = false;
        }),
      )
      .subscribe({
        next: (movements) => {
          this.movements.set(movements);
          this.changed = true;
          this.editing.set(null);
        },
        error: (error: unknown) => {
          const status = error instanceof HttpErrorResponse ? error.status : 0;
          if (status === 409) this.error.set('conflict');
          else if (status === 403) this.error.set('forbidden');
          else if (status === 400) this.error.set('rejected');
          else this.error.set('failed');
        },
      });
  }
}
