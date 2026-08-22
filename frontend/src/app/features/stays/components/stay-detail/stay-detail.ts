import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { EntityReference } from '../../../../shared/entity-detail/entity-reference';
import { StayDetailResponse } from '../../../../shared/entity-detail/relationship.models';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { StayApiService } from '../../services/stay-api.service';
import { Stay } from '../../models/stay.model';
import { StayEditor } from '../stay-editor/stay-editor';
import { BusinessTimeService } from '../../../../core/time/business-time.service';

@Component({
  selector: 'app-stay-detail',
  imports: [MatButton, UiStateComponent, StayEditor],
  templateUrl: './stay-detail.html',
  styleUrl: '../../../../shared/entity-detail/entity-detail-presenter.scss',
})
export class StayDetail {
  private readonly api = inject(StayApiService);
  private readonly businessTime = inject(BusinessTimeService);
  private readonly i18n = inject(I18nService);
  private generation = 0;
  readonly entityId = input.required<string>();
  readonly editing = input.required<boolean>();
  readonly editRequested = output<void>();
  readonly cancelRequested = output<void>();
  readonly saveCompleted = output<void>();
  readonly navigate = output<EntityReference>();
  readonly openCats = output<void>();
  readonly updated = output<Stay>();
  readonly submittingChanged = output<boolean>();
  readonly text = this.i18n.text;
  readonly detail = signal<StayDetailResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly operationalStay = signal<Stay | null>(null);
  constructor() {
    inject(DestroyRef).onDestroy(() => this.generation++);
    effect(() => {
      this.entityId();
      this.load();
    });
    effect(() => {
      if (this.editing() && !this.operationalStay()) this.loadOperational();
    });
  }
  load(): void {
    const id = this.entityId();
    const generation = ++this.generation;
    this.loading.set(true);
    this.error.set(false);
    this.api.getStayDetail(id).subscribe({
      next: (detail) => {
        if (generation !== this.generation || id !== this.entityId()) return;
        this.detail.set(detail);
        this.loading.set(false);
      },
      error: () => {
        if (generation === this.generation) {
          this.error.set(true);
          this.loading.set(false);
        }
      },
    });
  }
  canEdit(detail: StayDetailResponse): boolean {
    return detail.status === 'RESERVED' || detail.status === 'CHECKED_IN';
  }
  date(value: string): string {
    return this.businessTime.formatLocalDateTime(value, this.i18n.dateLocale());
  }
  status(value: StayDetailResponse['status']): string {
    const key =
      value === 'RESERVED'
        ? 'reserved'
        : value === 'CHECKED_IN'
          ? 'checked-in'
          : value === 'CHECKED_OUT'
            ? 'checked-out'
            : 'cancelled';
    return this.text().stays.status[key];
  }
  loadOperational(): void {
    this.api.getStayById(this.entityId()).subscribe({
      next: (stay) => this.operationalStay.set(stay),
      error: () => this.error.set(true),
    });
  }
  saved(stay: Stay): void {
    this.operationalStay.set(null);
    this.updated.emit(stay);
    this.saveCompleted.emit();
    this.load();
  }
}
