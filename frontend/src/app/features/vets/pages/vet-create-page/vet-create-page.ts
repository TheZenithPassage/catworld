import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import {
  EntityNameLengthDirective,
  isEntityNameLengthValid,
} from '../../../../shared/forms/entity-name-length.directive';
import { TrimRequiredDirective } from '../../../../shared/forms/trim-required.directive';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { CreateVetRequest } from '../../models/vet.model';
import { VetApiService } from '../../services/vet-api.service';

@Component({
  selector: 'app-vet-create-page',
  imports: [
    FormsModule,
    MatButton,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    EntityNameLengthDirective,
    TrimRequiredDirective,
    UiStateComponent,
  ],
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
  readonly error = createLanguageResetError(this.i18nService.language);
  readonly nameError = createLanguageResetError(this.i18nService.language);

  submit(): void {
    this.error.set(null);
    this.clearValidationErrors();

    const trimmedName = this.name().trim();

    if (!trimmedName) {
      this.nameError.set(this.text().vets.create.errors.nameRequired);
      return;
    }

    if (!isEntityNameLengthValid(trimmedName)) {
      this.nameError.set(this.text().vets.create.errors.nameLength);
      return;
    }

    const request: CreateVetRequest = {
      name: trimmedName,
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

  private clearValidationErrors(): void {
    this.nameError.set(null);
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
