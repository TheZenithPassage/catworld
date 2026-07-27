import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import {
  VaccineConflictDialog,
  VaccineConflictDialogData,
} from '../../components/vaccine-conflict-dialog/vaccine-conflict-dialog';
import {
  isVaccineConflictError,
  Stay,
  UpdateStayRequest,
  VaccineConflictResponse,
} from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { canModifyStay } from '../../utils/stay-status.util';

@Component({
  selector: 'app-stay-edit-page',
  imports: [FormsModule, MatButton, MatFormField, MatInput, MatLabel, RouterLink, UiStateComponent],
  templateUrl: './stay-edit-page.html',
  styleUrl: './stay-edit-page.scss',
})
export class StayEditPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly stayApiService = inject(StayApiService);
  private readonly i18nService = inject(I18nService);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly dialog = inject(MatDialog);

  readonly text = this.i18nService.text;

  readonly ownerName = signal('');
  readonly catNames = signal('');

  readonly startAt = signal('');
  readonly endAt = signal('');
  readonly notes = signal('');

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly error = createLanguageResetError(this.i18nService.language);
  readonly stayLoaded = signal(false);

  private readonly stayId = this.route.snapshot.paramMap.get('id');

  constructor() {
    this.loadStay();
  }

  loadStay(): void {
    this.error.set(null);
    this.stayLoaded.set(false);

    if (!this.stayId) {
      this.showError(this.text().stays.edit.errors.stayIdMissing);
      return;
    }

    this.loading.set(true);

    this.stayApiService.getStayById(this.stayId).subscribe({
      next: (stay) => {
        if (!canModifyStay(stay)) {
          this.showError(this.text().stays.edit.errors.closedCannotBeModified);
          this.loading.set(false);
          return;
        }

        this.setFormValues(stay);
        this.stayLoaded.set(true);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.showError(this.getApiErrorMessage(error, this.text().stays.edit.errors.loadFailed));
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    this.error.set(null);

    if (!this.stayLoaded()) {
      this.showError(this.text().stays.edit.errors.dataNotLoaded);
      return;
    }

    if (!this.stayId) {
      this.showError(this.text().stays.edit.errors.stayIdMissing);
      return;
    }

    if (!this.startAt() || !this.endAt()) {
      this.showError(this.text().stays.edit.errors.datesRequired);
      return;
    }

    if (new Date(this.endAt()) <= new Date(this.startAt())) {
      this.showError(this.text().stays.edit.errors.endAfterStart);
      return;
    }

    const request: UpdateStayRequest = {
      startAt: this.startAt(),
      endAt: this.endAt(),
      notes: this.notes().trim() || null,
      overrideVaccineConflicts: false,
    };

    this.saveStay(request, true);
  }

  private saveStay(request: UpdateStayRequest, showVaccineConflict: boolean): void {
    if (!this.stayId) {
      this.showError(this.text().stays.edit.errors.stayIdMissing);
      return;
    }

    this.submitting.set(true);

    this.stayApiService.updateStay(this.stayId, request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/stays']);
      },
      error: (error: unknown) => {
        if (showVaccineConflict && isVaccineConflictError(error)) {
          this.submitting.set(false);
          this.openVaccineConflictDialog(error.error, request);
          return;
        }

        this.showError(this.getApiErrorMessage(error, this.text().stays.edit.errors.updateFailed));
        this.submitting.set(false);
      },
    });
  }

  private openVaccineConflictDialog(
    conflict: VaccineConflictResponse,
    request: UpdateStayRequest,
  ): void {
    const canOverride = this.authSessionService.hasRole('ADMIN');
    const data: VaccineConflictDialogData = {
      violations: conflict.violations,
      canOverride,
    };

    this.dialog
      .open<VaccineConflictDialog, VaccineConflictDialogData, boolean>(VaccineConflictDialog, {
        data,
        width: '36rem',
        maxWidth: 'calc(100vw - 2rem)',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed !== true || !canOverride || !this.authSessionService.hasRole('ADMIN')) {
          return;
        }

        this.saveStay({ ...request, overrideVaccineConflicts: true }, false);
      });
  }

  private setFormValues(stay: Stay): void {
    this.ownerName.set(stay.ownerName);
    this.catNames.set(stay.cats.map((cat) => cat.name).join(', '));
    this.startAt.set(this.toDateTimeLocalValue(stay.startAt));
    this.endAt.set(this.toDateTimeLocalValue(stay.endAt));
    this.notes.set(stay.notes ?? '');
  }

  private toDateTimeLocalValue(value: string): string {
    return value.slice(0, 16);
  }

  private showError(message: string): void {
    this.error.set(message);
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
        ([field, message]) => `${field}: ${message}`,
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
}
