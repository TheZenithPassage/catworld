import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';

import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { canCancelStay, canModifyStay, getStayStatus, getStayStatusLabel } from '../../utils/stay-status.util';

@Component({
  selector: 'app-stays-overview-page',
  imports: [RouterLink],
  templateUrl: './stays-overview-page.html',
  styleUrl: './stays-overview-page.scss'
})
export class StaysOverviewPage {
  private readonly stayApiService = inject(StayApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly selectedStayId = signal<string | null>(null);

  readonly stays = signal<Stay[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly cancellingStayId = signal<string | null>(null);

  constructor() {
    this.route.queryParamMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((params) => {
        this.selectedStayId.set(params.get('selectedStayId'));
      });

    this.loadStays();
  }

  loadStays(): void {
    this.loading.set(true);
    this.error.set(null);

    this.stayApiService.getStays().subscribe({
      next: (stays) => {
        this.stays.set(stays);
        this.loading.set(false);
        this.scrollSelectedStayIntoView();
      },
      error: () => {
        this.error.set('Error loading stays');
        this.loading.set(false);
      }
    });
  }

  getStayStatus(stay: Stay): string {
    return getStayStatusLabel(getStayStatus(stay));
  }

  formatDate(value: string | null): string {
    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  getCatSummary(stay: Stay): string {
    return stay.cats.length === 1 ? '1 cat' : `${stay.cats.length} cats`;
  }

  getCatNames(stay: Stay): string {
    return stay.cats
      .map((cat) => cat.name)
      .join(', ');
  }

  canCancelStay(stay: Stay): boolean {
    return canCancelStay(stay);
  }

  canEditStay(stay: Stay): boolean {
    return canModifyStay(stay);
  }

  cancelStay(stay: Stay): void {
    const confirmed = window.confirm(
      `Cancel stay for ${this.getCatNames(stay)}?`
    );

    if (!confirmed) {
      return;
    }

    this.error.set(null);
    this.cancellingStayId.set(stay.stayId);

    this.stayApiService.cancelStay(stay.stayId).subscribe({
      next: () => {
        this.cancellingStayId.set(null);
        this.loadStays();
      },
      error: (error: unknown) => {
        this.error.set(this.getApiErrorMessage(error, 'Error cancelling stay'));
        this.cancellingStayId.set(null);
      }
    });
  }

  isSelectedStay(stay: Stay): boolean {
    return this.selectedStayId() === stay.stayId;
  }

  getUnavailableActionLabel(stay: Stay): string {
    const status = getStayStatus(stay);

    if (status === 'cancelled') {
      return 'Already cancelled';
    }

    if (status === 'checked-out') {
      return 'Already checked-out';
    }

    return '-';
  }

  private getApiErrorMessage(error: unknown, fallbackMessage: string): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallbackMessage;
    }

    const responseBody: unknown = error.error;

    if (!responseBody) {
      return fallbackMessage;
    }

    if (typeof responseBody === 'string') {
      return responseBody.trim() || fallbackMessage;
    }

    if (this.isValidationErrorMap(responseBody)) {
      const messages = Object.entries(responseBody).map(
        ([field, message]) => `${field}: ${message}`
      );

      return messages.length > 0 ? messages.join('. ') : fallbackMessage;
    }

    return fallbackMessage;
  }

  private isValidationErrorMap(value: unknown): value is Record<string, string> {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      Object.values(value).every((message) => typeof message === 'string')
    );
  }

  private scrollSelectedStayIntoView(): void {
    const selectedStayId = this.selectedStayId();

    if (!selectedStayId) {
      return;
    }

    setTimeout(() => {
      document
        .getElementById(`stay-${selectedStayId}`)
        ?.scrollIntoView({ block: 'center' });
    });
  }
}
