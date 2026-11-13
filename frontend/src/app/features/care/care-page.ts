import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { formatLocalDate } from '../../shared/date/local-date-format';
import { UiStateComponent } from '../../shared/ui-state/ui-state';
import { CareApiService } from './care-api.service';
import { CareCat, CareDay, CareRecordRequest, CareRoutine, CareShift } from './care.models';

@Component({
  selector: 'app-care-page',
  imports: [
    FormsModule,
    MatButton,
    MatCard,
    MatCardContent,
    MatFormField,
    MatInput,
    MatLabel,
    RouterLink,
    UiStateComponent,
  ],
  templateUrl: './care-page.html',
  styleUrl: './care.scss',
})
export class CarePage {
  private readonly api = inject(CareApiService);
  private readonly businessTime = inject(BusinessTimeService);
  private readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthSessionService);
  private readonly refresh = new Subject<void>();

  readonly text = computed(() => CARE_TRANSLATIONS[this.i18n.language()]);
  readonly isAdmin = computed(() => this.auth.hasRole('ADMIN'));
  readonly day = signal<CareDay | null>(null);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly saving = signal(false);
  readonly mutation = signal<'saved' | 'failed' | 'stale' | null>(null);
  readonly shifts: CareShift[] = ['MORNING', 'AFTERNOON', 'EVENING'];

  constructor() {
    const date = this.route.queryParamMap.pipe(
      map((params) => params.get('date')),
      distinctUntilChanged(),
    );
    combineLatest([date, this.refresh.pipe(startWith(undefined))])
      .pipe(
        switchMap(([requestedDate]) => {
          this.loading.set(true);
          this.loadFailed.set(false);
          return this.api.day(requestedDate).pipe(
            catchError(() => {
              this.loadFailed.set(true);
              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe((day) => this.day.set(day));
  }

  selectDate(date: string): void {
    this.mutation.set(null);
    if (this.route.snapshot.queryParamMap.get('date') === (date || null)) {
      this.reload();
      return;
    }
    void this.router.navigate([], { relativeTo: this.route, queryParams: date ? { date } : {} });
  }

  reload(): void {
    this.refresh.next();
  }

  displayDate(date: string): string {
    return formatLocalDate(date, this.i18n.dateLocale());
  }

  displayStayDate(value: string): string {
    return this.businessTime.formatLocalDateTime(value, this.i18n.dateLocale(), 'short');
  }

  routineName(routine: CareRoutine): string {
    return routine.seedKey ? this.text().seeds[routine.seedKey] : routine.name;
  }

  count(cat: CareCat, routine: CareRoutine, shift: CareShift | null = null): number {
    return cat.records.filter(
      (record) =>
        record.routineId === routine.id && record.mode === routine.mode && record.shift === shift,
    ).length;
  }

  mark(cat: CareCat, routine: CareRoutine, shift: CareShift | null = null): void {
    const day = this.day();
    if (
      !day ||
      day.date !== day.businessToday ||
      (routine.mode !== 'EVENT' && this.count(cat, routine, shift))
    )
      return;
    this.register({
      stayId: cat.stayId,
      catId: cat.catId,
      businessDate: day.date,
      routineId: routine.id,
      expectedMode: routine.mode,
      shift,
    });
  }

  saveNote(cat: CareCat, form: NgForm): void {
    const day = this.day();
    const note = String(form.value.note ?? '').trim();
    if (!day || day.date !== day.businessToday || !note || form.invalid) return;
    this.register({ stayId: cat.stayId, catId: cat.catId, businessDate: day.date, note }, form);
  }

  private register(request: CareRecordRequest, form?: NgForm): void {
    if (this.loading() || this.saving()) return;
    this.saving.set(true);
    this.mutation.set(null);
    this.api
      .record(request)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: (record) => {
          form?.resetForm();
          this.day.update((day) => {
            if (!day || day.date !== record.businessDate) return day;
            return {
              ...day,
              cats: day.cats.map((cat) => {
                if (
                  cat.catId !== record.catId ||
                  cat.stayId !== record.stayId ||
                  cat.records.some((entry) => entry.id === record.id)
                )
                  return cat;
                return { ...cat, records: [...cat.records, record] };
              }),
            };
          });
          this.mutation.set('saved');
        },
        error: (error: unknown) => {
          const stale =
            error instanceof HttpErrorResponse && [400, 404, 409].includes(error.status);
          this.mutation.set(stale ? 'stale' : 'failed');
          if (stale) this.reload();
        },
      });
  }
}
