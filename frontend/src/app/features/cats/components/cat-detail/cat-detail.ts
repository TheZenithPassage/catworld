import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { formatLocalDate } from '../../../../shared/date/local-date-format';
import { Cat } from '../../models/cat.model';
import { CatDetailResponse } from '../../../../shared/entity-detail/relationship.models';
import { EntityReference } from '../../../../shared/entity-detail/entity-reference';
import { CatApiService } from '../../services/cat-api.service';
import { CatEditor } from '../cat-editor/cat-editor';
import { StayRelationshipLabel } from '../../../stays/components/stay-relationship-label/stay-relationship-label';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
@Component({
  selector: 'app-cat-detail',
  imports: [MatButton, MatProgressSpinner, UiStateComponent, CatEditor, StayRelationshipLabel],
  host: {
    '[attr.aria-busy]': 'loading()',
    '[attr.inert]': 'loading() && detail() ? "" : null',
  },
  templateUrl: './cat-detail.html',
  styleUrl: '../../../../shared/entity-detail/entity-detail-presenter.scss',
})
export class CatDetail {
  private readonly api = inject(CatApiService);
  private readonly i18n = inject(I18nService);
  private loadGeneration = 0;
  private loadedEntityId: string | null = null;
  readonly entityId = input.required<string>();
  readonly editing = input.required<boolean>();
  readonly editRequested = output<void>();
  readonly cancelRequested = output<void>();
  readonly saveCompleted = output<void>();
  readonly submittingChanged = output<boolean>();
  readonly deletionCompleted = output<EntityReference>();
  readonly refreshingChanged = output<boolean>();
  readonly contentSettled = output<void>();
  readonly navigate = output<EntityReference>();
  readonly openStays = output<void>();
  readonly openPhoto = output<{ catId: string; catName: string; ownerName: string }>();
  readonly text = this.i18n.text;
  readonly dateLocale = this.i18n.dateLocale;
  readonly detail = signal<CatDetailResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  constructor() {
    inject(DestroyRef).onDestroy(() => this.loadGeneration++);
    effect(() => {
      const entityId = this.entityId();
      if (this.loadedEntityId !== entityId) this.detail.set(null);
      this.load(entityId);
    });
  }
  load(entityId = this.entityId()): void {
    const generation = ++this.loadGeneration;
    const refreshing = this.loadedEntityId === entityId && this.detail() !== null;
    this.loading.set(true);
    this.refreshingChanged.emit(refreshing);
    this.error.set(false);
    this.api.getCatDetail(entityId).subscribe({
      next: (detail) => {
        if (generation !== this.loadGeneration || entityId !== this.entityId()) return;
        this.detail.set(detail);
        this.loadedEntityId = entityId;
        this.loading.set(false);
        this.refreshingChanged.emit(false);
        this.contentSettled.emit();
      },
      error: () => {
        if (generation !== this.loadGeneration || entityId !== this.entityId()) return;
        this.error.set(true);
        this.loading.set(false);
        this.refreshingChanged.emit(false);
        this.contentSettled.emit();
      },
    });
  }
  saved(c: Cat): void {
    this.saveCompleted.emit();
    this.load();
  }
  value(v: string | null): string {
    return v || this.text().cats.emptyValue;
  }
  date(v: string | null): string {
    return v ? formatLocalDate(v, this.dateLocale()) : this.text().cats.emptyValue;
  }
}
