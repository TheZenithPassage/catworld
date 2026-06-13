import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { Owner, UpdateOwnerRequest } from '../../models/owner.model';
import { OwnerApiService } from '../../services/owner-api.service';

@Component({
  selector: 'app-owner-edit-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './owner-edit-page.html',
  styleUrl: './owner-edit-page.scss',
})
export class OwnerEditPage {
  private readonly ownerApiService = inject(OwnerApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18nService = inject(I18nService);

  readonly text = this.i18nService.text;

  readonly fullName = signal('');
  readonly address = signal('');
  readonly primaryPhone = signal('');
  readonly secondaryPhone = signal('');
  readonly secondaryPhoneName = signal('');
  readonly instagram = signal('');
  readonly facebook = signal('');

  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);
  readonly ownerLoaded = signal(false);

  private readonly ownerId = this.route.snapshot.paramMap.get('id');

  constructor() {
    this.loadOwner();
  }

  loadOwner(): void {
    this.error.set(null);
    this.ownerLoaded.set(false);

    if (!this.ownerId) {
      this.showError(this.text().owners.edit.errors.ownerIdMissing);
      return;
    }

    this.loading.set(true);

    this.ownerApiService.getOwnerById(this.ownerId).subscribe({
      next: (owner) => {
        this.setFormValues(owner);
        this.ownerLoaded.set(true);
        this.loading.set(false);
      },
      error: (error: unknown) => {
        this.showError(this.getApiErrorMessage(error, this.text().owners.edit.errors.loadFailed));
        this.loading.set(false);
      },
    });
  }

  submit(): void {
    if (!this.ownerId) {
      this.showError(this.text().owners.edit.errors.ownerIdMissing);
      return;
    }

    if (!this.fullName().trim()) {
      this.showError(this.text().owners.edit.errors.fullNameRequired);
      return;
    }

    if (!this.primaryPhone().trim()) {
      this.showError(this.text().owners.edit.errors.primaryPhoneRequired);
      return;
    }

    const request: UpdateOwnerRequest = {
      fullName: this.fullName().trim(),
      address: this.toNullableString(this.address()),
      primaryPhone: this.primaryPhone().trim(),
      secondaryPhone: this.toNullableString(this.secondaryPhone()),
      secondaryPhoneName: this.toNullableString(this.secondaryPhoneName()),
      instagram: this.toNullableString(this.instagram()),
      facebook: this.toNullableString(this.facebook()),
    };

    this.submitting.set(true);

    this.ownerApiService.updateOwner(this.ownerId, request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/owners']);
      },
      error: (error: unknown) => {
        this.showError(this.getApiErrorMessage(error, this.text().owners.edit.errors.updateFailed));
        this.submitting.set(false);
      },
    });
  }

  private setFormValues(owner: Owner): void {
    this.fullName.set(owner.fullName);
    this.address.set(owner.address ?? '');
    this.primaryPhone.set(owner.primaryPhone);
    this.secondaryPhone.set(owner.secondaryPhone ?? '');
    this.secondaryPhoneName.set(owner.secondaryPhoneName ?? '');
    this.instagram.set(owner.instagram ?? '');
    this.facebook.set(owner.facebook ?? '');
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
