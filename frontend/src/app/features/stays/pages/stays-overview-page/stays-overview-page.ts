import { Component, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import { StayDetailResponse } from '../../../../shared/entity-detail/relationship.models';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { StaySearchFiltersComponent } from '../../components/stay-search-filters/stay-search-filters';
import { PaymentCondition, StayOverviewItem, StayOverviewStatus } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { StayStatusVisibilityPreferencesService } from '../../services/stay-status-visibility-preferences.service';
import {
  getDefaultStayPaymentFilters,
  getDefaultStaySearchFilters,
  PAYMENT_CONDITION_FILTER_OPTIONS,
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
  private selectedRequest?: Subscription;
  private requestId = 0;
  readonly text = this.i18n.text;
  readonly dateLocale = this.i18n.dateLocale;
  readonly selectedStayId = signal<string | null>(null);
  readonly selectedStay = signal<StayOverviewItem | null>(null);
  readonly statusFilterOptions = STAY_STATUS_FILTER_OPTIONS;
  readonly paymentConditionFilterOptions = PAYMENT_CONDITION_FILTER_OPTIONS;
  readonly statusVisibility = signal<StayStatusVisibility>(this.preferences.read());
  readonly searchFilters = signal<StaySearchFilters>(getDefaultStaySearchFilters());
  readonly paymentFilters = signal(getDefaultStayPaymentFilters());
  readonly stays = signal<StayOverviewItem[]>([]);
  readonly loading = signal(false);
  readonly error = createLanguageResetError(this.i18n.language);
  readonly page = signal(0);
  readonly totalElements = signal(0);
  readonly pageSize = 10;
  constructor() {
    effect(() => this.preferences.store(this.statusVisibility()));
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((p) => {
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
      this.searchFilters.set({ ownerId: p.get('ownerId'), catId: p.get('catId') });
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
    });
    this.loadStays();
  }
  loadStays(page = this.page()): void {
    const id = ++this.requestId;
    this.request?.unsubscribe();
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
      this.loading.set(false);
      this.syncPage();
      this.resolveSelectedStay([]);
      return;
    }
    this.request = this.api
      .getStayOverview(page, {
        statuses,
        ownerId: search.ownerId,
        catId: search.catId,
        paymentConditions,
        outstandingOnly: this.paymentFilters().outstandingOnly,
      })
      .subscribe({
        next: (r) => {
          if (id !== this.requestId) return;
          if (!r.items.length && r.totalElements > 0 && page > 0) {
            this.loadStays(Math.max(0, Math.ceil(r.totalElements / 10) - 1));
            return;
          }
          this.stays.set(r.items);
          this.page.set(r.page);
          this.totalElements.set(r.totalElements);
          this.loading.set(false);
          this.syncPage();
          this.resolveSelectedStay(r.items);
        },
        error: () => {
          if (id === this.requestId) {
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
    this.details.open({ entityType: 'stay', entityId: s.id }).subscribe(() => this.loadStays());
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
    return this.statusVisibility()[s];
  }
  setStatusVisibility(s: StayStatus, v: boolean): void {
    this.statusVisibility.update((x) => ({ ...x, [s]: v }));
    this.resetAndLoad();
  }
  toggleStatusFromPill(e: MouseEvent, s: StayStatus): void {
    if (e.target === e.currentTarget) this.setStatusVisibility(s, !this.isStatusVisible(s));
  }
  setSearchFilters(f: StaySearchFilters): void {
    if (f.catId === this.searchFilters().catId && f.ownerId === this.searchFilters().ownerId)
      return;
    this.searchFilters.set(f);
    this.resetAndLoad();
  }
  isPaymentConditionVisible(c: PaymentCondition): boolean {
    return this.paymentFilters().conditionVisibility[c];
  }
  setPaymentConditionVisibility(c: PaymentCondition, v: boolean): void {
    this.paymentFilters.update((f) => ({
      ...f,
      conditionVisibility: {
        ...f.conditionVisibility,
        [c]: v,
      } satisfies PaymentConditionVisibility,
    }));
    this.resetAndLoad();
  }
  setOutstandingOnly(v: boolean): void {
    this.paymentFilters.update((f) => ({ ...f, outstandingOnly: v }));
    this.resetAndLoad();
  }
  private resetAndLoad(): void {
    this.page.set(0);
    this.loadStays(0);
  }
  private syncPage(): void {
    const statuses = Object.entries(this.statusVisibility())
      .filter(([, visible]) => visible)
      .map(([status]) => this.toBackendStatus(status as StayStatus));
    const conditions = Object.entries(this.paymentFilters().conditionVisibility)
      .filter(([, visible]) => visible)
      .map(([condition]) => condition);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        page: this.page() || null,
        statusFilter: statuses.join(',') || 'none',
        ownerId: this.searchFilters().ownerId,
        catId: this.searchFilters().catId,
        paymentFilter: conditions.join(',') || 'none',
        outstandingOnly: this.paymentFilters().outstandingOnly || null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }
  private scrollSelected(): void {
    const id = this.selectedStayId();
    if (id)
      setTimeout(() => document.getElementById(`stay-${id}`)?.scrollIntoView({ block: 'center' }));
  }
  private resolveSelectedStay(items: StayOverviewItem[]): void {
    const selectedId = this.selectedStayId();
    this.selectedRequest?.unsubscribe();
    if (!selectedId || items.some((stay) => stay.id === selectedId)) {
      this.selectedStay.set(null);
      this.scrollSelected();
      return;
    }
    this.selectedRequest = this.api.getStayDetail(selectedId).subscribe({
      next: (detail) => {
        if (this.selectedStayId() !== selectedId) return;
        this.selectedStay.set(this.selectedOverview(detail));
        this.scrollSelected();
      },
      error: () => this.selectedStay.set(null),
    });
  }
  private selectedOverview(detail: StayDetailResponse): StayOverviewItem {
    return {
      id: detail.stayId,
      startAt: detail.startAt,
      endAt: detail.endAt,
      status: detail.status,
      ownerId: detail.owner.id,
      ownerName: detail.owner.fullName,
      cats: detail.cats.items.map((cat) => ({ id: cat.id, name: cat.name })),
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
