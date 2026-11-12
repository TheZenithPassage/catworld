import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { RouterLink } from '@angular/router';
import { catchError, map, of, startWith, switchMap } from 'rxjs';

import { API_BASE_URL } from '../../../../core/config/api.config';
import { RuntimeConfigService } from '../../../../core/config/runtime-config.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { formatLocalDate } from '../../../../shared/date/local-date-format';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';

interface Receipt {
  id: string;
  paymentDate: string;
  amount: string;
  stayId: string;
  ownerName: string;
  cats: string[];
  note: string | null;
}

interface OverviewPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalElements: number;
}

interface MonthlyReceipts {
  payments: OverviewPage<Receipt>;
  totalAmount: string;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'loaded'; data: MonthlyReceipts }
  | { status: 'error' };

export function businessMonth(now: Date, timeZone: string): string {
  const fields = new Intl.DateTimeFormat('en-GB', {
    year: 'numeric',
    month: '2-digit',
    timeZone,
  }).formatToParts(now);
  return (
    fields.find(({ type }) => type === 'year')!.value +
    '-' +
    fields.find(({ type }) => type === 'month')!.value
  );
}

@Component({
  selector: 'app-monthly-payments-page',
  imports: [
    MatButton,
    MatFormField,
    MatLabel,
    MatInput,
    MatPaginator,
    RouterLink,
    UiStateComponent,
  ],
  templateUrl: './monthly-payments-page.html',
  styleUrl: './monthly-payments-page.scss',
})
export class MonthlyPaymentsPage {
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(I18nService);
  private readonly config = inject(RuntimeConfigService);
  private readonly monthOverride = signal<string | null>(null);
  private readonly page = signal(0);
  private readonly retryCount = signal(0);

  readonly text = computed(() => this.i18n.text().monthlyPayments);
  readonly month = computed(
    () => this.monthOverride() ?? businessMonth(new Date(), this.config.businessTimeZone()),
  );
  private readonly query = computed(() => ({
    month: this.month(),
    page: this.page(),
    retry: this.retryCount(),
  }));

  readonly state = toSignal(
    toObservable(this.query).pipe(
      switchMap(({ month, page }) =>
        this.http
          .get<MonthlyReceipts>(`${API_BASE_URL}/payments/received`, { params: { month, page } })
          .pipe(
            map((data): LoadState => ({ status: 'loaded', data })),
            startWith({ status: 'loading' } as const),
            catchError(() => of({ status: 'error' } as const)),
          ),
      ),
    ),
    { initialValue: { status: 'loading' } as LoadState },
  );

  selectMonth(value: string, field: HTMLInputElement): void {
    if (!/^[1-9]\d{3}-(0[1-9]|1[0-2])$/.test(value)) {
      field.value = this.month();
      return;
    }
    this.page.set(0);
    this.monthOverride.set(value);
  }

  selectPage(event: PageEvent): void {
    this.page.set(event.pageIndex);
  }

  retry(): void {
    this.retryCount.update((value) => value + 1);
  }

  date(value: string): string {
    return formatLocalDate(value, this.i18n.dateLocale());
  }

  amount(value: string): string {
    return new Intl.NumberFormat(this.i18n.dateLocale()).format(BigInt(value));
  }
}
