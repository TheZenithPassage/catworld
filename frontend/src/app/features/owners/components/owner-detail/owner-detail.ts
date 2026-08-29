import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { Owner } from '../../models/owner.model';
import { OwnerDetailResponse } from '../../../../shared/entity-detail/relationship.models';
import { EntityReference } from '../../../../shared/entity-detail/entity-reference';
import { OwnerApiService } from '../../services/owner-api.service';
import { OwnerEditor } from '../owner-editor/owner-editor';
import { StayRelationshipLabel } from '../../../stays/components/stay-relationship-label/stay-relationship-label';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import {
  PermanentDeletionConfirmationDialog,
  PermanentDeletionConfirmationDialogData,
  isPermanentDeletionConfirmed,
} from '../../../../shared/permanent-deletion/permanent-deletion-confirmation-dialog';
import { deletionErrorMessage } from '../../../../shared/permanent-deletion/deletion-error';
@Component({
  selector: 'app-owner-detail',
  imports: [MatButton, MatProgressSpinner, UiStateComponent, OwnerEditor, StayRelationshipLabel],
  host: {
    '[attr.aria-busy]': 'loading()',
    '[attr.inert]': 'loading() && detail() ? "" : null',
  },
  template: `@if (loading() && !detail()) {
      <div
        class="detail-loading-region"
        role="status"
        [attr.aria-label]="text().owners.detail.loading"
      >
        <mat-progress-spinner mode="indeterminate" diameter="40" />
      </div>
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
        <dl class="detail-fields">
          <div class="detail-field">
            <dt>{{ text().owners.form.fullName }}</dt>
            <dd>{{ owner.fullName }}</dd>
          </div>
          <div class="detail-field">
            <dt>{{ text().owners.form.primaryPhone }}</dt>
            <dd>{{ owner.primaryPhone }}</dd>
          </div>
          <div class="detail-field">
            <dt>{{ text().owners.form.address }}</dt>
            <dd>{{ value(owner.address) }}</dd>
          </div>
          <div class="detail-field">
            <dt>{{ text().owners.form.secondaryPhone }}</dt>
            <dd>{{ value(owner.secondaryPhone) }}</dd>
          </div>
          <div class="detail-field">
            <dt>{{ text().owners.form.secondaryPhoneName }}</dt>
            <dd>{{ value(owner.secondaryPhoneName) }}</dd>
          </div>
          <div class="detail-field">
            <dt>{{ text().owners.form.instagram }}</dt>
            <dd>{{ value(owner.instagram) }}</dd>
          </div>
          <div class="detail-field">
            <dt>{{ text().owners.form.facebook }}</dt>
            <dd>{{ value(owner.facebook) }}</dd>
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
                  [disabled]="deleting()"
                  (click)="navigate.emit({ entityType: 'cat', entityId: cat.id })"
                >
                  {{ cat.name }} — {{ cat.ownerName }}
                </button>
              }
            } @else {
              <button mat-button type="button" [disabled]="deleting()" (click)="openCats.emit()">
                {{ text().entityDetail.associatedRecords(detail.cats.totalElements) }}
              </button>
            }
          </section>
        }
        @if (detail.stays.totalElements > 0) {
          <section class="relationship-group">
            <h3>{{ text().entityDetail.stays }}</h3>
            @if (detail.stays.totalElements <= 3) {
              @for (stay of detail.stays.items; track stay.stayId) {
                <button
                  mat-button
                  type="button"
                  [disabled]="deleting()"
                  (click)="navigate.emit({ entityType: 'stay', entityId: stay.stayId })"
                >
                  <app-stay-relationship-label [item]="stay" />
                </button>
              }
            } @else {
              <button mat-button type="button" [disabled]="deleting()" (click)="openStays.emit()">
                {{ text().entityDetail.associatedRecords(detail.stays.totalElements) }}
              </button>
            }
          </section>
        }
        @if (deletionError(); as message) {
          <p class="detail-error" role="alert">{{ message }}</p>
        }
        <div class="detail-actions">
          <div class="detail-actions-start">
            @if (owner.canDelete === true) {
              <button
                class="permanent-delete-action"
                mat-stroked-button
                type="button"
                [disabled]="deleting()"
                (click)="confirmPermanentDeletion(owner)"
              >
                {{
                  deleting()
                    ? text().deletion.actions.deleting
                    : text().deletion.actions.deletePermanently
                }}
              </button>
            }
          </div>
          <div class="detail-actions-end">
            <button
              mat-flat-button
              type="button"
              [disabled]="deleting()"
              (click)="editRequested.emit()"
            >
              {{ text().owners.detail.edit }}
            </button>
          </div>
        </div>
      }
    }`,
  styleUrl: '../../../../shared/entity-detail/entity-detail-presenter.scss',
})
export class OwnerDetail {
  private readonly api = inject(OwnerApiService);
  private readonly i18n = inject(I18nService);
  private readonly dialog = inject(MatDialog);
  private loadGeneration = 0;
  private deletionGeneration = 0;
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
  readonly openCats = output<void>();
  readonly openStays = output<void>();
  readonly text = this.i18n.text;
  readonly detail = signal<OwnerDetailResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly deleting = signal(false);
  readonly deletionError = createLanguageResetError(this.i18n.language);
  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.loadGeneration++;
      this.deletionGeneration++;
    });
    effect(() => {
      const entityId = this.entityId();
      if (this.loadedEntityId !== entityId) this.detail.set(null);
      this.load(entityId);
    });
  }
  confirmPermanentDeletion(owner: Owner): void {
    if (this.deleting() || owner.id !== this.entityId() || owner.canDelete !== true) return;
    this.dialog
      .open<PermanentDeletionConfirmationDialog, PermanentDeletionConfirmationDialogData>(
        PermanentDeletionConfirmationDialog,
        {
          data: { subject: owner.fullName },
          width: '34rem',
          maxWidth: 'calc(100vw - 2rem)',
        },
      )
      .afterClosed()
      .pipe(filter(isPermanentDeletionConfirmed))
      .subscribe(() => this.deletePermanently(owner.id));
  }
  private deletePermanently(ownerId: string): void {
    if (this.deleting() || ownerId !== this.entityId()) return;
    const generation = ++this.deletionGeneration;
    this.deleting.set(true);
    this.deletionError.set(null);
    this.submittingChanged.emit(true);
    this.api.deleteOwner(ownerId).subscribe({
      next: () => this.completeDeletion(generation, ownerId),
      error: (error: unknown) => {
        if (generation !== this.deletionGeneration || ownerId !== this.entityId()) return;
        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.completeDeletion(generation, ownerId);
          return;
        }
        this.deleting.set(false);
        this.submittingChanged.emit(false);
        this.deletionError.set(deletionErrorMessage(error, this.text().deletion));
      },
    });
  }
  private completeDeletion(generation: number, ownerId: string): void {
    if (generation !== this.deletionGeneration || ownerId !== this.entityId()) return;
    this.deleting.set(false);
    this.submittingChanged.emit(false);
    this.deletionCompleted.emit({ entityType: 'owner', entityId: ownerId });
  }
  load(entityId = this.entityId()): void {
    const generation = ++this.loadGeneration;
    const refreshing = this.loadedEntityId === entityId && this.detail() !== null;
    this.loading.set(true);
    this.refreshingChanged.emit(refreshing);
    this.error.set(false);
    this.api.getOwnerDetail(entityId).subscribe({
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
  saved(o: Owner): void {
    this.saveCompleted.emit();
    this.load();
  }
  value(v: string | null): string {
    return v || this.text().owners.emptyValue;
  }
}
