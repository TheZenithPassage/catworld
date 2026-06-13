import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { StayStatusVisibilityPreferencesService } from '../../services/stay-status-visibility-preferences.service';
import { StaySearchFiltersComponent } from '../../components/stay-search-filters/stay-search-filters';
import {
  getDefaultStaySearchFilters,
  isStayVisibleBySearchFilters,
  StaySearchFilters,
} from '../../utils/stay-search-filter.util';
import {
  canCancelStay,
  canModifyStay,
  getStayStatus,
  isStayVisibleByStatus,
  STAY_STATUS_FILTER_OPTIONS,
  StayStatus,
  StayStatusVisibility,
} from '../../utils/stay-status.util';

@Component({
  selector: 'app-stays-overview-page',
  imports: [RouterLink, StaySearchFiltersComponent],
  templateUrl: './stays-overview-page.html',
  styleUrl: './stays-overview-page.scss',
})
export class StaysOverviewPage {
  private readonly stayApiService = inject(StayApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18nService = inject(I18nService);
  private readonly stayStatusVisibilityPreferencesService = inject(
    StayStatusVisibilityPreferencesService,
  );

  readonly text = this.i18nService.text;
  readonly dateLocale = this.i18nService.dateLocale;
  readonly selectedStayId = signal<string | null>(null);
  readonly statusFilterOptions = STAY_STATUS_FILTER_OPTIONS;
  readonly statusVisibility = signal<StayStatusVisibility>(
    this.stayStatusVisibilityPreferencesService.read(),
  );
  readonly searchFilters = signal<StaySearchFilters>(getDefaultStaySearchFilters());

  readonly filteredStays = computed(() =>
    this.stays().filter(
      (stay) =>
        isStayVisibleByStatus(stay, this.statusVisibility()) &&
        isStayVisibleBySearchFilters(stay, this.searchFilters()),
    ),
  );

  readonly stays = signal<Stay[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly cancellingStayId = signal<string | null>(null);

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

  getCatNames(stay: Stay): string {
    return stay.cats.map((cat) => cat.name).join(', ');
  }

  canCancelStay(stay: Stay): boolean {
    return canCancelStay(stay);
  }

  canEditStay(stay: Stay): boolean {
    return canModifyStay(stay);
  }

  cancelStay(stay: Stay): void {
    const confirmed = window.confirm(
      `${this.text().stays.overview.cancelConfirmPrefix}${this.getCatNames(stay)}${this.text().stays.overview.cancelConfirmSuffix}`,
    );

    if (!confirmed) {
      return;
    }

    this.error.set(null);
    this.cancellingStayId.set(stay.stayId);

    this.stayApiService.cancelStay(stay.stayId).subscribe({
      next: () => {
        this.cancellingStayId.set(null);
        this.loadStays();
      },
      error: (error: unknown) => {
        this.error.set(this.getApiErrorMessage(error, this.text().stays.overview.errorCancelling));
        this.cancellingStayId.set(null);
      },
    });
  }

  isSelectedStay(stay: Stay): boolean {
    return this.selectedStayId() === stay.stayId;
  }

  getUnavailableActionLabel(stay: Stay): string {
    const status = getStayStatus(stay);

    if (status === 'cancelled') {
      return this.text().stays.overview.alreadyCancelled;
    }

    if (status === 'checked-out') {
      return this.text().stays.overview.alreadyCheckedOut;
    }

    return this.text().stays.emptyValue;
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

  setSearchFilters(filters: StaySearchFilters): void {
    this.searchFilters.set(filters);
  }

  private getApiErrorMessage(error: unknown, fallbackMessage: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallbackMessage;
    }

    const responseBody: unknown = error.error;

    if (!responseBody) {
      return fallbackMessage;
    }

    if (typeof responseBody === 'string') {
      return responseBody.trim() || fallbackMessage;
    }

    if (this.isValidationErrorMap(responseBody)) {
      const messages = Object.entries(responseBody).map(
        ([field, message]) => `${field}: ${message}`,
      );

      return messages.length > 0 ? messages.join('. ') : fallbackMessage;
    }

    return fallbackMessage;
  }

  private isValidationErrorMap(value: unknown): value is Record<string, string> {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      Object.values(value).every((message) => typeof message === 'string')
    );
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
