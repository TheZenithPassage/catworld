import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent, MatCardHeader, MatCardTitle } from '@angular/material/card';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subscription } from 'rxjs';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
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

@Component({
  selector: 'app-sensitive-activity-page',
  imports: [
    FormsModule,
    MatButton,
    MatCard,
    MatCardContent,
    MatCardHeader,
    MatCardTitle,
    MatFormField,
    MatInput,
    MatLabel,
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
  readonly invalidPeriod = signal(false);
  readonly invalidBusinessDateTime = signal(false);
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
      if (this.validAppliedPeriod(appliedRouteFilters)) {
        this.load();
      } else {
        this.cancelLoad();
        this.events.set([]);
        this.loading.set(false);
        this.loadError.set(null);
      }
    });
  }

  updateFilter(key: keyof SensitiveActivityFilters, value: string): void {
    this.filters.update((current) => ({ ...current, [key]: value }));
    if (key === 'occurredFrom' || key === 'occurredTo') {
      this.editedTemporalFilters.add(key);
    }
    this.invalidPeriod.set(false);
    this.invalidBusinessDateTime.set(false);
  }

  applyFilters(): void {
    const occurredFrom = this.resolveAppliedInstant('occurredFrom');
    const occurredTo = this.resolveAppliedInstant('occurredTo');
    if (occurredFrom === null || occurredTo === null) {
      this.invalidBusinessDateTime.set(true);
      return;
    }
    this.invalidBusinessDateTime.set(false);
    const appliedFilters: SensitiveActivityFilters = {
      ...this.filters(),
      occurredFrom: occurredFrom ?? '',
      occurredTo: occurredTo ?? '',
    };
    if (!this.validAppliedPeriod(appliedFilters)) return;
    const queryParams = Object.fromEntries(
      Object.entries(appliedFilters).filter(([, value]) => Boolean(value)),
    );
    this.router.navigate([], { relativeTo: this.route, queryParams });
  }

  refresh(): void {
    if (this.validAppliedPeriod(this.appliedFilters())) this.load();
  }

  clearFilters(): void {
    this.filters.set({ ...EMPTY_SENSITIVE_ACTIVITY_FILTERS });
    this.invalidPeriod.set(false);
    this.invalidBusinessDateTime.set(false);
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

  private validAppliedPeriod(filters: SensitiveActivityFilters): boolean {
    const { occurredFrom, occurredTo } = filters;
    const invalid = Boolean(
      occurredFrom && occurredTo && Date.parse(occurredFrom) >= Date.parse(occurredTo),
    );
    this.invalidPeriod.set(invalid);
    if (invalid) setTimeout(() => document.getElementById('sensitive-occurred-from')?.focus());
    return !invalid;
  }

  private toLocalDateTime(value: string): string {
    if (!value) return '';
    try {
      return this.businessTime.instantToLocalDateTime(value);
    } catch {
      return '';
    }
  }

  private resolveAppliedInstant(key: 'occurredFrom' | 'occurredTo'): string | undefined | null {
    if (!this.editedTemporalFilters.has(key)) {
      return this.appliedFilters()[key] || undefined;
    }
    const value = this.filters()[key];
    if (!value) return undefined;
    const resolution = this.businessTime.resolveLocalDateTime(value);
    return resolution.valid ? resolution.instant : null;
  }
}
