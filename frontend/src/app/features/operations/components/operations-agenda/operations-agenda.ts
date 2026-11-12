import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { BehaviorSubject, catchError, map, of, startWith, switchMap } from 'rxjs';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { BusinessTimeService } from '../../../../core/time/business-time.service';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import {
  AgendaMovement,
  AgendaMovementType,
  AgendaStay,
  OperationsAgenda as Agenda,
} from '../../models/operations-agenda.model';
import { OperationsAgendaApiService } from '../../services/operations-agenda-api.service';

type AgendaState =
  | { kind: 'loading' | 'error'; date?: string }
  | { kind: 'ready'; date: string; agenda: Agenda };

@Component({
  selector: 'app-operations-agenda',
  imports: [
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    NgTemplateOutlet,
    RouterLink,
    UiStateComponent,
  ],
  templateUrl: './operations-agenda.html',
  styleUrl: './operations-agenda.scss',
})
export class OperationsAgenda {
  private readonly api = inject(OperationsAgendaApiService);
  private readonly businessTime = inject(BusinessTimeService);
  private readonly details = inject(EntityDetailDialogService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);
  private readonly dateRequests = new BehaviorSubject<{ date?: string; keepResults?: boolean }>({});
  private readonly dayFormatter = computed(
    () =>
      new Intl.DateTimeFormat(this.i18n.dateLocale(), {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        timeZone: 'UTC',
      }),
  );

  readonly text = this.i18n.text;
  readonly state = toSignal(
    this.dateRequests.pipe(
      switchMap(({ date, keepResults }) => {
        const response = this.api.getAgenda(date).pipe(
          map((agenda): AgendaState => ({ kind: 'ready', date: agenda.date, agenda })),
          catchError(() => of({ kind: 'error', date } as const)),
        );
        return keepResults
          ? response
          : response.pipe(startWith({ kind: 'loading', date } as const));
      }),
    ),
    { requireSync: true },
  );
  readonly agenda = computed(() => {
    const state = this.state();
    return state.kind === 'ready' ? state.agenda : null;
  });

  selectDate(input: HTMLInputElement): void {
    if (!input.reportValidity()) return;
    const date = input.value || undefined;
    if (date !== this.state().date) this.dateRequests.next({ date });
  }

  showToday(): void {
    this.dateRequests.next({});
  }

  reload(): void {
    this.dateRequests.next({
      date: this.dateRequests.value.date,
      keepResults: this.agenda() !== null,
    });
  }

  openMovement(movement: AgendaMovement): void {
    this.openStay(movement.stay.stayId);
  }

  openStay(stayId: string): void {
    this.details
      .open({ entityType: 'stay', entityId: stayId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.reload());
  }

  catNames(stay: AgendaStay): string {
    return stay.cats.map((cat) => cat.name).join(', ');
  }

  movementLabel(type: AgendaMovementType): string {
    return this.text().operationsAgenda.movement[type];
  }

  formatDay(date: string): string {
    return this.dayFormatter().format(new Date(`${date}T00:00:00Z`));
  }

  formatTime(localDateTime: string): string {
    return localDateTime.slice(11, 16);
  }

  formatDateTime(localDateTime: string): string {
    return this.businessTime.formatLocalDateTime(localDateTime, this.i18n.dateLocale());
  }
}
