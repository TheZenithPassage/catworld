import { ActivitySummarySnapshot, composeActivitySummary } from '../../models/filter-summary';
import { ACTIVITY_SUMMARY_TRANSLATIONS } from '../../../../core/i18n/translations/sensitive-activity-summary.translations';
import { StayDateFiltersComponent } from '../../../../shared/stay-date-filters/stay-date-filters';
import {
  DATE_MATCH_MODES,
  StayDateFilters,
  StayDateMatchMode,
} from '../../../../shared/stay-date-filters/stay-date-filter.model';
import { MatSelect, MatSelectTrigger } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  DestroyRef,
  inject,
  signal,
  viewChild,
  afterRenderEffect,
  computed,
  effect,
} from '@angular/core';
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
    StayDateFiltersComponent,
    MatSelect,
    MatSelectTrigger,
    MatOption,
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
  readonly stayDates = viewChild(StayDateFiltersComponent);
  readonly nativeOccurrenceInvalid = signal(false);
  readonly unresolvedSelectors = signal({ actorId: false, ownerId: false, catId: false });
  readonly dateFilters = computed<StayDateFilters>(() => ({
    dateFrom: this.filters().stayFrom,
    dateTo: this.filters().stayTo,
    dateMatchMode: this.filters().stayDateMatchMode ?? 'OVERLAPS',
  }));
  readonly advancedExpanded = signal(false);
  readonly hasStayPredicate = computed(() => this.stayPredicatePresent(this.filters()));
  readonly eventCompatibilityInvalid = computed(() => this.incompatibleEvent(this.filters()));
  readonly hideStayControls = computed(
    () =>
      this.filters().eventType === 'NIGHTLY_RATE_CHANGED' &&
      !this.hasStayPredicate() &&
      !this.unresolvedSelectors().ownerId &&
      !this.unresolvedSelectors().catId &&
      !Object.values(this.stayDates()?.dateStates() ?? {}).some(
        (state) => state === 'EDITING' || state === 'INVALID',
      ),
  );
  readonly advancedStatePresent = computed(() =>
    Boolean(
      this.filters().stayFrom ||
      this.filters().stayTo ||
      this.filters().stayId ||
      this.candidatesExpanded() ||
      Object.values(this.stayDates()?.dateStates() ?? {}).some((state) => state !== 'EMPTY'),
    ),
  );
  private readonly lastNarrative = signal<ActivitySummarySnapshot | null>(null);
  readonly narrative = computed(() => this.narrativeState());
  readonly filterSummary = computed(() => {
    const state = this.narrative();
    const copy = ACTIVITY_SUMMARY_TRANSLATIONS[this.i18n.language()];
    if (state.kind === 'preparing') return copy.preparing;
    if (state.kind === 'invalid') return copy.invalid;
    const snapshot = state.kind === 'ready' ? state.snapshot : this.lastNarrative();
    return snapshot
      ? composeActivitySummary(
          snapshot,
          copy,
          (value) => this.formatDate(value),
          (value) => this.formatStayDateTime(value),
          (value) => this.formatPaymentDate(value),
        )
      : copy.invalid;
  });
  readonly hasAppliedFilters = computed(() =>
    Object.entries(this.appliedFilters()).some(
      ([key, value]) => key !== 'stayDateMatchMode' && !!value,
    ),
  );
  readonly pendingChanges = computed(() => {
    if (this.nativeOccurrenceInvalid() || Object.values(this.unresolvedSelectors()).some(Boolean))
      return true;
    const states = this.stayDates()?.dateStates();
    if (states && Object.values(states).some((state) => state === 'EDITING' || state === 'INVALID'))
      return true;
    const from = this.resolveAppliedInstant('occurredFrom');
    const to = this.resolveAppliedInstant('occurredTo');
    if (from.error || to.error) return true;
    return (
      this.filterKey({
        ...this.filters(),
        occurredFrom: from.instant ?? '',
        occurredTo: to.instant ?? '',
      }) !== this.filterKey(this.appliedFilters())
    );
  });
  readonly selectionConflict = signal(false);
  private candidateRequest: Subscription | null = null;
  private exactRequest: Subscription | null = null;
  private candidateVersion = 0;
  private exactVersion = 0;
  private routeVersion = signal(0);
  private readonly initializedRoute = signal(-1);
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
  readonly rejectedRoute = signal(false);
  readonly invalidFilterDescription = computed(
    () => ACTIVITY_SUMMARY_TRANSLATIONS[this.i18n.language()].invalid,
  );
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
    effect(() => {
      const state = this.narrative();
      if (state.kind === 'ready') this.lastNarrative.set(state.snapshot);
    });
    afterRenderEffect(() => {
      const version = this.routeVersion();
      const actor = this.actorSelector(),
        owner = this.ownerSelector(),
        cat = this.catSelector();
      if (!actor || !owner || !cat || this.initializedRoute() === version) return;
      this.initializedRoute.set(version);
      this.initializingSelectors = true;
      const draft = this.filters();
      for (const [selector, id] of [
        [actor, draft.actorId],
        [owner, draft.ownerId],
        [cat, draft.catId],
      ] as const) {
        if (selector.selectedId() !== (id || null) || (!id && selector.query().length > 0)) {
          selector.reset();
          if (id && UUID_PATTERN.test(id)) selector.resolveKnownId(id);
        }
      }
      this.initializingSelectors = false;
      this.unresolvedSelectors.set({ actorId: false, ownerId: false, catId: false });
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
        stayDateMatchMode:
          params.get('stayFrom') || params.get('stayTo')
            ? ((params.get('stayDateMatchMode') ?? 'OVERLAPS') as StayDateMatchMode)
            : undefined,
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
      this.nativeOccurrenceInvalid.set(false);
      this.advancedExpanded.set(
        Boolean(
          routeFilters.stayFrom ||
          routeFilters.stayTo ||
          routeFilters.stayId ||
          this.candidatesExpanded(),
        ),
      );
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
        this.stayDatesValid(routeFilters) &&
        !this.selectionConflict() &&
        !this.incompatibleEvent(routeFilters)
      ) {
        this.page.set(requestedPage);
        this.load(requestedPage);
      } else {
        this.rejectedRoute.set(true);
        this.cancelLoad();
        this.loading.set(false);
        this.loadError.set(null);
      }
    });
  }

  captureOccurrenceValidity(event: Event): void {
    const form = event.currentTarget as HTMLFormElement;
    this.nativeOccurrenceInvalid.set(
      Array.from(form.querySelectorAll<HTMLInputElement>('input[type="datetime-local"]')).some(
        (input) => !input.validity.valid,
      ),
    );
  }

  updateFilter(key: keyof SensitiveActivityFilters, value: string): void {
    if (
      ['ownerId', 'catId', 'stayFrom', 'stayTo', 'stayDateMatchMode'].includes(key) &&
      this.filters()[key] !== value
    )
      this.invalidateStay();
    this.filters.update((current) => ({ ...current, [key]: value }));

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
    const selectorsValid = [this.actorSelector(), this.ownerSelector(), this.catSelector()]
      .map((selector) => selector?.markSubmitted() ?? true)
      .every(Boolean);
    const datesValid = this.stayDates()?.validate() ?? this.stayDatesValid(this.filters());
    if (
      !selectorsValid ||
      !datesValid ||
      this.selectionConflict() ||
      this.eventCompatibilityInvalid()
    )
      return;
    const idsValid = this.validateIdFilters(this.filters());
    const occurredFromBadInput = form?.controls['occurredFrom']?.hasError('badInput') ?? false;
    const occurredToBadInput = form?.controls['occurredTo']?.hasError('badInput') ?? false;
    this.nativeOccurrenceInvalid.set(occurredFromBadInput || occurredToBadInput);
    const occurredFrom = this.resolveAppliedInstant('occurredFrom');
    const occurredTo = this.resolveAppliedInstant('occurredTo');
    const occurredFromError = occurredFromBadInput ? 'invalidDateTime' : occurredFrom.error;
    const occurredToError = occurredToBadInput ? 'invalidDateTime' : occurredTo.error;
    this.setFilterError('occurredFrom', occurredFromError);
    this.setFilterError('occurredTo', occurredToError);
    if (!idsValid || occurredFromError || occurredToError) return;
    const appliedFilters: SensitiveActivityFilters = {
      ...this.filters(),
      stayDateMatchMode:
        this.filters().stayFrom || this.filters().stayTo
          ? (this.filters().stayDateMatchMode ?? 'OVERLAPS')
          : undefined,
      occurredFrom: occurredFrom.instant ?? '',
      occurredTo: occurredTo.instant ?? '',
    };
    if (!this.validateAppliedPeriod(appliedFilters)) return;
    if (this.filterKey(appliedFilters) === this.filterKey(this.appliedFilters())) {
      this.refresh();
      return;
    }
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
      !(applied.ownerId && applied.catId) &&
      !this.incompatibleEvent(applied)
    ) {
      this.load(this.page());
    }
  }

  clearFilters(): void {
    this.invalidateStay();
    this.nativeOccurrenceInvalid.set(false);
    this.advancedExpanded.set(false);
    this.initializingSelectors = true;
    this.actorSelector()?.reset();
    this.ownerSelector()?.reset();
    this.catSelector()?.reset();
    this.initializingSelectors = false;
    this.stayDates()?.clear();
    this.advancedExpanded.set(false);
    this.unresolvedSelectors.set({ actorId: false, ownerId: false, catId: false });
    this.selectionConflict.set(false);
    this.filters.set({ ...EMPTY_SENSITIVE_ACTIVITY_FILTERS });
    this.clearFilterErrors();
    this.editedTemporalFilters.clear();
    this.router.navigate([], { relativeTo: this.route, queryParams: {} });
  }

  selectorChanged(key: 'actorId' | 'ownerId' | 'catId', state: EntityLookupState<unknown>): void {
    if (this.initializingSelectors) return;
    this.unresolvedSelectors.update((current) => ({
      ...current,
      [key]: state.rawContentPresent && !state.selectedId,
    }));
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
      (!(filters.stayFrom || filters.stayTo) ||
        DATE_MATCH_MODES.includes(filters.stayDateMatchMode ?? 'OVERLAPS')) &&
      valid(filters.stayFrom) &&
      valid(filters.stayTo) &&
      !(filters.stayFrom && filters.stayTo && filters.stayFrom > filters.stayTo)
    );
  }

  canFindStay(): boolean {
    const f = this.filters();
    // Invalid submitted values stay actionable so the shared fields can show their own errors.
    return !!(
      f.ownerId ||
      f.catId ||
      f.stayFrom ||
      f.stayTo ||
      this.unresolvedSelectors().ownerId ||
      this.unresolvedSelectors().catId ||
      Object.values(this.stayDates()?.dateStates() ?? {}).some((state) => state !== 'EMPTY')
    );
  }

  updateStayDates(dates: StayDateFilters): void {
    this.advancedExpanded.set(true);
    this.invalidateStay();
    this.filters.update((f) => ({
      ...f,
      stayFrom: dates.dateFrom ?? '',
      stayTo: dates.dateTo ?? '',
      stayDateMatchMode:
        dates.dateFrom || dates.dateTo ? (dates.dateMatchMode ?? 'OVERLAPS') : undefined,
    }));
  }

  selectedEventLabel(): string {
    const type = this.filters().eventType;
    return type
      ? this.text().sensitiveActivity.events[type]
      : this.text().sensitiveActivity.filters.allTypes;
  }

  eventSupportingText(type: SensitiveActivityFilters['eventType']): string | undefined {
    const help: Partial<Record<SensitiveActivityFilters['eventType'], string>> =
      this.text().sensitiveActivity.eventHelp;
    return help[type];
  }

  advancedToggled(event: Event): void {
    this.advancedExpanded.set((event.target as HTMLDetailsElement).open);
  }

  private stayPredicatePresent(f: SensitiveActivityFilters): boolean {
    return Boolean(f.ownerId || f.catId || f.stayId || f.stayFrom || f.stayTo);
  }

  private incompatibleEvent(f: SensitiveActivityFilters): boolean {
    return f.eventType === 'NIGHTLY_RATE_CHANGED' && this.stayPredicatePresent(f);
  }

  private narrativeState():
    | { kind: 'ready'; snapshot: ActivitySummarySnapshot }
    | { kind: 'preparing' | 'transient' | 'invalid' } {
    const f = this.filters();
    if (this.incompatibleEvent(f) || this.selectionConflict() || !this.idFiltersValid(f))
      return { kind: 'invalid' };
    if (
      this.nativeOccurrenceInvalid() ||
      Object.values(this.unresolvedSelectors()).some(Boolean) ||
      Object.values(this.stayDates()?.dateStates() ?? {}).some(
        (state) => state === 'EDITING' || state === 'INVALID',
      )
    )
      return { kind: 'transient' };
    const from = this.resolveAppliedInstant('occurredFrom'),
      to = this.resolveAppliedInstant('occurredTo');
    if (from.error || to.error || !this.stayDatesValid(f)) return { kind: 'transient' };
    const effective = { ...f, occurredFrom: from.instant ?? '', occurredTo: to.instant ?? '' };
    if (!this.temporalFiltersValid(effective) || this.periodInvalid(effective))
      return { kind: 'invalid' };
    let preparing = false;
    const resolve = <T>(
      id: string,
      selector: RemoteEntitySelector<T> | undefined,
      name: (value: T) => string,
    ): string | null | undefined => {
      if (!id) return undefined;
      const value = selector?.value();
      if (value && selector?.selectedId() === id) return name(value);
      if (!selector || this.initializedRoute() !== this.routeVersion() || selector.loading())
        preparing = true;
      return null;
    };
    const actor = resolve(f.actorId, this.actorSelector(), (value) => value.username);
    const owner = resolve(f.ownerId, this.ownerSelector(), (value) => value.fullName);
    const cat = resolve(f.catId, this.catSelector(), (value) => value.name);
    const stay = this.exactStay();
    if (f.stayId && (!stay || stay.stayId !== f.stayId) && !this.exactError()) preparing = true;
    if (preparing) return { kind: 'preparing' };
    return {
      kind: 'ready',
      snapshot: {
        pending: this.filterKey(effective) !== this.filterKey(this.appliedFilters()),
        eventType: f.eventType,
        actor,
        owner,
        cat,
        occurredFrom: effective.occurredFrom || undefined,
        occurredTo: effective.occurredTo || undefined,
        dates: { dateFrom: f.stayFrom, dateTo: f.stayTo, dateMatchMode: f.stayDateMatchMode },
        exactStay: f.stayId
          ? stay && stay.stayId === f.stayId
            ? {
                owner: stay.owner.fullName,
                cats: stay.cats.map((cat) => cat.name),
                startAt: stay.startAt,
                endAt: stay.endAt,
              }
            : null
          : undefined,
      },
    };
  }

  private filterKey(f: SensitiveActivityFilters): string {
    return JSON.stringify([
      f.actorId,
      f.ownerId,
      f.catId,
      f.stayId,
      f.eventType,
      f.occurredFrom ? Date.parse(f.occurredFrom) : null,
      f.occurredTo ? Date.parse(f.occurredTo) : null,
      f.stayFrom || '',
      f.stayTo || '',
      f.stayFrom || f.stayTo ? (f.stayDateMatchMode ?? 'OVERLAPS') : '',
    ]);
  }

  private stayCriteriaKey(f: SensitiveActivityFilters): string {
    return JSON.stringify([
      f.ownerId,
      f.catId,
      f.stayFrom || '',
      f.stayTo || '',
      f.stayDateMatchMode || 'OVERLAPS',
    ]);
  }

  findStay(page = 0, form?: NgForm): void {
    const selectorsValid = [this.ownerSelector(), this.catSelector()]
      .map((selector) => selector?.markSubmitted() ?? true)
      .every(Boolean);
    const datesValid = this.stayDates()?.validate() ?? this.stayDatesValid(this.filters());
    if (!selectorsValid || !datesValid || !this.canFindStay() || this.selectionConflict()) return;
    this.candidateRequest?.unsubscribe();
    const version = ++this.candidateVersion;
    const f = this.filters();
    this.candidateCriteria = this.stayCriteriaKey(f);
    this.advancedExpanded.set(true);
    this.candidatesExpanded.set(true);
    this.candidates.set([]);
    this.candidatePage.set(page);
    this.candidateLoading.set(true);
    this.candidateError.set(false);
    this.candidateRequest = this.accountAdapter
      .searchStays(
        {
          ownerId: f.ownerId,
          catId: f.catId,
          dateFrom: f.stayFrom,
          dateTo: f.stayTo,
          dateMatchMode: f.stayFrom || f.stayTo ? (f.stayDateMatchMode ?? 'OVERLAPS') : undefined,
        },
        page,
      )
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
    this.advancedExpanded.set(true);
    this.updateFilter('stayId', stay.stayId);
    this.candidatesExpanded.set(false);
  }

  changeStay(): void {
    if (this.canChangeStay()) {
      this.advancedExpanded.set(true);
      this.candidatesExpanded.set(true);
    }
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
    this.rejectedRoute.set(false);
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
