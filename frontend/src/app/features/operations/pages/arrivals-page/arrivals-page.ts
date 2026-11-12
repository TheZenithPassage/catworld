import { HttpClient } from '@angular/common/http';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { API_BASE_URL } from '../../../../core/config/api.config';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { OPERATIONS_ARRIVALS_TRANSLATIONS } from '../../../../core/i18n/translations/operations-arrivals.translations';
import { BusinessTimeService } from '../../../../core/time/business-time.service';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import type { EntityType } from '../../../../shared/entity-detail/entity-reference';
import type { OwnerRelationshipItem } from '../../../../shared/entity-detail/relationship.models';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import type { VaccineConflictReason, VaccineType } from '../../../stays/models/stay.model';

interface VaccineWarning {
  vaccineType: VaccineType;
  reason: VaccineConflictReason;
}

interface ArrivalCat {
  id: string;
  name: string;
  foodBrand: string | null;
  litterBrand: string | null;
  vaccineWarnings: VaccineWarning[];
  pendingReviews?: { id: string; submittedAt: string }[];
}

interface Arrival {
  id: string;
  startAt: string;
  endAt: string;
  owner: OwnerRelationshipItem;
  cats: ArrivalCat[];
}

@Component({
  selector: 'app-arrivals-page',
  imports: [MatButton, RouterLink, UiStateComponent],
  templateUrl: './arrivals-page.html',
  styleUrl: './arrivals-page.scss',
})
export class ArrivalsPage {
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);
  private readonly businessTime = inject(BusinessTimeService);
  private readonly details = inject(EntityDetailDialogService);
  private request?: Subscription;

  readonly copy = computed(() => OPERATIONS_ARRIVALS_TRANSLATIONS[this.i18n.language()]);
  readonly catForm = computed(() => this.i18n.text().cats.form);
  readonly arrivals = signal<Arrival[]>([]);
  readonly state = signal<'loading' | 'error' | 'ready'>('loading');

  constructor() {
    this.loadArrivals();
  }

  loadArrivals(): void {
    this.request?.unsubscribe();
    this.state.set('loading');
    this.request = this.http
      .get<Arrival[]>(`${API_BASE_URL}/operations/arrivals`)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (arrivals) => {
          this.arrivals.set(arrivals);
          this.state.set('ready');
        },
        error: () => this.state.set('error'),
      });
  }

  openDetail(entityType: EntityType, entityId: string): void {
    this.details
      .open({ entityType, entityId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadArrivals());
  }

  formatLocalDateTime(value: string): string {
    return this.businessTime.formatLocalDateTime(value, this.i18n.dateLocale());
  }

  formatInstant(value: string): string {
    return this.businessTime.formatInstant(value, this.i18n.dateLocale());
  }

  vaccineWarning({ vaccineType, reason }: VaccineWarning): string {
    const copy = this.i18n.text().stays.vaccineConflict;
    const label = vaccineType === 'RABIES' ? copy.vaccine.rabies : copy.vaccine.tripleFeline;
    const message = reason === 'MISSING' ? copy.reason.missing : copy.reason.expired;
    return `${label} · ${message}`;
  }
}
