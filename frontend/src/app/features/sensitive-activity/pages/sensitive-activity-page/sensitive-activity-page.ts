import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { NativeBadInputDirective } from '../../../../shared/forms/native-bad-input.directive';
import { formatLocalDate } from '../../../../shared/date/local-date-format';
import { BusinessTimeService } from '../../../../core/time/business-time.service';
import { SensitiveActivityDetailDialog } from '../../components/sensitive-activity-detail-dialog/sensitive-activity-detail-dialog';
import { SensitiveEconomicActivityApiService } from '../../data-access/sensitive-economic-activity-api.service';
import {
  EMPTY_SENSITIVE_ACTIVITY_FILTERS,
  isSensitiveActivityInstant,
  MalformedSensitiveActivityError,
  NightlyRateCategory,
  SENSITIVE_EVENT_TYPES,
  SensitiveActivityFilters,
  SensitiveEconomicActivityEvent,
  SensitiveStayContext,
} from '../../models/sensitive-economic-activity';

type LoadError = 'forbidden' | 'malformed' | 'failure' | null;
type IdFilterKey = 'actorId' | 'ownerId' | 'catId' | 'stayId';
type TemporalFilterKey = 'occurredFrom' | 'occurredTo';
type ValidatedFilterKey = IdFilterKey | TemporalFilterKey;
type FilterError =
  | 'invalidUuid'
  | 'invalidDateTime'
  | 'nonexistentBusinessTime'
  | 'invalidPeriod'
  | null;

interface ResolvedTemporalFilter {
  instant: string | undefined;
  error: FilterError;
}

const ID_FILTER_KEYS: readonly IdFilterKey[] = ['actorId', 'ownerId', 'catId', 'stayId'];
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

@Component({
  selector: 'app-sensitive-activity-page',
  imports: [
    FormsModule,
    MatButton,
    MatCard,
    MatCardContent,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    MatPaginator,
    NativeBadInputDirective,
    UiStateComponent,
  ],
  templateUrl: './sensitive-activity-page.html',
  styleUrl: './sensitive-activity-page.scss',
})
export class SensitiveActivityPage {
  private readonly api = inject(SensitiveEconomicActivityApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);
  private readonly businessTime = inject(BusinessTimeService);
  private readonly dialog = inject(MatDialog);

  readonly text = this.i18n.text;
  readonly dateLocale = this.i18n.dateLocale;
  readonly eventTypes = SENSITIVE_EVENT_TYPES;
  readonly filters = signal<SensitiveActivityFilters>({ ...EMPTY_SENSITIVE_ACTIVITY_FILTERS });
  readonly appliedFilters = signal<SensitiveActivityFilters>({
    ...EMPTY_SENSITIVE_ACTIVITY_FILTERS,
  });
  readonly events = signal<readonly SensitiveEconomicActivityEvent[]>([]);
  readonly page = signal(0);
  readonly totalElements = signal(0);
  readonly pageSize = 10;
  readonly loading = signal(true);
  readonly loadError = signal<LoadError>(null);
  readonly filterErrors = signal<Record<ValidatedFilterKey, FilterError>>({
    actorId: null,
    ownerId: null,
    catId: null,
    stayId: null,
    occurredFrom: null,
    occurredTo: null,
  });
  readonly filterErrorStateMatchers: Record<ValidatedFilterKey, ErrorStateMatcher> = {
    actorId: this.errorStateMatcher('actorId'),
    ownerId: this.errorStateMatcher('ownerId'),
    catId: this.errorStateMatcher('catId'),
    stayId: this.errorStateMatcher('stayId'),
    occurredFrom: this.errorStateMatcher('occurredFrom'),
    occurredTo: this.errorStateMatcher('occurredTo'),
  };
  private loadSubscription: Subscription | null = null;
  private loadVersion = 0;
  private readonly editedTemporalFilters = new Set<'occurredFrom' | 'occurredTo'>();

  constructor() {
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const eventTypeValue = params.get('eventType') ?? '';
      const requestedPage = this.parsePage(params.get('page'));
      const occurredFromInstant = params.get('occurredFrom') ?? '';
      const occurredToInstant = params.get('occurredTo') ?? '';
      const routeFilters: SensitiveActivityFilters = {
        actorId: params.get('actorId') ?? '',
        occurredFrom: this.toLocalDateTime(occurredFromInstant),
        occurredTo: this.toLocalDateTime(occurredToInstant),
        eventType: SENSITIVE_EVENT_TYPES.includes(eventTypeValue as never)
          ? (eventTypeValue as SensitiveActivityFilters['eventType'])
          : '',
        ownerId: params.get('ownerId') ?? '',
        catId: params.get('catId') ?? '',
        stayId: params.get('stayId') ?? '',
      };
      const appliedRouteFilters = {
        ...routeFilters,
        occurredFrom: occurredFromInstant,
        occurredTo: occurredToInstant,
      };
      this.editedTemporalFilters.clear();
      this.filters.set(routeFilters);
      this.appliedFilters.set(appliedRouteFilters);
      this.clearFilterErrors();
      const idsValid = this.validateIdFilters(routeFilters);
      const temporalFiltersValid = this.validateRouteTemporalFilters(appliedRouteFilters);
      const periodValid = temporalFiltersValid
        ? this.validateAppliedPeriod(appliedRouteFilters)
        : false;
      if (idsValid && temporalFiltersValid && periodValid) {
        this.page.set(requestedPage);
        this.load(requestedPage);
      } else {
        this.cancelLoad();
        this.loading.set(false);
        this.loadError.set(null);
      }
    });
  }

  updateFilter(key: keyof SensitiveActivityFilters, value: string): void {
    this.filters.update((current) => ({ ...current, [key]: value }));
    if (key === 'occurredFrom' || key === 'occurredTo') {
      this.editedTemporalFilters.add(key);
      this.clearFilterError(key);
      this.clearFilterError('occurredTo', 'invalidPeriod');
    } else if (ID_FILTER_KEYS.includes(key as IdFilterKey)) {
      this.clearFilterError(key as IdFilterKey);
    }
  }

  applyFilters(form?: NgForm): void {
    const idsValid = this.validateIdFilters(this.filters());
    const occurredFromBadInput = form?.controls['occurredFrom']?.hasError('badInput') ?? false;
    const occurredToBadInput = form?.controls['occurredTo']?.hasError('badInput') ?? false;
    const occurredFrom = this.resolveAppliedInstant('occurredFrom');
    const occurredTo = this.resolveAppliedInstant('occurredTo');
    const occurredFromError = occurredFromBadInput ? 'invalidDateTime' : occurredFrom.error;
    const occurredToError = occurredToBadInput ? 'invalidDateTime' : occurredTo.error;
    this.setFilterError('occurredFrom', occurredFromError);
    this.setFilterError('occurredTo', occurredToError);
    if (!idsValid || occurredFromError || occurredToError) return;
    const appliedFilters: SensitiveActivityFilters = {
      ...this.filters(),
      occurredFrom: occurredFrom.instant ?? '',
      occurredTo: occurredTo.instant ?? '',
    };
    if (!this.validateAppliedPeriod(appliedFilters)) return;
    const queryParams = Object.fromEntries(
      Object.entries(appliedFilters).filter(([, value]) => Boolean(value)),
    );
    this.router.navigate([], { relativeTo: this.route, queryParams });
  }

  refresh(): void {
    const applied = this.appliedFilters();
    if (
      this.idFiltersValid(applied) &&
      this.temporalFiltersValid(applied) &&
      !this.periodInvalid(applied)
    ) {
      this.load(this.page());
    }
  }

  clearFilters(): void {
    this.filters.set({ ...EMPTY_SENSITIVE_ACTIVITY_FILTERS });
    this.clearFilterErrors();
    this.editedTemporalFilters.clear();
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  pageChanged(event: PageEvent): void {
    if (event.pageIndex === this.page()) return;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: this.queryParams(this.appliedFilters(), event.pageIndex),
    });
  }

  openDetail(event: SensitiveEconomicActivityEvent): void {
    this.dialog.open(SensitiveActivityDetailDialog, {
      data: event,
      width: 'min(42rem, calc(100vw - 2rem))',
      maxWidth: 'calc(100vw - 2rem)',
      maxHeight: 'calc(100vh - 2rem)',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
    });
  }

  activateDetail(keyboardEvent: KeyboardEvent, event: SensitiveEconomicActivityEvent): void {
    if (keyboardEvent.key !== 'Enter' && keyboardEvent.key !== ' ') return;
    keyboardEvent.preventDefault();
    this.openDetail(event);
  }

  stateMessage(): string {
    const copy = this.text().sensitiveActivity;
    switch (this.loadError()) {
      case 'forbidden':
        return copy.forbidden;
      case 'malformed':
        return copy.malformed;
      default:
        return copy.failure;
    }
  }

  eventLabel(event: SensitiveEconomicActivityEvent): string {
    return this.text().sensitiveActivity.events[event.eventType];
  }

  categoryLabel(category: NightlyRateCategory): string {
    return this.text().sensitiveActivity.categories[category];
  }

  display(value: string | null | undefined): string {
    return value ?? this.text().sensitiveActivity.unavailable;
  }

  suggestedAmount(event: { retainedNightlyRate: string; numberOfNights: number }): string {
    const negative = event.retainedNightlyRate.startsWith('-');
    const unsignedAmount = negative
      ? event.retainedNightlyRate.slice(1)
      : event.retainedNightlyRate;
    const [whole, fraction = ''] = unsignedAmount.split('.');
    const scaledProduct = BigInt(`${whole}${fraction}`) * BigInt(event.numberOfNights);
    const scaledText = scaledProduct.toString().padStart(fraction.length + 1, '0');
    const amount = fraction.length
      ? `${scaledText.slice(0, -fraction.length)}.${scaledText.slice(-fraction.length)}`
      : scaledText;
    return negative && scaledProduct !== 0n ? `-${amount}` : amount;
  }

  formatDate(value: string): string {
    return this.businessTime.formatInstant(value, this.dateLocale());
  }

  formatPaymentDate(value: string): string {
    return formatLocalDate(value, this.dateLocale());
  }

  formatStayDateTime(value: string): string {
    return this.businessTime.formatLocalDateTime(value, this.dateLocale());
  }

  catsLabel(cats: SensitiveStayContext['cats']): string {
    return cats.length
      ? cats.map((cat) => cat.name).join(', ')
      : this.text().sensitiveActivity.unavailable;
  }

  private load(requestedPage: number): void {
    this.cancelLoad();
    const version = this.loadVersion;
    this.loading.set(true);
    this.loadError.set(null);
    this.loadSubscription = this.api
      .getActivity(this.appliedFilters(), requestedPage)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          if (version !== this.loadVersion) return;
          const lastPage = Math.max(0, Math.ceil(response.totalElements / this.pageSize) - 1);
          if (requestedPage > lastPage) {
            this.loading.set(false);
            this.router.navigate([], {
              relativeTo: this.route,
              queryParams: this.queryParams(this.appliedFilters(), lastPage),
              replaceUrl: true,
            });
            return;
          }
          this.events.set(response.items);
          this.page.set(response.page);
          this.totalElements.set(response.totalElements);
          this.loading.set(false);
        },
        error: (error: unknown) => {
          if (version !== this.loadVersion) return;
          this.events.set([]);
          this.loading.set(false);
          this.loadError.set(
            error instanceof MalformedSensitiveActivityError
              ? 'malformed'
              : error instanceof HttpErrorResponse && error.status === 403
                ? 'forbidden'
                : 'failure',
          );
          setTimeout(() => document.getElementById('sensitive-activity-state')?.focus());
        },
      });
  }

  private cancelLoad(): void {
    this.loadVersion += 1;
    this.loadSubscription?.unsubscribe();
    this.loadSubscription = null;
  }

  private parsePage(value: string | null): number {
    return value && /^\d+$/.test(value) && Number.isSafeInteger(Number(value)) ? Number(value) : 0;
  }

  private queryParams(filters: SensitiveActivityFilters, page: number): Record<string, string> {
    return {
      ...Object.fromEntries(Object.entries(filters).filter(([, value]) => Boolean(value))),
      ...(page > 0 ? { page: String(page) } : {}),
    };
  }

  private validateAppliedPeriod(filters: SensitiveActivityFilters): boolean {
    const invalid = this.periodInvalid(filters);
    this.setFilterError('occurredTo', invalid ? 'invalidPeriod' : null);
    if (invalid) setTimeout(() => document.getElementById('sensitive-occurred-to')?.focus());
    return !invalid;
  }

  private validateIdFilters(filters: SensitiveActivityFilters): boolean {
    let valid = true;
    for (const key of ID_FILTER_KEYS) {
      const invalid = Boolean(filters[key] && !UUID_PATTERN.test(filters[key]));
      this.setFilterError(key, invalid ? 'invalidUuid' : null);
      valid &&= !invalid;
    }
    return valid;
  }

  private idFiltersValid(filters: SensitiveActivityFilters): boolean {
    return ID_FILTER_KEYS.every((key) => !filters[key] || UUID_PATTERN.test(filters[key]));
  }

  private validateRouteTemporalFilters(filters: SensitiveActivityFilters): boolean {
    const valid = this.temporalFiltersValid(filters);
    for (const key of ['occurredFrom', 'occurredTo'] as const) {
      this.setFilterError(
        key,
        filters[key] && !isSensitiveActivityInstant(filters[key]) ? 'invalidDateTime' : null,
      );
    }
    return valid;
  }

  private temporalFiltersValid(filters: SensitiveActivityFilters): boolean {
    return (['occurredFrom', 'occurredTo'] as const).every(
      (key) => !filters[key] || isSensitiveActivityInstant(filters[key]),
    );
  }

  private periodInvalid(filters: SensitiveActivityFilters): boolean {
    const { occurredFrom, occurredTo } = filters;
    return Boolean(
      occurredFrom && occurredTo && Date.parse(occurredFrom) >= Date.parse(occurredTo),
    );
  }

  private toLocalDateTime(value: string): string {
    if (!value) return '';
    try {
      return this.businessTime.instantToLocalDateTime(value);
    } catch {
      return '';
    }
  }

  private resolveAppliedInstant(key: TemporalFilterKey): ResolvedTemporalFilter {
    if (!this.editedTemporalFilters.has(key)) {
      return { instant: this.appliedFilters()[key] || undefined, error: null };
    }
    const value = this.filters()[key];
    if (!value) return { instant: undefined, error: null };
    const resolution = this.businessTime.resolveLocalDateTime(value);
    if (resolution.valid) return { instant: resolution.instant, error: null };
    return {
      instant: undefined,
      error: resolution.reason === 'malformed' ? 'invalidDateTime' : 'nonexistentBusinessTime',
    };
  }

  private errorStateMatcher(key: ValidatedFilterKey): ErrorStateMatcher {
    return {
      isErrorState: (control) =>
        this.filterErrors()[key] !== null || Boolean(control?.hasError('badInput')),
    };
  }

  private setFilterError(key: ValidatedFilterKey, error: FilterError): void {
    this.filterErrors.update((current) => ({ ...current, [key]: error }));
  }

  private clearFilterError(key: ValidatedFilterKey, onlyIf?: FilterError): void {
    if (onlyIf && this.filterErrors()[key] !== onlyIf) return;
    this.setFilterError(key, null);
  }

  private clearFilterErrors(): void {
    this.filterErrors.set({
      actorId: null,
      ownerId: null,
      catId: null,
      stayId: null,
      occurredFrom: null,
      occurredTo: null,
    });
  }
}
