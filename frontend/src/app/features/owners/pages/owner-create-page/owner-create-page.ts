import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { CreateOwnerRequest } from '../../models/owner.model';
import { OwnerApiService } from '../../services/owner-api.service';

@Component({
  selector: 'app-owner-create-page',
  imports: [FormsModule],
  templateUrl: './owner-create-page.html',
  styleUrl: './owner-create-page.scss',
})
export class OwnerCreatePage {
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

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    this.error.set(null);

    if (!this.fullName().trim()) {
      this.error.set(this.text().owners.create.errors.fullNameRequired);
      return;
    }

    if (!this.primaryPhone().trim()) {
      this.error.set(this.text().owners.create.errors.primaryPhoneRequired);
      return;
    }

    const request: CreateOwnerRequest = {
      fullName: this.fullName().trim(),
      address: this.toNullableString(this.address()),
      primaryPhone: this.primaryPhone().trim(),
      secondaryPhone: this.toNullableString(this.secondaryPhone()),
      secondaryPhoneName: this.toNullableString(this.secondaryPhoneName()),
      instagram: this.toNullableString(this.instagram()),
      facebook: this.toNullableString(this.facebook()),
    };

    this.submitting.set(true);

    this.ownerApiService.createOwner(request).subscribe({
      next: (owner) => {
        this.submitting.set(false);
        this.navigateAfterSuccess(owner.id);
      },
      error: (error: unknown) => {
        this.error.set(
          this.getApiErrorMessage(error, this.text().owners.create.errors.createFailed),
        );
        this.submitting.set(false);
      },
    });
  }

  private toNullableString(value: string): string | null {
    const trimmedValue = value.trim();

    return trimmedValue || null;
  }

  private navigateAfterSuccess(ownerId: string): void {
    const returnTo = this.route.snapshot.queryParamMap.get('returnTo');

    if (returnTo === '/cats/new') {
      const queryParams: Record<string, string> = { ownerId };

      const vetId = this.route.snapshot.queryParamMap.get('vetId');
      const catReturnTo = this.route.snapshot.queryParamMap.get('catReturnTo');

      if (vetId) {
        queryParams['vetId'] = vetId;
      }

      if (catReturnTo === '/stays/new') {
        queryParams['returnTo'] = catReturnTo;
      }

      this.router.navigate(['/cats/new'], { queryParams });
      return;
    }

    if (returnTo === '/stays/new') {
      this.router.navigate(['/stays/new'], {
        queryParams: { ownerId },
      });
      return;
    }

    this.router.navigate(['/owners']);
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
