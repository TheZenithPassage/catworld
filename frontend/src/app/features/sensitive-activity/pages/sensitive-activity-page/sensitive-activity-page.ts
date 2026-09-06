import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal, viewChild, afterRenderEffect } from '@angular/core';
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

import { RemoteEntitySelector } from '../../../../shared/entity-lookup/remote-entity-selector';
import {
  CatLookupAdapter,
  OwnerLookupAdapter,
} from '../../../../shared/entity-lookup/domain-lookup.adapters';
import { EntityLookupState } from '../../../../shared/entity-lookup/entity-lookup.models';
import {
  AccountLookup,
  ActivityLookupService,
  StayLookup,
} from '../../data-access/activity-lookup.service';
import { CatLookup } from '../../../cats/models/cat.model';
import { OwnerLookup } from '../../../owners/models/owner.model';

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
    RemoteEntitySelector,
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

  readonly accountAdapter = inject(ActivityLookupService);
  readonly ownerAdapter = inject(OwnerLookupAdapter);
  readonly catAdapter = inject(CatLookupAdapter);
  readonly actorSelector = viewChild<RemoteEntitySelector<AccountLookup>>('actorSelector');
  readonly ownerSelector = viewChild<RemoteEntitySelector<OwnerLookup>>('ownerSelector');
  readonly catSelector = viewChild<RemoteEntitySelector<CatLookup>>('catSelector');
  readonly candidates = signal<StayLookup[]>([]);
  readonly candidatePage = signal(0);
  readonly candidateTotal = signal(0);
  readonly candidateLoading = signal(false);
  readonly candidateError = signal(false);
  readonly candidatesExpanded = signal(false);
  readonly exactStay = signal<StayLookup | null>(null);
  readonly exactLoading = signal(false);
  readonly exactError = signal(false);
  readonly stayDateError = signal(false);
  readonly selectionConflict = signal(false);
  private candidateRequest: Subscription | null = null;
  private exactRequest: Subscription | null = null;
  private candidateVersion = 0;
  private exactVersion = 0;
  private routeVersion = signal(0);
  private initializedRoute = -1;
  private initializingSelectors = false;
  private candidateCriteria = '';

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
    afterRenderEffect(() => {
      const version = this.routeVersion();
      const actor = this.actorSelector(),
        owner = this.ownerSelector(),
        cat = this.catSelector();
      if (!actor || !owner || !cat || this.initializedRoute === version) return;
      this.initializedRoute = version;
      this.initializingSelectors = true;
      const draft = this.filters();
      for (const [selector, id] of [
        [actor, draft.actorId],
        [owner, draft.ownerId],
        [cat, draft.catId],
      ] as const) {
        if (selector.selectedId() !== (id || null)) {
          selector.reset();
          if (id && UUID_PATTERN.test(id)) selector.resolveKnownId(id);
        }
      }
      this.initializingSelectors = false;
    });
    this.destroyRef.onDestroy(() => {
      this.candidateRequest?.unsubscribe();
      this.exactRequest?.unsubscribe();
    });
    this.route.queryParamMap.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const eventTypeValue = params.get('eventType') ?? '';
      const requestedPage = this.parsePage(params.get('page'));
      const occurredFromInstant = params.get('occurredFrom') ?? '';
      const occurredToInstant = params.get('occurredTo') ?? '';
      const routeFilters: SensitiveActivityFilters = {
        actorId: params.get('actorId') ?? '',
        stayFrom: params.get('stayFrom') ?? '',
        stayTo: params.get('stayTo') ?? '',
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
      if (this.stayCriteriaKey(routeFilters) !== this.stayCriteriaKey(this.filters()))
        this.invalidateStay();
      this.selectionConflict.set(Boolean(routeFilters.ownerId && routeFilters.catId));
      this.stayDateError.set(!this.stayDatesValid(routeFilters));
      if (!routeFilters.stayId) {
        this.exactVersion++;
        this.exactRequest?.unsubscribe();
        this.exactLoading.set(false);
        this.exactError.set(false);
        this.exactStay.set(null);
      }
      if (routeFilters.stayId !== this.exactStay()?.stayId) {
        this.exactStay.set(null);
        if (routeFilters.stayId && UUID_PATTERN.test(routeFilters.stayId))
          this.resolveExactStay(routeFilters.stayId);
      }
      this.routeVersion.update((v) => v + 1);
      this.editedTemporalFilters.clear();
      this.filters.set(routeFilters);
      this.appliedFilters.set(appliedRouteFilters);
      this.clearFilterErrors();
      const idsValid = this.validateIdFilters(routeFilters);
      const temporalFiltersValid = this.validateRouteTemporalFilters(appliedRouteFilters);
      const periodValid = temporalFiltersValid
        ? this.validateAppliedPeriod(appliedRouteFilters)
        : false;
      if (
        idsValid &&
        temporalFiltersValid &&
        periodValid &&
        !this.stayDateError() &&
        !this.selectionConflict()
      ) {
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
    if (['ownerId', 'catId', 'stayFrom', 'stayTo'].includes(key) && this.filters()[key] !== value)
      this.invalidateStay();
    this.filters.update((current) => ({ ...current, [key]: value }));
    if (key === 'stayFrom' || key === 'stayTo')
      this.stayDateError.set(!this.stayDatesValid(this.filters()));
    this.selectionConflict.set(Boolean(this.filters().ownerId && this.filters().catId));
    if (key === 'occurredFrom' || key === 'occurredTo') {
      this.editedTemporalFilters.add(key);
      this.clearFilterError(key);
      this.clearFilterError('occurredTo', 'invalidPeriod');
    } else if (ID_FILTER_KEYS.includes(key as IdFilterKey)) {
      this.clearFilterError(key as IdFilterKey);
    }
  }

  applyFilters(form?: NgForm): void {
    this.stayDateError.set(
      !this.stayDatesValid(this.filters()) ||
        !!form?.controls['stayFrom']?.hasError('badInput') ||
        !!form?.controls['stayTo']?.hasError('badInput'),
    );
    if (this.stayDateError() || this.selectionConflict()) return;
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
      !this.periodInvalid(applied) &&
      this.stayDatesValid(applied) &&
      !(applied.ownerId && applied.catId)
    ) {
      this.load(this.page());
    }
  }

  clearFilters(): void {
    this.invalidateStay();
    this.initializingSelectors = true;
    this.actorSelector()?.reset();
    this.ownerSelector()?.reset();
    this.catSelector()?.reset();
    this.initializingSelectors = false;
    this.stayDateError.set(false);
    this.selectionConflict.set(false);
    this.filters.set({ ...EMPTY_SENSITIVE_ACTIVITY_FILTERS });
    this.clearFilterErrors();
    this.editedTemporalFilters.clear();
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  selectorChanged(key: 'actorId' | 'ownerId' | 'catId', state: EntityLookupState<unknown>): void {
    if (this.initializingSelectors) return;
    if (state.selectedId && this.filters()[key] === state.selectedId && !this.selectionConflict())
      return;
    if (state.selectedId && key !== 'actorId') {
      const opposite = key === 'ownerId' ? 'catId' : 'ownerId';
      this.updateFilter(opposite, '');
      (opposite === 'ownerId' ? this.ownerSelector() : this.catSelector())?.reset();
    }
    this.updateFilter(key, state.selectedId ?? '');
  }

  stayDatesValid(filters: SensitiveActivityFilters): boolean {
    const valid = (value?: string) =>
      !value ||
      (/^\d{4}-\d{2}-\d{2}$/.test(value) &&
        !Number.isNaN(Date.parse(value)) &&
        new Date(value).toISOString().slice(0, 10) === value);
    return (
      valid(filters.stayFrom) &&
      valid(filters.stayTo) &&
      !(filters.stayFrom && filters.stayTo && filters.stayFrom > filters.stayTo)
    );
  }

  canFindStay(form?: NgForm): boolean {
    const f = this.filters();
    return (
      !!(f.ownerId || f.catId || f.stayFrom || f.stayTo) &&
      !(f.ownerId && f.catId) &&
      this.stayDatesValid(f) &&
      !form?.controls['stayFrom']?.hasError('badInput') &&
      !form?.controls['stayTo']?.hasError('badInput')
    );
  }

  private stayCriteriaKey(f: SensitiveActivityFilters): string {
    return JSON.stringify([f.ownerId, f.catId, f.stayFrom || '', f.stayTo || '']);
  }

  findStay(page = 0, form?: NgForm): void {
    if (!this.canFindStay(form)) return;
    this.candidateRequest?.unsubscribe();
    const version = ++this.candidateVersion;
    const f = this.filters();
    this.candidateCriteria = this.stayCriteriaKey(f);
    this.candidatesExpanded.set(true);
    this.candidates.set([]);
    this.candidatePage.set(page);
    this.candidateLoading.set(true);
    this.candidateError.set(false);
    this.candidateRequest = this.accountAdapter
      .searchStays({ ownerId: f.ownerId, catId: f.catId, from: f.stayFrom, to: f.stayTo }, page)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (result) => {
          if (version !== this.candidateVersion) return;
          this.candidates.set(result.items);
          this.candidateTotal.set(result.totalElements);
          this.candidateLoading.set(false);
        },
        error: () => {
          if (version !== this.candidateVersion) return;
          this.candidateLoading.set(false);
          this.candidateError.set(true);
        },
      });
  }

  selectStay(stay: StayLookup): void {
    this.exactVersion++;
    this.exactRequest?.unsubscribe();
    this.exactLoading.set(false);
    this.exactError.set(false);
    this.exactStay.set(stay);
    this.updateFilter('stayId', stay.stayId);
    this.candidatesExpanded.set(false);
  }

  changeStay(): void {
    if (this.candidateCriteria === this.stayCriteriaKey(this.filters()))
      this.candidatesExpanded.set(true);
  }

  canChangeStay(): boolean {
    return this.candidateCriteria === this.stayCriteriaKey(this.filters());
  }

  removeExactStay(): void {
    this.exactVersion++;
    this.exactRequest?.unsubscribe();
    this.exactStay.set(null);
    this.exactLoading.set(false);
    this.exactError.set(false);
    this.updateFilter('stayId', '');
  }

  resolveExactStay(id = this.filters().stayId): void {
    this.exactRequest?.unsubscribe();
    const version = ++this.exactVersion;
    this.exactLoading.set(true);
    this.exactError.set(false);
    this.exactRequest = this.accountAdapter
      .resolveStay(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stay) => {
          if (version !== this.exactVersion) return;
          this.exactStay.set(stay);
          this.exactLoading.set(false);
        },
        error: () => {
          if (version !== this.exactVersion) return;
          this.exactLoading.set(false);
          this.exactError.set(true);
        },
      });
  }

  private invalidateStay(): void {
    ++this.candidateVersion;
    this.candidateRequest?.unsubscribe();
    ++this.exactVersion;
    this.exactRequest?.unsubscribe();
    this.candidates.set([]);
    this.candidateTotal.set(0);
    this.candidatePage.set(0);
    this.candidateLoading.set(false);
    this.candidateError.set(false);
    this.candidatesExpanded.set(false);
    this.exactStay.set(null);
    this.exactLoading.set(false);
    this.exactError.set(false);
    this.candidateCriteria = '';
    this.filters.update((f) => ({ ...f, stayId: '' }));
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
