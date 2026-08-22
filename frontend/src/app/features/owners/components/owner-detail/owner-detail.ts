import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { Owner } from '../../models/owner.model';
import { OwnerDetailResponse } from '../../../../shared/entity-detail/relationship.models';
import { EntityReference } from '../../../../shared/entity-detail/entity-reference';
import { OwnerApiService } from '../../services/owner-api.service';
import { OwnerEditor } from '../owner-editor/owner-editor';
import { StayRelationshipLabel } from '../../../stays/components/stay-relationship-label/stay-relationship-label';
@Component({
  selector: 'app-owner-detail',
  imports: [MatButton, UiStateComponent, OwnerEditor, StayRelationshipLabel],
  template: `@if (loading()) {
      <app-ui-state kind="loading" [message]="text().owners.detail.loading" />
    } @else if (error()) {
      <app-ui-state
        kind="error"
        [message]="text().owners.detail.loadFailed"
        [actionLabel]="text().owners.detail.retry"
        (actionTriggered)="load()"
      />
    } @else if (detail(); as detail) {
      @let owner = detail.owner;
      @if (editing()) {
        <app-owner-editor
          [entityId]="entityId()"
          [entity]="owner"
          (saved)="saved($event)"
          (cancelled)="cancelRequested.emit()"
          (submittingChanged)="submittingChanged.emit($event)"
        />
      } @else {
        <dl>
          <dt>{{ text().owners.form.fullName }}</dt>
          <dd>{{ owner.fullName }}</dd>
          <dt>{{ text().owners.form.primaryPhone }}</dt>
          <dd>{{ owner.primaryPhone }}</dd>
          <dt>{{ text().owners.form.address }}</dt>
          <dd>{{ value(owner.address) }}</dd>
          <dt>{{ text().owners.form.secondaryPhone }}</dt>
          <dd>{{ value(owner.secondaryPhone) }}</dd>
          <dt>{{ text().owners.form.secondaryPhoneName }}</dt>
          <dd>{{ value(owner.secondaryPhoneName) }}</dd>
          <dt>{{ text().owners.form.instagram }}</dt>
          <dd>{{ value(owner.instagram) }}</dd>
          <dt>{{ text().owners.form.facebook }}</dt>
          <dd>{{ value(owner.facebook) }}</dd>
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
        @if (detail.stays.totalElements > 0) {
          <section>
            <h3>{{ text().entityDetail.stays }}</h3>
            @if (detail.stays.totalElements <= 3) {
              @for (stay of detail.stays.items; track stay.stayId) {
                <button
                  mat-button
                  type="button"
                  (click)="navigate.emit({ entityType: 'stay', entityId: stay.stayId })"
                >
                  <app-stay-relationship-label [item]="stay" />
                </button>
              }
            } @else {
              <button mat-button type="button" (click)="openStays.emit()">
                {{ text().entityDetail.associatedRecords(detail.stays.totalElements) }}
              </button>
            }
          </section>
        }
        <button mat-flat-button type="button" (click)="editRequested.emit()">
          {{ text().owners.detail.edit }}
        </button>
      }
    }`,
  styleUrl: '../../../../shared/entity-detail/entity-detail-presenter.scss',
})
export class OwnerDetail {
  private readonly api = inject(OwnerApiService);
  private readonly i18n = inject(I18nService);
  private loadGeneration = 0;
  readonly entityId = input.required<string>();
  readonly editing = input.required<boolean>();
  readonly editRequested = output<void>();
  readonly cancelRequested = output<void>();
  readonly saveCompleted = output<void>();
  readonly submittingChanged = output<boolean>();
  readonly navigate = output<EntityReference>();
  readonly openCats = output<void>();
  readonly openStays = output<void>();
  readonly text = this.i18n.text;
  readonly detail = signal<OwnerDetailResponse | null>(null);
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
    this.api.getOwnerDetail(entityId).subscribe({
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
  saved(o: Owner): void {
    this.saveCompleted.emit();
    this.load();
  }
  value(v: string | null): string {
    return v || this.text().owners.emptyValue;
  }
}
