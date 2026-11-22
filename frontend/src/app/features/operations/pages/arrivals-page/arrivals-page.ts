import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
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
import { STAY_MOVEMENT_TRANSLATIONS } from '../../../stays/components/stay-movement-dialog/stay-movement.translations';
import type { VaccineConflictViolation } from '../../../stays/models/stay.model';
import { vaccineConflictLabels } from '../../../stays/models/vaccine-conflict-label';

type VaccineWarning = Pick<VaccineConflictViolation, 'vaccineType' | 'reason' | 'expiresOn'>;

interface UpcomingCat {
  id: string;
  name: string;
  foodBrand?: string | null;
  missingProfileFields?: string[];
  litterChoice?: 'OWN' | 'SHARED' | null;
  vaccineWarnings?: VaccineWarning[];
  pendingReviews?: { id: string; submittedAt: string }[] | null;
}

interface UpcomingStay {
  id: string;
  startAt: string;
  endAt: string;
  owner: { id: string; fullName: string };
  cats: UpcomingCat[];
  status: 'RESERVED' | 'CHECKED_IN';
  transferRequired: boolean;
  overdue: boolean;
  canRecord: boolean;
}

type MovementTab = 'arrivals' | 'departures';

const FILTERS_STORAGE_KEY = 'catworld.arrivals.filters';
const DEFAULT_DAYS_AHEAD = '7';
const NONNEGATIVE_INTEGER = /^[0-9]+$/;
const REFRESH_HEADER = 'X-Arrivals-Refresh-After-Ms';

@Component({
  selector: 'app-arrivals-page',
  imports: [MatButton, MatTabLink, MatTabNav, MatTabNavPanel, RouterLink, UiStateComponent],
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
  private appliedDaysAhead = this.readDaysAhead();
  private request?: Subscription;
  private refreshTimer?: ReturnType<typeof setTimeout>;

  readonly copy = computed(() => OPERATIONS_ARRIVALS_TRANSLATIONS[this.i18n.language()]);
  readonly movementCopy = computed(() => STAY_MOVEMENT_TRANSLATIONS[this.i18n.language()]);
  readonly catForm = computed(() => this.i18n.text().cats.form);
  readonly isAdmin = computed(() => this.auth.hasRole('ADMIN'));
  readonly tab = signal<MovementTab>('arrivals');
  readonly isArrivals = computed(() => this.tab() === 'arrivals');
  readonly recordAction = computed<'record-arrival' | 'record-departure'>(() =>
    this.isArrivals() ? 'record-arrival' : 'record-departure',
  );
  readonly stays = signal<UpcomingStay[]>([]);
  readonly state = signal<'loading' | 'error' | 'ready'>('loading');
  readonly daysAhead = signal(this.appliedDaysAhead);
  readonly invalidDaysAhead = computed(() => !NONNEGATIVE_INTEGER.test(this.daysAhead()));

  constructor() {
    this.loadMovements();
    this.destroyRef.onDestroy(() => clearTimeout(this.refreshTimer));
    fromEvent(this.document, 'visibilitychange')
      .pipe(
        filter(() => this.document.visibilityState === 'visible'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.loadMovements(false));
  }

  loadMovements(showLoading = true): void {
    clearTimeout(this.refreshTimer);
    this.request?.unsubscribe();
    if (showLoading) this.state.set('loading');
    this.request = this.http
      .get<UpcomingStay[]>(`${API_BASE_URL}/operations/${this.tab()}`, {
        observe: 'response',
        params: { daysAhead: this.appliedDaysAhead },
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          this.stays.set(response.body ?? []);
          this.state.set('ready');
          const delay = Number(response.headers.get(REFRESH_HEADER));
          if (Number.isFinite(delay) && delay > 0) {
            this.refreshTimer = setTimeout(() => this.loadMovements(false), delay);
          }
        },
        error: () => this.state.set('error'),
      });
  }

  changeDaysAhead(value: string): void {
    this.daysAhead.set(value);
    if (this.invalidDaysAhead() || value === this.appliedDaysAhead) return;
    this.appliedDaysAhead = value;
    try {
      this.document.defaultView?.localStorage.setItem(
        FILTERS_STORAGE_KEY,
        JSON.stringify({ daysAhead: value }),
      );
    } catch {
      // The selection still applies when browser storage is unavailable.
    }
    this.loadMovements();
  }

  changeTab(tab: MovementTab): void {
    if (this.tab() === tab) return;
    this.tab.set(tab);
    this.loadMovements();
  }

  openDetail(entityType: EntityType, entityId: string): void {
    this.details
      .open({ entityType, entityId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadMovements(false));
  }

  openMovement(stay: UpcomingStay): void {
    if (!stay.canRecord && !(stay.overdue && (this.isArrivals() || stay.status === 'CHECKED_IN'))) return;
    this.details
      .open({ entityType: 'stay', entityId: stay.id, initialMovement: this.recordAction() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadMovements(false));
  }

  openInvitation(stay: UpcomingStay): void {
    if (!this.isArrivals() || !this.isAdmin()) return;
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

  hasPendingPreparation(stay: UpcomingStay): boolean {
    return (
      this.isArrivals() &&
      stay.cats.some(
        (cat) =>
          this.hasPreparationWarnings(cat) || (this.isAdmin() && !!cat.pendingReviews?.length),
      )
    );
  }

  hasPreparationWarnings(cat: UpcomingCat): boolean {
    return !!this.missingProfileFields(cat).length || !!cat.vaccineWarnings?.length;
  }

  protected missingProfileFields(cat: UpcomingCat): string[] {
    return cat.missingProfileFields ?? [
      ...(!cat.foodBrand?.trim() ? ['foodBrand'] : []),
      ...(!cat.litterChoice ? ['litterBrand'] : []),
    ];
  }

  protected profileFieldLabel(key: string): string {
    const form = this.catForm();
    if (key === 'profilePhoto') return this.i18n.text().cats.photo.label;
    const label = form[key as keyof typeof form];
    return typeof label === 'string' ? label : key;
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

  private readDaysAhead(): string {
    try {
      const stored: { daysAhead?: string } | null = JSON.parse(
        this.document.defaultView?.localStorage.getItem(FILTERS_STORAGE_KEY) ?? 'null',
      );
      return typeof stored?.daysAhead === 'string' && NONNEGATIVE_INTEGER.test(stored.daysAhead)
        ? stored.daysAhead
        : DEFAULT_DAYS_AHEAD;
    } catch {
      return DEFAULT_DAYS_AHEAD;
    }
  }
}
