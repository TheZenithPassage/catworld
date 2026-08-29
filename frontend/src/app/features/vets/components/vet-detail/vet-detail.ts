import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { Vet } from '../../models/vet.model';
import { VetDetailResponse } from '../../../../shared/entity-detail/relationship.models';
import { EntityReference } from '../../../../shared/entity-detail/entity-reference';
import { VetApiService } from '../../services/vet-api.service';
import { VetEditor } from '../vet-editor/vet-editor';
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
          <div class="detail-field">
            <dt>{{ text().vets.form.registrationNumber }}</dt>
            <dd>{{ value(vet.registrationNumber) }}</dd>
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
        @if (deletionError(); as message) {
          <p class="detail-error" role="alert">{{ message }}</p>
        }
        <div class="detail-actions">
          <div class="detail-actions-start">
            @if (vet.canDelete === true) {
              <button
                class="permanent-delete-action"
                mat-stroked-button
                type="button"
                [disabled]="deleting()"
                (click)="confirmPermanentDeletion(vet)"
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
              {{ text().vets.detail.edit }}
            </button>
          </div>
        </div>
      }
    }`,
  styleUrl: '../../../../shared/entity-detail/entity-detail-presenter.scss',
})
export class VetDetail {
  private readonly api = inject(VetApiService);
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
  readonly text = this.i18n.text;
  readonly detail = signal<VetDetailResponse | null>(null);
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
  confirmPermanentDeletion(vet: Vet): void {
    if (this.deleting() || vet.id !== this.entityId() || vet.canDelete !== true) return;
    this.dialog
      .open<PermanentDeletionConfirmationDialog, PermanentDeletionConfirmationDialogData>(
        PermanentDeletionConfirmationDialog,
        {
          data: { subject: vet.name },
          width: '34rem',
          maxWidth: 'calc(100vw - 2rem)',
        },
      )
      .afterClosed()
      .pipe(filter(isPermanentDeletionConfirmed))
      .subscribe(() => this.deletePermanently(vet.id));
  }
  private deletePermanently(vetId: string): void {
    if (this.deleting() || vetId !== this.entityId()) return;
    const generation = ++this.deletionGeneration;
    this.deleting.set(true);
    this.deletionError.set(null);
    this.submittingChanged.emit(true);
    this.api.deleteVet(vetId).subscribe({
      next: () => this.completeDeletion(generation, vetId),
      error: (error: unknown) => {
        if (generation !== this.deletionGeneration || vetId !== this.entityId()) return;
        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.completeDeletion(generation, vetId);
          return;
        }
        this.deleting.set(false);
        this.submittingChanged.emit(false);
        this.deletionError.set(deletionErrorMessage(error, this.text().deletion));
      },
    });
  }
  private completeDeletion(generation: number, vetId: string): void {
    if (generation !== this.deletionGeneration || vetId !== this.entityId()) return;
    this.deleting.set(false);
    this.submittingChanged.emit(false);
    this.deletionCompleted.emit({ entityType: 'vet', entityId: vetId });
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
