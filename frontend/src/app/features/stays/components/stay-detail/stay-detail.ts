import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { EntityReference } from '../../../../shared/entity-detail/entity-reference';
import { StayDetailResponse } from '../../../../shared/entity-detail/relationship.models';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { StayApiService } from '../../services/stay-api.service';

@Component({
  selector: 'app-stay-detail',
  imports: [MatButton, UiStateComponent],
  templateUrl: './stay-detail.html',
  styleUrl: '../../../../shared/entity-detail/entity-detail-presenter.scss',
})
export class StayDetail {
  private readonly api = inject(StayApiService);
  private generation = 0;
  readonly entityId = input.required<string>();
  readonly editing = input.required<boolean>();
  readonly editRequested = output<void>();
  readonly cancelRequested = output<void>();
  readonly saveCompleted = output<void>();
  readonly navigate = output<EntityReference>();
  readonly openCats = output<void>();
  readonly updated = output<string>();
  readonly text = inject(I18nService).text;
  readonly detail = signal<StayDetailResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  constructor() {
    inject(DestroyRef).onDestroy(() => this.generation++);
    effect(() => {
      this.entityId();
      this.load();
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
}
