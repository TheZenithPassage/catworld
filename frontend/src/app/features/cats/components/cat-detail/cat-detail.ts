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
@Component({
  selector: 'app-cat-detail',
  imports: [MatButton, UiStateComponent, CatEditor, StayRelationshipLabel],
  templateUrl: './cat-detail.html',
  styleUrl: '../../../../shared/entity-detail/entity-detail-presenter.scss',
})
export class CatDetail {
  private readonly api = inject(CatApiService);
  private readonly i18n = inject(I18nService);
  private loadGeneration = 0;
  readonly entityId = input.required<string>();
  readonly editing = input.required<boolean>();
  readonly editRequested = output<void>();
  readonly cancelRequested = output<void>();
  readonly saveCompleted = output<void>();
  readonly submittingChanged = output<boolean>();
  readonly navigate = output<EntityReference>();
  readonly openStays = output<void>();
  readonly text = this.i18n.text;
  readonly dateLocale = this.i18n.dateLocale;
  readonly detail = signal<CatDetailResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  constructor() {
    inject(DestroyRef).onDestroy(() => this.loadGeneration++);
    effect(() => {
      this.entityId();
      this.load();
    });
  }
  load(): void {
    const generation = ++this.loadGeneration;
    const entityId = this.entityId();
    this.loading.set(true);
    this.error.set(false);
    this.api.getCatDetail(entityId).subscribe({
      next: (detail) => {
        if (generation !== this.loadGeneration || entityId !== this.entityId()) return;
        this.detail.set(detail);
        this.loading.set(false);
      },
      error: () => {
        if (generation !== this.loadGeneration || entityId !== this.entityId()) return;
        this.error.set(true);
        this.loading.set(false);
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
