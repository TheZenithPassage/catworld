import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  Subject,
  catchError,
  combineLatest,
  distinctUntilChanged,
  map,
  of,
  startWith,
  switchMap,
} from 'rxjs';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { AgendaStay, OperationsAgenda } from '../../models/operations-agenda.model';
import { OperationsAgendaApiService } from '../../services/operations-agenda-api.service';

type PrintState =
  | { kind: 'loading' | 'invalid-date' | 'error' }
  | { kind: 'ready'; agenda: OperationsAgenda };

@Component({
  selector: 'app-operations-agenda-print-page',
  imports: [MatButton, RouterLink, UiStateComponent],
  templateUrl: './operations-agenda-print-page.html',
  styleUrl: './operations-agenda-print-page.scss',
})
export class OperationsAgendaPrintPage {
  private readonly api = inject(OperationsAgendaApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly i18n = inject(I18nService);
  private readonly document = inject(DOCUMENT);
  private readonly retryRequests = new Subject<void>();
  private readonly dateFormatter = computed(
    () => new Intl.DateTimeFormat(this.i18n.dateLocale(), { dateStyle: 'full', timeZone: 'UTC' }),
  );

  readonly text = this.i18n.text;
  readonly state = toSignal(
    combineLatest([
      this.route.queryParamMap.pipe(
        map((params) => params.get('date')),
        distinctUntilChanged(),
      ),
      this.retryRequests.pipe(startWith(undefined)),
    ]).pipe(
      switchMap(([date]) => {
        if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
          return of({ kind: 'invalid-date' } as const);
        }

        return this.api.getAgenda(date).pipe(
          map((agenda): PrintState => ({ kind: 'ready', agenda })),
          catchError((error: HttpErrorResponse) =>
            of({ kind: error.status === 400 ? 'invalid-date' : 'error' } as const),
          ),
          startWith({ kind: 'loading' } as const),
        );
      }),
    ),
    { initialValue: { kind: 'loading' } as const },
  );

  retry(): void {
    this.retryRequests.next();
  }

  print(): void {
    this.document.defaultView?.print();
  }

  formatDate(date: string): string {
    return this.dateFormatter().format(new Date(`${date}T00:00:00Z`));
  }

  catNames(stay: AgendaStay): string {
    return stay.cats.map((cat) => cat.name).join(', ');
  }
}
