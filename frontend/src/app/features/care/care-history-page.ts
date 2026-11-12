import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { ActivatedRoute, RouterLink } from '@angular/router';
import {
  EMPTY,
  Subject,
  catchError,
  combineLatest,
  distinctUntilChanged,
  finalize,
  map,
  startWith,
  switchMap,
} from 'rxjs';

import { AuthSessionService } from '../../core/auth/auth-session.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { CARE_TRANSLATIONS } from '../../core/i18n/translations/care.translations';
import { BusinessTimeService } from '../../core/time/business-time.service';
import { UiStateComponent } from '../../shared/ui-state/ui-state';
import { CareApiService } from './care-api.service';
import { CareHistory, CareRecord } from './care.models';

@Component({
  selector: 'app-care-history-page',
  imports: [MatButton, RouterLink, UiStateComponent],
  templateUrl: './care-history-page.html',
  styleUrl: './care.scss',
})
export class CareHistoryPage {
  private readonly api = inject(CareApiService);
  private readonly auth = inject(AuthSessionService);
  private readonly businessTime = inject(BusinessTimeService);
  private readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly refresh = new Subject<void>();

  readonly text = computed(() => CARE_TRANSLATIONS[this.i18n.language()]);
  readonly cat = toSignal(this.route.queryParamMap.pipe(map((params) => params.get('cat'))));
  readonly date = toSignal(this.route.queryParamMap.pipe(map((params) => params.get('date'))));
  readonly history = signal<CareHistory | null>(null);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly annulFailed = signal(false);
  readonly confirmedRecord = signal<string | null>(null);
  readonly saving = signal(false);
  readonly records = computed(() => {
    const records = this.history()?.records ?? [];
    const cat = this.cat();
    return (cat ? records.filter((record) => record.catId === cat) : records.slice()).reverse();
  });

  constructor() {
    const stay = this.route.paramMap.pipe(
      map((params) => params.get('stayId')),
      distinctUntilChanged(),
    );
    combineLatest([stay, this.refresh.pipe(startWith(undefined))])
      .pipe(
        switchMap(([stayId]) => {
          if (!stayId) return EMPTY;
          this.loading.set(true);
          this.loadFailed.set(false);
          this.confirmedRecord.set(null);
          return this.api.history(stayId).pipe(
            catchError(() => {
              this.loadFailed.set(true);
              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((history) => this.history.set(history));
  }

  reload(): void {
    this.refresh.next();
  }

  canAnnul(record: CareRecord): boolean {
    return (
      !record.annulledAt &&
      (record.authorId === this.history()?.actorId || this.auth.hasRole('ADMIN'))
    );
  }

  recordName(record: CareRecord): string {
    if (record.routineSeedKey) return this.text().seeds[record.routineSeedKey];
    return record.routineName ?? this.text().note;
  }

  displayInstant(instant: string): string {
    return this.businessTime.formatInstant(instant, this.i18n.dateLocale());
  }

  displayStayDate(value: string): string {
    return this.businessTime.formatLocalDateTime(value, this.i18n.dateLocale(), 'short');
  }

  annul(record: CareRecord): void {
    if (!this.canAnnul(record) || this.saving() || this.confirmedRecord() !== record.id) return;
    this.annulFailed.set(false);
    this.saving.set(true);
    this.api
      .annul(record.id)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (updated) => {
          this.history.update(
            (history) =>
              history && {
                ...history,
                records: history.records.map((item) => (item.id === updated.id ? updated : item)),
              },
          );
          this.confirmedRecord.set(null);
        },
        error: () => this.annulFailed.set(true),
      });
  }
}
