import { Component, computed, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { catchError, distinctUntilChanged, map, of, startWith, Subject, switchMap } from 'rxjs';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { AgendaMovement, AgendaStay } from '../../models/operations-agenda.model';
import { OperationsAgendaApiService } from '../../services/operations-agenda-api.service';
import { OPERATIONS_TRANSFERS_TRANSLATIONS } from './operations-transfers.translations';

type TransfersState =
  | { kind: 'loading'; date?: string }
  | { kind: 'error'; date?: string }
  | { kind: 'ready'; date: string; transfers: AgendaMovement[] };

@Component({
  selector: 'app-operations-transfers-page',
  imports: [MatButton, MatFormField, MatLabel, MatInput, UiStateComponent],
  templateUrl: './operations-transfers-page.html',
  styleUrl: './operations-transfers-page.scss',
})
export class OperationsTransfersPage {
  private readonly api = inject(OperationsAgendaApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly details = inject(EntityDetailDialogService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);
  private readonly refreshRequests = new Subject<'show-loading' | 'keep-results'>();

  readonly text = this.i18n.text;
  readonly copy = computed(() => OPERATIONS_TRANSFERS_TRANSLATIONS[this.i18n.language()]);
  readonly state = toSignal(
    this.route.queryParamMap.pipe(
      map((params) => params.get('date') || undefined),
      distinctUntilChanged(),
      switchMap((date) =>
        this.refreshRequests.pipe(
          startWith('show-loading'),
          switchMap((refreshMode) => {
            const response = this.api.getAgenda(date).pipe(
              map(
                (agenda): TransfersState => ({
                  kind: 'ready',
                  date: agenda.date,
                  transfers: agenda.movements.filter((movement) => movement.transferRequired),
                }),
              ),
              catchError(() => of({ kind: 'error', date } as const)),
            );
            return refreshMode === 'keep-results'
              ? response
              : response.pipe(startWith({ kind: 'loading', date } as const));
          }),
        ),
      ),
    ),
    { initialValue: { kind: 'loading' } as TransfersState },
  );

  selectDate(input: HTMLInputElement): void {
    if (!input.reportValidity()) return;
    if (input.value) {
      this.navigateToDate(input.value);
    } else {
      this.showToday();
    }
  }

  showToday(): void {
    if (this.route.snapshot.queryParamMap.has('date')) {
      this.navigateToDate();
    } else {
      this.reload();
    }
  }

  reload(): void {
    this.refreshRequests.next('show-loading');
  }

  openOwner(ownerId: string): void {
    this.details
      .open({ entityType: 'owner', entityId: ownerId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshRequests.next('keep-results'));
  }

  catNames(stay: AgendaStay): string {
    return stay.cats.map((cat) => cat.name).join(', ');
  }

  private navigateToDate(date?: string): void {
    void this.router.navigate([], { relativeTo: this.route, queryParams: { date } });
  }
}
