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
  readonly openStays = output<void>();
  readonly openPhoto = output<{ catId: string; catName: string; ownerName: string }>();
  readonly text = this.i18n.text;
  readonly dateLocale = this.i18n.dateLocale;
  readonly detail = signal<CatDetailResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly deleting = signal(false);
  readonly deletionError = signal<string | null>(null);
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
  canDelete(detail: CatDetailResponse): boolean {
    return detail.cat.id === this.entityId() && detail.cat.canDelete === true;
  }
  confirmPermanentDeletion(detail: CatDetailResponse): void {
    if (this.deleting() || !this.canDelete(detail)) return;
    const cat = detail.cat;
    this.dialog
      .open<PermanentDeletionConfirmationDialog, PermanentDeletionConfirmationDialogData>(
        PermanentDeletionConfirmationDialog,
        {
          data: { subject: `${cat.name} — ${cat.ownerName}` },
          width: '34rem',
          maxWidth: 'calc(100vw - 2rem)',
        },
      )
      .afterClosed()
      .pipe(filter(isPermanentDeletionConfirmed))
      .subscribe(() => this.deletePermanently(cat.id));
  }
  private deletePermanently(catId: string): void {
    if (this.deleting() || catId !== this.entityId()) return;
    const generation = ++this.deletionGeneration;
    this.deleting.set(true);
    this.deletionError.set(null);
    this.submittingChanged.emit(true);
    this.api.deleteCat(catId).subscribe({
      next: () => this.completeDeletion(generation, catId),
      error: (error: unknown) => {
        if (generation !== this.deletionGeneration || catId !== this.entityId()) return;
        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.completeDeletion(generation, catId);
          return;
        }
        this.deleting.set(false);
        this.submittingChanged.emit(false);
        this.deletionError.set(deletionErrorMessage(error, this.text().deletion));
      },
    });
  }
  private completeDeletion(generation: number, catId: string): void {
    if (generation !== this.deletionGeneration || catId !== this.entityId()) return;
    this.deleting.set(false);
    this.submittingChanged.emit(false);
    this.deletionCompleted.emit({ entityType: 'cat', entityId: catId });
  }
  value(v: string | null): string {
    return v || this.text().cats.emptyValue;
  }
  date(v: string | null): string {
    return v ? formatLocalDate(v, this.dateLocale()) : this.text().cats.emptyValue;
  }
}
