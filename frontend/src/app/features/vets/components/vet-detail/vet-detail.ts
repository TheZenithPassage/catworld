import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { Vet } from '../../models/vet.model';
import { VetDetailResponse } from '../../../../shared/entity-detail/relationship.models';
import { EntityReference } from '../../../../shared/entity-detail/entity-reference';
import { VetApiService } from '../../services/vet-api.service';
import { VetEditor } from '../vet-editor/vet-editor';
@Component({
  selector: 'app-vet-detail',
  imports: [MatButton, UiStateComponent, VetEditor],
  template: `@if (loading()) {
      <app-ui-state kind="loading" [message]="text().vets.detail.loading" />
    } @else if (error()) {
      <app-ui-state
        kind="error"
        [message]="text().vets.detail.loadFailed"
        [actionLabel]="text().vets.detail.retry"
        (actionTriggered)="load()"
      />
    } @else if (detail(); as detail) {
      @let vet = detail.vet;
      @if (editing()) {
        <app-vet-editor
          [entityId]="entityId()"
          [entity]="vet"
          (saved)="saved($event)"
          (cancelled)="cancelRequested.emit()"
        />
      } @else {
        <dl>
          <dt>{{ text().vets.form.name }}</dt>
          <dd>{{ vet.name }}</dd>
          <dt>{{ text().vets.form.phoneNumber }}</dt>
          <dd>{{ value(vet.phoneNumber) }}</dd>
          <dt>{{ text().vets.form.address }}</dt>
          <dd>{{ value(vet.address) }}</dd>
        </dl>
        @if (detail.cats.totalElements > 0) {
          <section>
            <h3>{{ text().entityDetail.cats }}</h3>
            @if (detail.cats.totalElements <= 3) {
              @for (cat of detail.cats.items; track cat.id) {
                <button
                  mat-button
                  type="button"
                  (click)="navigate.emit({ entityType: 'cat', entityId: cat.id })"
                >
                  {{ cat.name }} — {{ cat.ownerName }}
                </button>
              }
            } @else {
              <button mat-button type="button" (click)="openCats.emit()">
                {{ text().entityDetail.associatedRecords(detail.cats.totalElements) }}
              </button>
            }
          </section>
        }
        <button mat-flat-button type="button" (click)="editRequested.emit()">
          {{ text().vets.detail.edit }}
        </button>
      }
    }`,
  styleUrl: '../../../../shared/entity-detail/entity-detail-presenter.scss',
})
export class VetDetail {
  private readonly api = inject(VetApiService);
  private readonly i18n = inject(I18nService);
  private loadGeneration = 0;
  readonly entityId = input.required<string>();
  readonly editing = input.required<boolean>();
  readonly editRequested = output<void>();
  readonly cancelRequested = output<void>();
  readonly saveCompleted = output<void>();
  readonly navigate = output<EntityReference>();
  readonly openCats = output<void>();
  readonly text = this.i18n.text;
  readonly detail = signal<VetDetailResponse | null>(null);
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
    this.api.getVetDetail(entityId).subscribe({
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
  saved(v: Vet): void {
    this.saveCompleted.emit();
    this.load();
  }
  value(v: string | null): string {
    return v || this.text().vets.emptyValue;
  }
}
