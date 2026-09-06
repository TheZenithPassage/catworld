import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, Subscription } from 'rxjs';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import { StayDetailResponse } from '../../../../shared/entity-detail/relationship.models';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { StaySearchFiltersComponent } from '../../components/stay-search-filters/stay-search-filters';
import {
  PaymentCondition,
  Stay,
  StayOverviewItem,
  StayOverviewStatus,
} from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { StayStatusVisibilityPreferencesService } from '../../services/stay-status-visibility-preferences.service';
import {
  getDefaultStayPaymentFilters,
  getDefaultStaySearchFilters,
  PAYMENT_CONDITION_FILTER_OPTIONS,
  DATE_MATCH_MODES,
  isStayDateRangeValid,
  isStayVisibleByDateFilters,
  StayDateMatchMode,
  PaymentConditionVisibility,
  StaySearchFilters,
} from '../../utils/stay-search-filter.util';
import {
  STAY_STATUS_FILTER_OPTIONS,
  StayStatus,
  StayStatusVisibility,
} from '../../utils/stay-status.util';
@Component({
  selector: 'app-stays-overview-page',
  imports: [
    MatButton,
    MatCheckbox,
    MatPaginator,
    RouterLink,
    StaySearchFiltersComponent,
    UiStateComponent,
  ],
  templateUrl: './stays-overview-page.html',
  styleUrl: './stays-overview-page.scss',
})
export class StaysOverviewPage {
  private readonly api = inject(StayApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);
  private readonly details = inject(EntityDetailDialogService);
  private readonly preferences = inject(StayStatusVisibilityPreferencesService);
  private request?: Subscription;
  private emptyStateRequest?: Subscription;
  private selectedRequest?: Subscription;
  private scrollTimer?: ReturnType<typeof setTimeout>;
  private requestId = 0;
  private destroyed = false;
  readonly text = this.i18n.text;
  readonly dateLocale = this.i18n.dateLocale;
  readonly selectedStayId = signal<string | null>(null);
  readonly selectedStay = signal<StayOverviewItem | null>(null);
  readonly statusFilterOptions = STAY_STATUS_FILTER_OPTIONS;
  readonly paymentConditionFilterOptions = PAYMENT_CONDITION_FILTER_OPTIONS;
  readonly statusVisibility = signal<StayStatusVisibility>(this.preferences.read());
  readonly searchFilters = signal<StaySearchFilters>(getDefaultStaySearchFilters());
  readonly paymentFilters = signal(getDefaultStayPaymentFilters());
  readonly draftStatusVisibility = signal(this.statusVisibility());
  readonly draftSearchFilters = signal(this.searchFilters());
  readonly draftPaymentFilters = signal(this.paymentFilters());
  readonly validDates = isStayDateRangeValid;
  private syncingQuery = false;
  readonly stays = signal<StayOverviewItem[]>([]);
  readonly loading = signal(false);
  readonly error = createLanguageResetError(this.i18n.language);
  readonly globallyEmpty = signal(false);
  readonly page = signal(0);
  readonly totalElements = signal(0);
  readonly pageSize = 10;
  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      this.requestId++;
      this.request?.unsubscribe();
      this.emptyStateRequest?.unsubscribe();
      this.selectedRequest?.unsubscribe();
      clearTimeout(this.scrollTimer);
    });
    effect(() => this.preferences.store(this.statusVisibility()));
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((p) => {
      if (this.syncingQuery) return;
      this.selectedStayId.set(p.get('selectedStayId'));
      const page = Number(p.get('page'));
      if (Number.isInteger(page) && page >= 0) this.page.set(page);
      const statusState = p.get('statusFilter');
      const statuses = statusState === 'none' ? [] : (statusState?.split(',') ?? []);
      if (statusState) {
        this.statusVisibility.set({
          reserved: statuses.includes('RESERVED'),
          'checked-in': statuses.includes('CHECKED_IN'),
          'checked-out': statuses.includes('CHECKED_OUT'),
          cancelled: statuses.includes('CANCELLED'),
        });
      }
      this.searchFilters.set({
        ownerId: p.get('catId') ? null : p.get('ownerId'),
        catId: p.get('catId'),
        dateFrom: p.get('dateFrom'),
        dateTo: p.get('dateTo'),
        dateMatchMode: DATE_MATCH_MODES.includes(p.get('dateMatchMode') as StayDateMatchMode)
          ? (p.get('dateMatchMode') as StayDateMatchMode)
          : 'OVERLAPS',
      });
      const paymentState = p.get('paymentFilter');
      const conditions = paymentState === 'none' ? [] : (paymentState?.split(',') ?? []);
      if (paymentState) {
        this.paymentFilters.set({
          conditionVisibility: {
            NO_PAYMENT: conditions.includes('NO_PAYMENT'),
            PARTIAL_PAYMENT: conditions.includes('PARTIAL_PAYMENT'),
            FULL_PAYMENT: conditions.includes('FULL_PAYMENT'),
          },
          outstandingOnly: p.get('outstandingOnly') === 'true',
        });
      }
      this.draftStatusVisibility.set(this.statusVisibility());
      this.draftSearchFilters.set(this.searchFilters());
      this.draftPaymentFilters.set(this.paymentFilters());
      this.loadStays();
    });
  }
  loadStays(page = this.page()): void {
    if (this.destroyed) return;
    this.selectedStay.set(null);
    this.selectedRequest?.unsubscribe();
    const id = ++this.requestId;
    this.request?.unsubscribe();
    this.emptyStateRequest?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);
    const statuses = Object.entries(this.statusVisibility())
      .filter(([, v]) => v)
      .map(([s]) => this.toBackendStatus(s as StayStatus));
    const paymentConditions = Object.entries(this.paymentFilters().conditionVisibility)
      .filter(([, v]) => v)
      .map(([c]) => c);
    const search = this.searchFilters();
    if (statuses.length === 0 || paymentConditions.length === 0) {
      this.stays.set([]);
      this.page.set(0);
      this.totalElements.set(0);
      this.resolveGlobalEmptyState(id);
      return;
    }
    this.request = this.api
      .getStayOverview(page, {
        statuses,
        ...search,
        ownerId: search.ownerId,
        catId: search.catId,
        paymentConditions,
        outstandingOnly: this.paymentFilters().outstandingOnly,
      })
      .subscribe({
        next: (r) => {
          if (this.destroyed || id !== this.requestId) return;
          const lastValidPage = Math.max(0, Math.ceil(r.totalElements / this.pageSize) - 1);
          if (page > lastValidPage) {
            this.loadStays(lastValidPage);
            return;
          }
          this.stays.set(r.items);
          this.page.set(r.page);
          this.totalElements.set(r.totalElements);
          if (r.totalElements === 0) {
            this.resolveGlobalEmptyState(id);
            return;
          }
          this.globallyEmpty.set(false);
          this.loading.set(false);
          this.syncPage();
          this.resolveSelectedStay(r.items);
        },
        error: () => {
          if (!this.destroyed && id === this.requestId) {
            this.error.set(this.text().stays.overview.errorLoading);
            this.loading.set(false);
          }
        },
      });
  }
  private resolveGlobalEmptyState(id: number): void {
    if (this.destroyed || id !== this.requestId) return;
    this.emptyStateRequest = this.api
      .getStayOverview(0, {
        statuses: this.statusFilterOptions.map(({ status }) => this.toBackendStatus(status)),
        ownerId: null,
        catId: null,
        paymentConditions: [...this.paymentConditionFilterOptions],
        outstandingOnly: false,
      })
      .subscribe({
        next: (r) => {
          if (this.destroyed || id !== this.requestId) return;
          this.globallyEmpty.set(r.totalElements === 0);
          this.loading.set(false);
          this.syncPage();
          this.resolveSelectedStay([]);
        },
        error: () => {
          if (!this.destroyed && id === this.requestId) {
            this.error.set(this.text().stays.overview.errorLoading);
            this.loading.set(false);
          }
        },
      });
  }
  changePage(e: PageEvent): void {
    this.loadStays(e.pageIndex);
  }
  getStayStatus(s: StayOverviewItem): string {
    return this.text().stays.status[this.fromBackendStatus(s.status)];
  }
  formatDate(v: string): string {
    return new Intl.DateTimeFormat(this.dateLocale(), {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(v));
  }
  getCatNames(s: StayOverviewItem): string {
    return s.cats.map((c) => c.name).join(', ');
  }
  getOpenDetailAriaLabel(s: StayOverviewItem): string {
    return this.text().stays.overview.openDetailAriaLabel(
      s.cats.map((cat) => cat.name).join(', '),
      s.ownerName,
      this.formatDate(s.startAt),
      this.formatDate(s.endAt),
    );
  }
  openDetail(s: StayOverviewItem): void {
    this.details
      .open({ entityType: 'stay', entityId: s.id })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadStays());
  }
  activateRow(e: KeyboardEvent, s: StayOverviewItem): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.openDetail(s);
    }
  }
  isSelectedStay(s: StayOverviewItem): boolean {
    return this.selectedStayId() === s.id;
  }
  isStatusVisible(s: StayStatus): boolean {
    return this.draftStatusVisibility()[s];
  }
  setStatusVisibility(s: StayStatus, v: boolean): void {
    this.draftStatusVisibility.update((x) => ({ ...x, [s]: v }));
  }
  toggleStatusFromPill(e: MouseEvent, s: StayStatus): void {
    if (e.target === e.currentTarget) this.setStatusVisibility(s, !this.isStatusVisible(s));
  }
  setSearchFilters(f: StaySearchFilters): void {
    this.draftSearchFilters.set(f);
  }
  isPaymentConditionVisible(c: PaymentCondition): boolean {
    return this.draftPaymentFilters().conditionVisibility[c];
  }
  setPaymentConditionVisibility(c: PaymentCondition, v: boolean): void {
    this.draftPaymentFilters.update((f) => ({
      ...f,
      conditionVisibility: {
        ...f.conditionVisibility,
        [c]: v,
      } satisfies PaymentConditionVisibility,
    }));
  }
  setOutstandingOnly(v: boolean): void {
    this.draftPaymentFilters.update((f) => ({ ...f, outstandingOnly: v }));
  }
  applyFilters(): void {
    if (!isStayDateRangeValid(this.draftSearchFilters())) return;
    this.statusVisibility.set(this.draftStatusVisibility());
    this.searchFilters.set(this.draftSearchFilters());
    this.paymentFilters.set(this.draftPaymentFilters());
    this.page.set(0);
    this.loadStays(0);
  }
  private syncPage(): void {
    if (this.destroyed) return;
    const statuses = Object.entries(this.statusVisibility())
      .filter(([, visible]) => visible)
      .map(([status]) => this.toBackendStatus(status as StayStatus));
    const conditions = Object.entries(this.paymentFilters().conditionVisibility)
      .filter(([, visible]) => visible)
      .map(([condition]) => condition);
    this.syncingQuery = true;
    void this.router
      .navigate([], {
        relativeTo: this.route,
        queryParams: {
          page: this.page() || null,
          statusFilter: statuses.join(',') || 'none',
          dateFrom: this.searchFilters().dateFrom || null,
          dateTo: this.searchFilters().dateTo || null,
          dateMatchMode: this.searchFilters().dateMatchMode ?? 'OVERLAPS',
          ownerId: this.searchFilters().ownerId,
          catId: this.searchFilters().catId,
          paymentFilter: conditions.join(',') || 'none',
          outstandingOnly: this.paymentFilters().outstandingOnly || null,
        },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      })
      .finally(() => {
        this.syncingQuery = false;
      });
  }
  private scrollSelected(): void {
    clearTimeout(this.scrollTimer);
    const id = this.selectedStayId();
    if (id) {
      this.scrollTimer = setTimeout(() => {
        this.scrollTimer = undefined;
        if (!this.destroyed)
          document.getElementById(`stay-${id}`)?.scrollIntoView({ block: 'center' });
      });
    }
  }
  private resolveSelectedStay(items: StayOverviewItem[]): void {
    if (this.destroyed) return;
    const selectedId = this.selectedStayId();
    this.selectedRequest?.unsubscribe();
    if (!selectedId || items.some((stay) => stay.id === selectedId)) {
      this.selectedStay.set(null);
      this.scrollSelected();
      return;
    }
    this.selectedStay.set(null);
    this.selectedRequest = forkJoin({
      detail: this.api.getStayDetail(selectedId),
      stay: this.api.getStayById(selectedId),
    }).subscribe({
      next: ({ detail, stay }) => {
        if (this.destroyed || this.selectedStayId() !== selectedId) return;
        if (!this.matchesActiveFilters(detail, stay)) {
          this.selectedStay.set(null);
          return;
        }
        this.selectedStay.set(this.selectedOverview(detail, stay));
        this.scrollSelected();
      },
      error: () => {
        if (!this.destroyed) this.selectedStay.set(null);
      },
    });
  }
  private matchesActiveFilters(detail: StayDetailResponse, stay: Stay): boolean {
    const search = this.searchFilters();
    const payment = this.paymentFilters();
    return (
      this.statusVisibility()[this.fromBackendStatus(detail.status)] &&
      (!search.ownerId || stay.ownerId === search.ownerId) &&
      (!search.catId || stay.cats.some((cat) => cat.catId === search.catId)) &&
      isStayVisibleByDateFilters(stay, search) &&
      payment.conditionVisibility[stay.paymentCondition] &&
      (!payment.outstandingOnly || stay.outstandingCollectionEligible)
    );
  }
  private selectedOverview(detail: StayDetailResponse, stay: Stay): StayOverviewItem {
    return {
      id: detail.stayId,
      startAt: detail.startAt,
      endAt: detail.endAt,
      status: detail.status,
      ownerId: detail.owner.id,
      ownerName: detail.owner.fullName,
      cats: stay.cats.map((cat) => ({ id: cat.catId, name: cat.name })),
    };
  }
  private toBackendStatus(s: StayStatus): StayOverviewStatus {
    return (
      {
        reserved: 'RESERVED',
        'checked-in': 'CHECKED_IN',
        'checked-out': 'CHECKED_OUT',
        cancelled: 'CANCELLED',
      } as const
    )[s];
  }
  private fromBackendStatus(s: StayOverviewStatus): StayStatus {
    return (
      {
        RESERVED: 'reserved',
        CHECKED_IN: 'checked-in',
        CHECKED_OUT: 'checked-out',
        CANCELLED: 'cancelled',
      } as const
    )[s];
  }
}
