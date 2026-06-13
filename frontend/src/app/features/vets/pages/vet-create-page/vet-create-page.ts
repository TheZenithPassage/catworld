import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { CreateVetRequest } from '../../models/vet.model';
import { VetApiService } from '../../services/vet-api.service';

@Component({
  selector: 'app-vet-create-page',
  imports: [FormsModule],
  templateUrl: './vet-create-page.html',
  styleUrl: './vet-create-page.scss',
})
export class VetCreatePage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly vetApiService = inject(VetApiService);
  private readonly i18nService = inject(I18nService);

  readonly text = this.i18nService.text;

  readonly name = signal('');
  readonly address = signal('');
  readonly phoneNumber = signal('');

  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    this.error.set(null);

    if (!this.name().trim()) {
      this.error.set(this.text().vets.create.errors.nameRequired);
      return;
    }

    const request: CreateVetRequest = {
      name: this.name().trim(),
      address: this.toNullableString(this.address()),
      phoneNumber: this.toNullableString(this.phoneNumber()),
    };

    this.submitting.set(true);

    this.vetApiService.createVet(request).subscribe({
      next: (vet) => {
        this.submitting.set(false);
        this.navigateAfterSuccess(vet.id);
      },
      error: (error: unknown) => {
        this.error.set(this.getApiErrorMessage(error, this.text().vets.create.errors.createFailed));
        this.submitting.set(false);
      },
    });
  }

  private toNullableString(value: string): string | null {
    const trimmedValue = value.trim();

    return trimmedValue || null;
  }

  private navigateAfterSuccess(vetId: string): void {
    const returnTo = this.route.snapshot.queryParamMap.get('returnTo');

    if (returnTo === '/cats/new') {
      const queryParams: Record<string, string> = { vetId };

      const ownerId = this.route.snapshot.queryParamMap.get('ownerId');
      const catReturnTo = this.route.snapshot.queryParamMap.get('catReturnTo');

      if (ownerId) {
        queryParams['ownerId'] = ownerId;
      }

      if (catReturnTo === '/stays/new') {
        queryParams['returnTo'] = catReturnTo;
      }

      this.router.navigate(['/cats/new'], { queryParams });
      return;
    }

    this.router.navigate(['/vets']);
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
