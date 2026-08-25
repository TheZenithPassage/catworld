import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { Vet } from '../../models/vet.model';
import { VetDetailResponse } from '../../../../shared/entity-detail/relationship.models';
import { EntityReference } from '../../../../shared/entity-detail/entity-reference';
import { VetApiService } from '../../services/vet-api.service';
import { VetEditor } from '../vet-editor/vet-editor';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
@Component({
  selector: 'app-vet-detail',
  imports: [MatButton, MatProgressSpinner, UiStateComponent, VetEditor],
  host: {
    '[attr.aria-busy]': 'loading()',
    '[attr.inert]': 'loading() && detail() ? "" : null',
  },
  template: `@if (loading() && !detail()) {
      <div
        class="detail-loading-region"
        role="status"
        [attr.aria-label]="text().vets.detail.loading"
      >
        <mat-progress-spinner mode="indeterminate" diameter="40" />
      </div>
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
          (submittingChanged)="submittingChanged.emit($event)"
        />
      } @else {
        <dl class="detail-fields">
          <div class="detail-field">
            <dt>{{ text().vets.form.name }}</dt>
            <dd>{{ vet.name }}</dd>
          </div>
          <div class="detail-field">
            <dt>{{ text().vets.form.phoneNumber }}</dt>
            <dd>{{ value(vet.phoneNumber) }}</dd>
          </div>
          <div class="detail-field">
            <dt>{{ text().vets.form.address }}</dt>
            <dd>{{ value(vet.address) }}</dd>
          </div>
        </dl>
        @if (detail.cats.totalElements > 0) {
          <section class="relationship-group">
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
        <div class="detail-actions">
          <button mat-flat-button type="button" (click)="editRequested.emit()">
            {{ text().vets.detail.edit }}
          </button>
        </div>
      }
    }`,
  styleUrl: '../../../../shared/entity-detail/entity-detail-presenter.scss',
})
export class VetDetail {
  private readonly api = inject(VetApiService);
  private readonly i18n = inject(I18nService);
  private loadGeneration = 0;
  private loadedEntityId: string | null = null;
  readonly entityId = input.required<string>();
  readonly editing = input.required<boolean>();
  readonly editRequested = output<void>();
  readonly cancelRequested = output<void>();
  readonly saveCompleted = output<void>();
  readonly submittingChanged = output<boolean>();
  readonly refreshingChanged = output<boolean>();
  readonly contentSettled = output<void>();
  readonly navigate = output<EntityReference>();
  readonly openCats = output<void>();
  readonly text = this.i18n.text;
  readonly detail = signal<VetDetailResponse | null>(null);
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
    this.api.getVetDetail(entityId).subscribe({
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
  saved(v: Vet): void {
    this.saveCompleted.emit();
    this.load();
  }
  value(v: string | null): string {
    return v || this.text().vets.emptyValue;
  }
}
