import { HttpClient } from '@angular/common/http';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatButtonToggle, MatButtonToggleGroup } from '@angular/material/button-toggle';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { catchError, EMPTY, map, of, startWith, switchMap } from 'rxjs';

import { API_BASE_URL } from '../../../../core/config/api.config';
import { RuntimeConfigService } from '../../../../core/config/runtime-config.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { formatLocalDate } from '../../../../shared/date/local-date-format';
import { OverviewPage } from '../../../../shared/pagination/overview-page';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';

const MONTH_FORMAT = /^[1-9]\d{3}-(0[1-9]|1[0-2])$/;
// The API uses a signed 32-bit offset and ten records per page.
const MAX_PAGE = Math.floor(2_147_483_647 / 10);

interface Receipt {
  id: string;
  paymentDate: string;
  amount: string;
  stayId: string;
  ownerName: string;
  cats: string[];
  note: string | null;
}

interface MonthlyReceipts {
  payments: OverviewPage<Receipt>;
  totalAmount: string;
}

interface OutstandingStay {
  stayId: string;
  arrival: string;
  ownerName: string;
  cats: string[];
  agreedAmount: string | null;
  paidAmount: string;
  remainingAmount: string | null;
  notes: string | null;
}

interface MonthlyCollections {
  stays: OverviewPage<OutstandingStay>;
  knownTotal: string;
  pendingPriceCount: number;
}

type PaymentView = 'received' | 'outstanding';

interface PaymentFilters {
  month: string;
  tab: PaymentView;
  page: number;
}

type PaymentQuery = PaymentFilters & { retry: number };

type LoadedPayments = {
  status: 'loaded';
  query: PaymentQuery;
  pricingState: { stayPricingOrigin: string };
} & (
  | { view: 'received'; data: MonthlyReceipts }
  | { view: 'outstanding'; data: MonthlyCollections }
);

type LoadState = { status: 'loading' } | LoadedPayments | { status: 'error' };

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
    MatButtonToggle,
    MatButtonToggleGroup,
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
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly params = toSignal(this.route.queryParamMap, { requireSync: true });
  private readonly retryCount = signal(0);
  private loadedQuery: PaymentQuery | null = null;

  readonly text = computed(() => this.i18n.text().monthlyPayments);
  readonly month = computed(() => {
    const value = this.params().get('month');
    return value && MONTH_FORMAT.test(value)
      ? value
      : businessMonth(new Date(), this.config.businessTimeZone());
  });
  readonly view = computed<PaymentView>(() =>
    this.params().get('tab') === 'outstanding' ? 'outstanding' : 'received',
  );
  private readonly page = computed(() => {
    const value = this.params().get('page');
    if (!value || !/^\d+$/.test(value)) return 0;
    const page = Number(value);
    return page <= MAX_PAGE ? page : 0;
  });
  private readonly query = computed<PaymentQuery>(() => ({
    month: this.month(),
    tab: this.view(),
    page: this.page(),
    retry: this.retryCount(),
  }));

  readonly state = toSignal(
    toObservable(this.query).pipe(
      switchMap((query) => {
        const { month, tab, page, retry } = query;
        const loaded = this.loadedQuery;
        // Replacing the URL after clamping can reuse the response already showing that page.
        if (
          loaded?.month === month &&
          loaded.tab === tab &&
          loaded.page === page &&
          loaded.retry === retry
        ) {
          return EMPTY;
        }
        this.loadedQuery = null;
        const params = { month, page };
        const request =
          tab === 'received'
            ? this.http.get<MonthlyReceipts>(`${API_BASE_URL}/payments/received`, { params }).pipe(
                map(
                  (data): LoadedPayments => ({
                    status: 'loaded',
                    view: 'received',
                    data,
                    query,
                    pricingState: this.resolvePage(query, data.payments.page),
                  }),
                ),
              )
            : this.http
                .get<MonthlyCollections>(`${API_BASE_URL}/payments/outstanding`, { params })
                .pipe(
                  map(
                    (data): LoadedPayments => ({
                      status: 'loaded',
                      view: 'outstanding',
                      data,
                      query,
                      pricingState: this.resolvePage(query, data.stays.page),
                    }),
                  ),
                );
        return request.pipe(
          startWith({ status: 'loading' } as const),
          catchError(() => of({ status: 'error' } as const)),
        );
      }),
    ),
    { initialValue: { status: 'loading' } as LoadState },
  );

  constructor() {
    effect(() => {
      const result = this.state();
      if (
        this.router.currentNavigation() ||
        result.status !== 'loaded' ||
        result.query !== this.query()
      ) {
        return;
      }
      const { stayPricingOrigin } = result.pricingState;
      if (this.router.url !== stayPricingOrigin) {
        void this.router.navigateByUrl(stayPricingOrigin, { replaceUrl: true });
      }
    });
  }

  selectMonth(value: string, field: HTMLInputElement): void {
    if (!MONTH_FORMAT.test(value)) {
      field.value = this.month();
      return;
    }
    if (value !== this.month()) {
      void this.router.navigateByUrl(this.filtersUrl({ month: value, tab: this.view(), page: 0 }), {
        replaceUrl: true,
      });
    }
  }

  selectView(view: PaymentView): void {
    void this.router.navigateByUrl(this.filtersUrl({ month: this.month(), tab: view, page: 0 }), {
      replaceUrl: true,
    });
  }

  selectPage(event: PageEvent): void {
    const url = this.filtersUrl({ month: this.month(), tab: this.view(), page: event.pageIndex });
    void this.router.navigateByUrl(url, { replaceUrl: true });
  }

  retry(): void {
    this.retryCount.update((value) => value + 1);
  }

  date(value: string): string {
    return formatLocalDate(value, this.i18n.dateLocale());
  }

  arrival(value: string): string {
    return this.date(value.slice(0, 10)) + ' ' + value.slice(11, 16);
  }

  amount(value: string): string {
    return new Intl.NumberFormat(this.i18n.dateLocale()).format(BigInt(value));
  }

  private filtersUrl({ month, tab, page }: PaymentFilters) {
    return this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams: { month, tab, page },
    });
  }

  private resolvePage(query: PaymentQuery, page: number): { stayPricingOrigin: string } {
    this.loadedQuery = { ...query, page };
    return { stayPricingOrigin: this.router.serializeUrl(this.filtersUrl(this.loadedQuery)) };
  }
}
