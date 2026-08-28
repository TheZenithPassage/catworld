import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  EntityDetailUpdate,
  EntityReference,
} from '../../../../shared/entity-detail/entity-reference';
import { StayDetailResponse } from '../../../../shared/entity-detail/relationship.models';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { StayApiService } from '../../services/stay-api.service';
import { Stay } from '../../models/stay.model';
import { StayEditor } from '../stay-editor/stay-editor';
import { BusinessTimeService } from '../../../../core/time/business-time.service';
import { MatDialog } from '@angular/material/dialog';
import { filter } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import {
  StayCancellationDialog,
  StayCancellationDialogData,
} from '../stay-cancellation-dialog/stay-cancellation-dialog';
import {
  PermanentDeletionConfirmationDialog,
  PermanentDeletionConfirmationDialogData,
  isPermanentDeletionConfirmed,
} from '../../../../shared/permanent-deletion/permanent-deletion-confirmation-dialog';
import { deletionErrorMessage } from '../../../../shared/permanent-deletion/deletion-error';

@Component({
  selector: 'app-stay-detail',
  imports: [MatButton, MatProgressSpinner, UiStateComponent, StayEditor],
  host: {
    '[attr.aria-busy]': 'loading() || operationalLoading()',
    '[attr.inert]': 'loading() && detail() ? "" : null',
  },
  templateUrl: './stay-detail.html',
  styleUrl: '../../../../shared/entity-detail/entity-detail-presenter.scss',
})
export class StayDetail {
  private readonly api = inject(StayApiService);
  private readonly businessTime = inject(BusinessTimeService);
  private readonly i18n = inject(I18nService);
  private readonly dialog = inject(MatDialog);
  private detailGeneration = 0;
  private operationalGeneration = 0;
  private pricingGeneration = 0;
  private cancellationContextGeneration = 0;
  private deletionGeneration = 0;
  private loadedEntityId: string | null = null;
  readonly entityId = input.required<string>();
  readonly editing = input.required<boolean>();
  readonly editRequested = output<void>();
  readonly cancelRequested = output<void>();
  readonly saveCompleted = output<void>();
  readonly navigate = output<EntityReference>();
  readonly openCats = output<void>();
  readonly updated = output<EntityDetailUpdate>();
  readonly pricingRequested = output<void>();
  readonly submittingChanged = output<boolean>();
  readonly deletionCompleted = output<EntityReference>();
  readonly refreshingChanged = output<boolean>();
  readonly contentSettled = output<void>();
  readonly text = this.i18n.text;
  readonly detail = signal<StayDetailResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly operationalStay = signal<Stay | null>(null);
  readonly operationalLoading = signal(false);
  readonly operationalError = signal(false);
  readonly pricingStay = signal<Stay | null>(null);
  readonly cancellationContextLoading = signal(false);
  readonly cancellationContextError = signal(false);
  readonly deleting = signal(false);
  readonly deletionError = signal<string | null>(null);
  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.detailGeneration++;
      this.pricingGeneration++;
      this.invalidateCancellationContext();
      this.invalidateOperational();
      this.deletionGeneration++;
    });
    effect(() => {
      const id = this.entityId();
      this.invalidateOperational();
      this.invalidateCancellationContext();
      if (this.loadedEntityId !== id) this.detail.set(null);
      this.load(id);
    });
    effect(() => {
      const id = this.entityId();
      if (this.editing()) this.loadOperational(id);
      else this.invalidateOperational();
    });
  }
  load(id = this.entityId()): void {
    const generation = ++this.detailGeneration;
    const refreshing = this.loadedEntityId === id && this.detail() !== null;
    this.loading.set(true);
    this.refreshingChanged.emit(refreshing);
    this.error.set(false);
    this.api.getStayDetail(id).subscribe({
      next: (detail) => {
        if (generation !== this.detailGeneration || id !== this.entityId()) return;
        this.detail.set(detail);
        this.loadedEntityId = id;
        this.loading.set(false);
        this.refreshingChanged.emit(false);
        this.contentSettled.emit();
        this.loadPricingGate(id);
      },
      error: () => {
        if (generation === this.detailGeneration && id === this.entityId()) {
          this.error.set(true);
          this.loading.set(false);
          this.refreshingChanged.emit(false);
          this.contentSettled.emit();
        }
      },
    });
  }
  private loadPricingGate(id: string): void {
    const generation = ++this.pricingGeneration;
    this.pricingStay.set(null);
    this.api.getStayById(id).subscribe({
      next: (stay) => {
        if (generation === this.pricingGeneration && id === this.entityId())
          this.pricingStay.set(stay);
      },
      error: () => {
        if (generation === this.pricingGeneration && id === this.entityId())
          this.pricingStay.set(null);
      },
    });
  }
  canEdit(detail: StayDetailResponse): boolean {
    return detail.status === 'RESERVED' || detail.status === 'CHECKED_IN';
  }
  canCancel(detail: StayDetailResponse): boolean {
    return detail.status === 'RESERVED' || detail.status === 'CHECKED_IN';
  }
  canDelete(detail: StayDetailResponse): boolean {
    const stay = this.pricingStay();
    return stay?.stayId === detail.stayId && stay.canDelete === true;
  }
  confirmPermanentDeletion(detail: StayDetailResponse): void {
    if (this.deleting()) return;
    const stay = this.pricingStay();
    if (stay?.stayId !== detail.stayId || stay.canDelete !== true) return;
    const subject = `${stay.cats.map((cat) => cat.name).join(', ')} — ${stay.ownerName} — ${this.date(stay.startAt)} – ${this.date(stay.endAt)}`;
    this.dialog
      .open<PermanentDeletionConfirmationDialog, PermanentDeletionConfirmationDialogData>(
        PermanentDeletionConfirmationDialog,
        {
          data: { subject },
          width: '34rem',
          maxWidth: 'calc(100vw - 2rem)',
        },
      )
      .afterClosed()
      .pipe(filter(isPermanentDeletionConfirmed))
      .subscribe(() => this.deletePermanently(stay.stayId));
  }
  private deletePermanently(stayId: string): void {
    if (this.deleting()) return;
    const generation = ++this.deletionGeneration;
    this.deleting.set(true);
    this.deletionError.set(null);
    this.submittingChanged.emit(true);
    this.api.deleteStay(stayId).subscribe({
      next: () => this.completeDeletion(generation, stayId),
      error: (error: unknown) => {
        if (generation !== this.deletionGeneration || stayId !== this.entityId()) return;
        if (error instanceof HttpErrorResponse && error.status === 404) {
          this.completeDeletion(generation, stayId);
          return;
        }
        this.deleting.set(false);
        this.submittingChanged.emit(false);
        this.deletionError.set(deletionErrorMessage(error, this.text().deletion));
      },
    });
  }
  private completeDeletion(generation: number, stayId: string): void {
    if (generation !== this.deletionGeneration || stayId !== this.entityId()) return;
    this.deleting.set(false);
    this.submittingChanged.emit(false);
    this.deletionCompleted.emit({ entityType: 'stay', entityId: stayId });
  }
  cancelStay(detail: StayDetailResponse): void {
    if (this.cancellationContextLoading()) return;
    const completeStay = this.pricingStay();
    if (completeStay?.stayId === detail.stayId) {
      this.cancellationContextError.set(false);
      this.openCancellationDialog(detail, completeStay);
      return;
    }

    const generation = ++this.cancellationContextGeneration;
    const stayId = detail.stayId;
    this.cancellationContextLoading.set(true);
    this.cancellationContextError.set(false);
    this.api.getStayById(stayId).subscribe({
      next: (stay) => {
        if (
          generation !== this.cancellationContextGeneration ||
          stayId !== this.entityId() ||
          stay.stayId !== stayId
        )
          return;
        this.pricingStay.set(stay);
        this.cancellationContextLoading.set(false);
        this.openCancellationDialog(detail, stay);
      },
      error: () => {
        if (generation !== this.cancellationContextGeneration || stayId !== this.entityId()) return;
        this.cancellationContextLoading.set(false);
        this.cancellationContextError.set(true);
      },
    });
  }
  private openCancellationDialog(detail: StayDetailResponse, stay: Stay): void {
    const data: StayCancellationDialogData = {
      stayId: detail.stayId,
      catNames: stay.cats.map((cat) => cat.name),
      ownerName: detail.owner.fullName,
      startAt: detail.startAt,
      endAt: detail.endAt,
    };
    this.dialog
      .open<StayCancellationDialog, StayCancellationDialogData, boolean>(StayCancellationDialog, {
        data,
        width: '34rem',
        maxWidth: 'calc(100vw - 2rem)',
      })
      .afterClosed()
      .pipe(filter((cancelled): cancelled is true => cancelled === true))
      .subscribe(() => {
        this.load();
        this.updated.emit({ entityType: 'stay', entityId: detail.stayId });
      });
  }
  private invalidateCancellationContext(): void {
    this.cancellationContextGeneration++;
    this.cancellationContextLoading.set(false);
    this.cancellationContextError.set(false);
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
  loadOperational(id = this.entityId()): void {
    const generation = ++this.operationalGeneration;
    this.operationalStay.set(null);
    this.operationalLoading.set(true);
    this.operationalError.set(false);
    this.api.getStayById(id).subscribe({
      next: (stay) => {
        if (generation !== this.operationalGeneration || id !== this.entityId() || !this.editing())
          return;
        if (stay.stayId !== id) {
          this.operationalError.set(true);
          this.operationalLoading.set(false);
          return;
        }
        this.operationalStay.set(stay);
        this.operationalLoading.set(false);
      },
      error: () => {
        if (generation !== this.operationalGeneration || id !== this.entityId() || !this.editing())
          return;
        this.operationalError.set(true);
        this.operationalLoading.set(false);
      },
    });
  }
  private invalidateOperational(): void {
    this.operationalGeneration++;
    this.operationalStay.set(null);
    this.operationalLoading.set(false);
    this.operationalError.set(false);
  }
  saved(stay: Stay): void {
    this.operationalStay.set(null);
    this.updated.emit(stay);
    this.saveCompleted.emit();
    this.load();
  }
}
