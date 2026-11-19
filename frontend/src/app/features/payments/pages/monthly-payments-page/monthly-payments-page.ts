import { HttpClient } from '@angular/common/http';
import {
  afterRenderEffect,
  Component,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
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
import {
  CatLookupAdapter,
  OwnerLookupAdapter,
} from '../../../../shared/entity-lookup/domain-lookup.adapters';
import { EntityLookupState } from '../../../../shared/entity-lookup/entity-lookup.models';
import { RemoteEntitySelector } from '../../../../shared/entity-lookup/remote-entity-selector';
import { OverviewPage } from '../../../../shared/pagination/overview-page';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { CatLookup } from '../../../cats/models/cat.model';
import { OwnerLookup } from '../../../owners/models/owner.model';

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
  started: boolean;
}

interface MonthlyCollections {
  stays: OverviewPage<OutstandingStay>;
  knownTotal: string;
  pendingPriceCount: number;
}

type PaymentView = 'received' | 'outstanding';
type PaymentScope = 'month' | 'all';

interface PaymentFilters {
  month: string;
  tab: PaymentView;
  page: number;
  scope: PaymentScope;
  ownerId: string | null;
  catId: string | null;
  pricePendingOnly: boolean;
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
    RemoteEntitySelector,
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
  readonly ownerAdapter = inject(OwnerLookupAdapter);
  readonly catAdapter = inject(CatLookupAdapter);
  private readonly ownerSelector = viewChild<RemoteEntitySelector<OwnerLookup>>('ownerSelector');
  private readonly catSelector = viewChild<RemoteEntitySelector<CatLookup>>('catSelector');

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
  readonly scope = computed<PaymentScope>(() =>
    this.params().get('scope') === 'all' ? 'all' : 'month',
  );
  readonly catId = computed(() => this.params().get('catId') || null);
  readonly ownerId = computed(() => (this.catId() ? null : this.params().get('ownerId') || null));
  readonly pricePendingOnly = computed(
    () => this.view() === 'outstanding' && this.params().get('pricePendingOnly') === 'true',
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
    scope: this.scope(),
    ownerId: this.ownerId(),
    catId: this.catId(),
    pricePendingOnly: this.pricePendingOnly(),
    retry: this.retryCount(),
  }));

  readonly state = toSignal(
    toObservable(this.query).pipe(
      switchMap((query) => {
        const { month, tab, page, scope, ownerId, catId, pricePendingOnly, retry } = query;
        const loaded = this.loadedQuery;
        // Replacing the URL after clamping can reuse the response already showing that page.
        if (
          loaded?.month === month &&
          loaded.tab === tab &&
          loaded.page === page &&
          loaded.scope === scope &&
          loaded.ownerId === ownerId &&
          loaded.catId === catId &&
          loaded.pricePendingOnly === pricePendingOnly &&
          loaded.retry === retry
        ) {
          return EMPTY;
        }
        this.loadedQuery = null;
        const params: Record<string, string | number | boolean> =
          scope === 'all' ? { page, scope } : { month, page };
        if (pricePendingOnly) params['pricePendingOnly'] = true;
        if (ownerId) params['ownerId'] = ownerId;
        if (catId) params['catId'] = catId;
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
    afterRenderEffect(() => {
      const owner = this.ownerSelector();
      const cat = this.catSelector();
      const ownerId = this.ownerId();
      const catId = this.catId();
      if (!owner || !cat) return;
      // Restore names from an incoming URL once per identity without refetching on page changes.
      untracked(() => {
        if (!ownerId) owner.reset();
        else if (owner.selectedId() !== ownerId) owner.resolveKnownId(ownerId);
        if (!catId) cat.reset();
        else if (cat.selectedId() !== catId) cat.resolveKnownId(catId);
      });
    });
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
      this.navigateWithFilters({ ...this.query(), month: value, page: 0 });
    }
  }

  selectView(view: PaymentView): void {
    this.navigateWithFilters({
      ...this.query(),
      tab: view,
      page: 0,
      pricePendingOnly: false,
    });
  }

  selectScope(scope: PaymentScope): void {
    this.navigateWithFilters({ ...this.query(), scope, page: 0 });
  }

  selectEntity(key: 'ownerId' | 'catId', state: EntityLookupState<OwnerLookup | CatLookup>): void {
    const { selectedId, rawContentPresent } = state;
    if ((!selectedId && rawContentPresent) || selectedId === this.query()[key]) return;
    this.navigateWithFilters({
      ...this.query(),
      ownerId: key === 'ownerId' ? selectedId : null,
      catId: key === 'catId' ? selectedId : null,
      page: 0,
    });
  }

  clearEntity(): void {
    this.navigateWithFilters({ ...this.query(), ownerId: null, catId: null, page: 0 });
  }

  togglePricePendingOnly(): void {
    this.navigateWithFilters({
      ...this.query(),
      pricePendingOnly: !this.pricePendingOnly(),
      page: 0,
    });
  }

  selectPage(event: PageEvent): void {
    this.navigateWithFilters({ ...this.query(), page: event.pageIndex });
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

  private navigateWithFilters(filters: PaymentFilters): void {
    void this.router.navigateByUrl(this.filtersUrl(filters), { replaceUrl: true });
  }

  private filtersUrl({
    month,
    tab,
    page,
    scope,
    pricePendingOnly,
    ownerId,
    catId,
  }: PaymentFilters) {
    return this.router.createUrlTree([], {
      relativeTo: this.route,
      queryParams: {
        month,
        tab,
        page,
        scope: scope === 'all' ? scope : null,
        pricePendingOnly: pricePendingOnly || null,
        ownerId,
        catId,
      },
    });
  }

  private resolvePage(query: PaymentQuery, page: number): { stayPricingOrigin: string } {
    this.loadedQuery = { ...query, page };
    return { stayPricingOrigin: this.router.serializeUrl(this.filtersUrl(this.loadedQuery)) };
  }
}
