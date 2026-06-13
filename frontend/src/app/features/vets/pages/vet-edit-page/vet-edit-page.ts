import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { UpdateVetRequest, Vet } from '../../models/vet.model';
import { VetApiService } from '../../services/vet-api.service';

@Component({
  selector: 'app-vet-edit-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './vet-edit-page.html',
  styleUrl: './vet-edit-page.scss',
})
export class VetEditPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly vetApiService = inject(VetApiService);
  private readonly i18nService = inject(I18nService);

  readonly text = this.i18nService.text;

  readonly name = signal('');
  readonly address = signal('');
  readonly phoneNumber = signal('');

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly vetLoaded = signal(false);

  private readonly vetId = this.route.snapshot.paramMap.get('id');

  constructor() {
    this.loadVet();
  }

  loadVet(): void {
    this.error.set(null);
    this.vetLoaded.set(false);

    if (!this.vetId) {
      this.showError(this.text().vets.edit.errors.vetIdMissing);
      return;
    }

    this.loading.set(true);

    this.vetApiService.getVetById(this.vetId).subscribe({
      next: (vet) => {
        this.setFormValues(vet);
        this.vetLoaded.set(true);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.showError(this.getApiErrorMessage(error, this.text().vets.edit.errors.loadFailed));
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    this.error.set(null);

    if (!this.vetLoaded()) {
      this.showError(this.text().vets.edit.errors.dataNotLoaded);
      return;
    }

    if (!this.vetId) {
      this.showError(this.text().vets.edit.errors.vetIdMissing);
      return;
    }

    if (!this.name().trim()) {
      this.showError(this.text().vets.edit.errors.nameRequired);
      return;
    }

    const request: UpdateVetRequest = {
      name: this.name().trim(),
      address: this.toNullableString(this.address()),
      phoneNumber: this.toNullableString(this.phoneNumber()),
    };

    this.submitting.set(true);

    this.vetApiService.updateVet(this.vetId, request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/vets']);
      },
      error: (error: unknown) => {
        this.showError(this.getApiErrorMessage(error, this.text().vets.edit.errors.updateFailed));
        this.submitting.set(false);
      },
    });
  }

  private setFormValues(vet: Vet): void {
    this.name.set(vet.name);
    this.address.set(vet.address ?? '');
    this.phoneNumber.set(vet.phoneNumber ?? '');
  }

  private toNullableString(value: string): string | null {
    const trimmedValue = value.trim();

    return trimmedValue || null;
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
