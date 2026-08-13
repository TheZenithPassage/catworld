import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { NativeBadInputDirective } from '../../../../shared/forms/native-bad-input.directive';
import { formatLocalDate } from '../../../../shared/date/local-date-format';
import { BusinessTimeService } from '../../../../core/time/business-time.service';
import { SensitiveEconomicActivityApiService } from '../../data-access/sensitive-economic-activity-api.service';
import {
  EMPTY_SENSITIVE_ACTIVITY_FILTERS,
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
    MatCardHeader,
    MatCardTitle,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
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

  readonly text = this.i18n.text;
  readonly dateLocale = this.i18n.dateLocale;
  readonly eventTypes = SENSITIVE_EVENT_TYPES;
  readonly filters = signal<SensitiveActivityFilters>({ ...EMPTY_SENSITIVE_ACTIVITY_FILTERS });
  readonly appliedFilters = signal<SensitiveActivityFilters>({
    ...EMPTY_SENSITIVE_ACTIVITY_FILTERS,
  });
  readonly events = signal<readonly SensitiveEconomicActivityEvent[]>([]);
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
      const periodValid = this.validateAppliedPeriod(appliedRouteFilters);
      if (idsValid && periodValid) {
        this.load();
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
    if (this.idFiltersValid(applied) && !this.periodInvalid(applied)) this.load();
  }

  clearFilters(): void {
    this.filters.set({ ...EMPTY_SENSITIVE_ACTIVITY_FILTERS });
    this.clearFilterErrors();
    this.editedTemporalFilters.clear();
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
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
      ? cats.map((cat) => `${cat.name} (${cat.id})`).join(', ')
      : this.text().sensitiveActivity.unavailable;
  }

  private load(): void {
    this.cancelLoad();
    const version = this.loadVersion;
    this.loading.set(true);
    this.loadError.set(null);
    this.loadSubscription = this.api
      .getActivity(this.appliedFilters())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (events) => {
          if (version !== this.loadVersion) return;
          this.events.set(events);
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
