import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { RouterLink } from '@angular/router';
import { filter, fromEvent, Subscription } from 'rxjs';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { API_BASE_URL } from '../../../../core/config/api.config';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { OPERATIONS_ARRIVALS_TRANSLATIONS } from '../../../../core/i18n/translations/operations-arrivals.translations';
import { BusinessTimeService } from '../../../../core/time/business-time.service';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import type { EntityType } from '../../../../shared/entity-detail/entity-reference';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import {
  CatIntakeInvitationDialog,
  CatIntakeInvitationDialogData,
} from '../../../cat-intake/cat-intake-invitation-dialog';
import type { VaccineConflictViolation } from '../../../stays/models/stay.model';
import { vaccineConflictLabels } from '../../../stays/models/vaccine-conflict-label';

type VaccineWarning = Pick<VaccineConflictViolation, 'vaccineType' | 'reason' | 'expiresOn'>;

interface ArrivalCat {
  id: string;
  name: string;
  foodBrand: string | null;
  litterBrand: string | null;
  vaccineWarnings: VaccineWarning[];
  pendingReviews?: { id: string; submittedAt: string }[] | null;
}

interface Arrival {
  id: string;
  startAt: string;
  endAt: string;
  owner: { id: string; fullName: string };
  cats: ArrivalCat[];
}

interface ArrivalFilters {
  daysAhead: string;
  includeStartedToday: boolean;
}

const FILTERS_STORAGE_KEY = 'catworld.arrivals.filters';
const DEFAULT_FILTERS: ArrivalFilters = { daysAhead: '7', includeStartedToday: true };
const NONNEGATIVE_INTEGER = /^[0-9]+$/;
const REFRESH_HEADER = 'X-Arrivals-Refresh-After-Ms';

@Component({
  selector: 'app-arrivals-page',
  imports: [MatButton, RouterLink, UiStateComponent],
  templateUrl: './arrivals-page.html',
  styleUrl: './arrivals-page.scss',
})
export class ArrivalsPage {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);
  private readonly businessTime = inject(BusinessTimeService);
  private readonly details = inject(EntityDetailDialogService);
  private readonly dialog = inject(MatDialog);
  private readonly auth = inject(AuthSessionService);
  private filters = this.readFilters();
  private request?: Subscription;
  private refreshTimer?: ReturnType<typeof setTimeout>;

  readonly copy = computed(() => OPERATIONS_ARRIVALS_TRANSLATIONS[this.i18n.language()]);
  readonly catForm = computed(() => this.i18n.text().cats.form);
  readonly isAdmin = computed(() => this.auth.hasRole('ADMIN'));
  readonly arrivals = signal<Arrival[]>([]);
  readonly state = signal<'loading' | 'error' | 'ready'>('loading');
  readonly daysAhead = signal(this.filters.daysAhead);
  readonly invalidDaysAhead = computed(() => !NONNEGATIVE_INTEGER.test(this.daysAhead()));
  readonly includeStartedToday = signal(this.filters.includeStartedToday);

  constructor() {
    this.loadArrivals();
    this.destroyRef.onDestroy(() => clearTimeout(this.refreshTimer));
    fromEvent(this.document, 'visibilitychange')
      .pipe(
        filter(() => this.document.visibilityState === 'visible'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.loadArrivals(false));
  }

  loadArrivals(showLoading = true): void {
    clearTimeout(this.refreshTimer);
    this.request?.unsubscribe();
    if (showLoading) this.state.set('loading');
    this.request = this.http
      .get<Arrival[]>(`${API_BASE_URL}/operations/arrivals`, {
        observe: 'response',
        params: { ...this.filters },
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.arrivals.set(response.body ?? []);
          this.state.set('ready');
          const delay = Number(response.headers.get(REFRESH_HEADER));
          if (Number.isFinite(delay) && delay > 0) {
            this.refreshTimer = setTimeout(() => this.loadArrivals(false), delay);
          }
        },
        error: () => this.state.set('error'),
      });
  }

  changeDaysAhead(value: string): void {
    this.daysAhead.set(value);
    if (this.invalidDaysAhead() || value === this.filters.daysAhead) return;
    this.updateFilters({ ...this.filters, daysAhead: value });
  }

  changeIncludeStartedToday(value: boolean): void {
    this.includeStartedToday.set(value);
    this.updateFilters({ ...this.filters, includeStartedToday: value });
  }

  openDetail(entityType: EntityType, entityId: string): void {
    this.details
      .open({ entityType, entityId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadArrivals());
  }

  openInvitation(stay: Arrival): void {
    if (!this.isAdmin()) return;
    this.dialog.open(CatIntakeInvitationDialog, {
      data: {
        ownerId: stay.owner.id,
        ownerName: stay.owner.fullName,
        stayId: stay.id,
      } satisfies CatIntakeInvitationDialogData,
      width: '32rem',
      maxWidth: '95vw',
    });
  }

  hasPendingPreparation(stay: Arrival): boolean {
    const isAdmin = this.isAdmin();
    return stay.cats.some(
      (cat) =>
        !cat.foodBrand?.trim() ||
        !cat.litterBrand?.trim() ||
        cat.vaccineWarnings.length > 0 ||
        (isAdmin && !!cat.pendingReviews?.length),
    );
  }

  formatLocalDateTime(value: string): string {
    return this.businessTime.formatLocalDateTime(value, this.i18n.dateLocale());
  }

  formatInstant(value: string): string {
    return this.businessTime.formatInstant(value, this.i18n.dateLocale());
  }

  vaccineWarning(warning: VaccineWarning): string {
    const { vaccine, reason } = vaccineConflictLabels(
      warning,
      this.i18n.text().stays.vaccineConflict,
      this.i18n.dateLocale(),
    );
    return `${vaccine} · ${reason}`;
  }

  private readFilters(): ArrivalFilters {
    try {
      const stored: Partial<ArrivalFilters> | null = JSON.parse(
        this.document.defaultView?.localStorage.getItem(FILTERS_STORAGE_KEY) ?? 'null',
      );
      return {
        daysAhead:
          typeof stored?.daysAhead === 'string' && NONNEGATIVE_INTEGER.test(stored.daysAhead)
            ? stored.daysAhead
            : DEFAULT_FILTERS.daysAhead,
        includeStartedToday: stored?.includeStartedToday !== false,
      };
    } catch {
      return DEFAULT_FILTERS;
    }
  }

  private updateFilters(filters: ArrivalFilters): void {
    this.filters = filters;
    try {
      this.document.defaultView?.localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(filters));
    } catch {
      // The selection still applies when browser storage is unavailable.
    }
    this.loadArrivals();
  }
}
