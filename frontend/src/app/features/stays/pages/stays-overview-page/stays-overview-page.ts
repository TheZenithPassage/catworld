import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { PaymentCondition, Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { StayStatusVisibilityPreferencesService } from '../../services/stay-status-visibility-preferences.service';
import { StaySearchFiltersComponent } from '../../components/stay-search-filters/stay-search-filters';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import {
  getDefaultStayPaymentFilters,
  getDefaultStaySearchFilters,
  isStayVisibleByPaymentFilters,
  isStayVisibleBySearchFilters,
  PAYMENT_CONDITION_FILTER_OPTIONS,
  PaymentConditionVisibility,
  StaySearchFilters,
} from '../../utils/stay-search-filter.util';
import {
  getStayStatus,
  isStayVisibleByStatus,
  STAY_STATUS_FILTER_OPTIONS,
  StayStatus,
  StayStatusVisibility,
} from '../../utils/stay-status.util';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import { EntityDetailUpdate } from '../../../../shared/entity-detail/entity-reference';

@Component({
  selector: 'app-stays-overview-page',
  imports: [
    MatButton,
    MatCheckbox,
    MatTableModule,
    RouterLink,
    StaySearchFiltersComponent,
    UiStateComponent,
  ],
  templateUrl: './stays-overview-page.html',
  styleUrl: './stays-overview-page.scss',
})
export class StaysOverviewPage {
  private readonly stayApiService = inject(StayApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18nService = inject(I18nService);
  private readonly entityDetailDialog = inject(EntityDetailDialogService);
  private readonly stayStatusVisibilityPreferencesService = inject(
    StayStatusVisibilityPreferencesService,
  );

  readonly text = this.i18nService.text;
  readonly dateLocale = this.i18nService.dateLocale;
  readonly selectedStayId = signal<string | null>(null);
  readonly statusFilterOptions = STAY_STATUS_FILTER_OPTIONS;
  readonly paymentConditionFilterOptions = PAYMENT_CONDITION_FILTER_OPTIONS;
  readonly statusVisibility = signal<StayStatusVisibility>(
    this.stayStatusVisibilityPreferencesService.read(),
  );
  readonly searchFilters = signal<StaySearchFilters>(getDefaultStaySearchFilters());
  readonly paymentFilters = signal(getDefaultStayPaymentFilters());
  readonly displayedColumns = [
    'state',
    'start',
    'end',
    'nights',
    'economics',
    'cats',
    'owner',
    'notes',
  ];

  readonly filteredStays = computed(() =>
    this.stays().filter(
      (stay) =>
        isStayVisibleByStatus(stay, this.statusVisibility()) &&
        isStayVisibleBySearchFilters(stay, this.searchFilters()) &&
        isStayVisibleByPaymentFilters(stay, this.paymentFilters()),
    ),
  );

  readonly stays = signal<Stay[]>([]);
  readonly loading = signal(false);
  readonly error = createLanguageResetError(this.i18nService.language);

  constructor() {
    effect(() => {
      this.stayStatusVisibilityPreferencesService.store(this.statusVisibility());
    });

    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      this.selectedStayId.set(params.get('selectedStayId'));
    });

    this.loadStays();
  }

  loadStays(): void {
    this.loading.set(true);
    this.error.set(null);

    this.stayApiService.getStays().subscribe({
      next: (stays) => {
        this.stays.set(stays);
        this.loading.set(false);
        this.scrollSelectedStayIntoView();
      },
      error: () => {
        this.error.set(this.text().stays.overview.errorLoading);
        this.loading.set(false);
      },
    });
  }

  getStayStatus(stay: Stay): string {
    return this.text().stays.status[getStayStatus(stay)];
  }

  getPaymentCondition(stay: Stay): string {
    return this.text().stays.filters.paymentCondition[stay.paymentCondition];
  }

  formatDate(value: string | null): string {
    if (!value) {
      return this.text().stays.emptyValue;
    }

    return new Intl.DateTimeFormat(this.dateLocale(), {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(new Date(value));
  }

  getCatSummary(stay: Stay): string {
    return stay.cats.length === 1
      ? `1 ${this.text().stays.overview.catSingular}`
      : `${stay.cats.length} ${this.text().stays.overview.catPlural}`;
  }

  getNightCountLabel(numberOfNights: number): string {
    const unit =
      numberOfNights === 1 ? this.text().stays.nights.singular : this.text().stays.nights.plural;

    return `${numberOfNights} ${unit}`;
  }

  getCatNames(stay: Stay): string {
    return stay.cats.map((cat) => cat.name).join(', ');
  }

  openDetail(stay: Stay): void {
    this.entityDetailDialog
      .open({ entityType: 'stay', entityId: stay.stayId })
      .subscribe((update) => this.applyDetailUpdate(update));
  }

  activateRow(event: KeyboardEvent, stay: Stay): void {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    this.openDetail(stay);
  }

  private applyDetailUpdate(update: EntityDetailUpdate): void {
    if (!('stayId' in update)) return;
    this.stays.update((stays) =>
      stays.map((stay) => (stay.stayId === update.stayId ? update : stay)),
    );
  }

  isSelectedStay(stay: Stay): boolean {
    return this.selectedStayId() === stay.stayId;
  }

  isStatusVisible(status: StayStatus): boolean {
    return this.statusVisibility()[status];
  }

  setStatusVisibility(status: StayStatus, checked: boolean): void {
    this.statusVisibility.update((currentVisibility) => ({
      ...currentVisibility,
      [status]: checked,
    }));
  }

  toggleStatusFromPill(event: MouseEvent, status: StayStatus): void {
    if (event.target !== event.currentTarget) {
      return;
    }

    this.setStatusVisibility(status, !this.isStatusVisible(status));
  }

  setSearchFilters(filters: StaySearchFilters): void {
    this.searchFilters.set(filters);
  }

  isPaymentConditionVisible(condition: PaymentCondition): boolean {
    return this.paymentFilters().conditionVisibility[condition];
  }

  setPaymentConditionVisibility(condition: PaymentCondition, checked: boolean): void {
    this.paymentFilters.update((filters) => ({
      ...filters,
      conditionVisibility: {
        ...filters.conditionVisibility,
        [condition]: checked,
      } satisfies PaymentConditionVisibility,
    }));
  }

  setOutstandingOnly(checked: boolean): void {
    this.paymentFilters.update((filters) => ({ ...filters, outstandingOnly: checked }));
  }

  private scrollSelectedStayIntoView(): void {
    const selectedStayId = this.selectedStayId();

    if (!selectedStayId) {
      return;
    }

    setTimeout(() => {
      document.getElementById(`stay-${selectedStayId}`)?.scrollIntoView({ block: 'center' });
    });
  }
}
