import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { Owner } from '../../../owners/models/owner.model';
import { OwnerApiService } from '../../../owners/services/owner-api.service';
import { CreateCatRequest, Sex } from '../../models/cat.model';
import { CatApiService } from '../../services/cat-api.service';

@Component({
  selector: 'app-cat-create-page',
  imports: [FormsModule],
  templateUrl: './cat-create-page.html',
  styleUrl: './cat-create-page.scss'
})
export class CatCreatePage {
  private readonly catApiService = inject(CatApiService);
  private readonly ownerApiService = inject(OwnerApiService);
  private readonly router = inject(Router);

  readonly owners = signal<Owner[]>([]);

  readonly name = signal('');
  readonly birthDate = signal('');
  readonly sex = signal<Sex | ''>('');
  readonly ownerId = signal('');

  readonly breed = signal('');
  readonly coat = signal('');
  readonly color = signal('');
  readonly foodBrand = signal('');
  readonly litterBrand = signal('');
  readonly personality = signal('');
  readonly lastInternalDewormerName = signal('');
  readonly lastInternalDewormingDate = signal('');
  readonly lastExternalDewormerName = signal('');
  readonly lastExternalDewormingDate = signal('');
  readonly lastTripleFelineDate = signal('');
  readonly lastRabiesDate = signal('');

  readonly loadingData = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.loadOwners();
  }

  loadOwners(): void {
    this.loadingData.set(true);
    this.error.set(null);

    this.ownerApiService.getOwners().subscribe({
      next: (owners) => {
        this.owners.set(owners);
        this.loadingData.set(false);
      },
      error: () => {
        this.error.set('Error loading owners');
        this.loadingData.set(false);
      }
    });
  }

  submit(): void {
    this.error.set(null);

    if (!this.name().trim()) {
      this.error.set('Name is required');
      return;
    }

    if (!this.birthDate()) {
      this.error.set('Birth date is required');
      return;
    }

    if (!this.sex()) {
      this.error.set('Sex is required');
      return;
    }

    if (!this.ownerId()) {
      this.error.set('Owner is required');
      return;
    }

    const request: CreateCatRequest = {
      name: this.name().trim(),
      birthDate: this.birthDate(),
      sex: this.sex() as Sex,
      breed: this.toNullableString(this.breed()),
      coat: this.toNullableString(this.coat()),
      color: this.toNullableString(this.color()),
      foodBrand: this.toNullableString(this.foodBrand()),
      litterBrand: this.toNullableString(this.litterBrand()),
      personality: this.toNullableString(this.personality()),
      lastInternalDewormerName: this.toNullableString(this.lastInternalDewormerName()),
      lastInternalDewormingDate: this.toNullableString(this.lastInternalDewormingDate()),
      lastExternalDewormerName: this.toNullableString(this.lastExternalDewormerName()),
      lastExternalDewormingDate: this.toNullableString(this.lastExternalDewormingDate()),
      lastTripleFelineDate: this.toNullableString(this.lastTripleFelineDate()),
      lastRabiesDate: this.toNullableString(this.lastRabiesDate()),
      ownerId: this.ownerId(),
      vetId: null
    };

    this.submitting.set(true);

    this.catApiService.createCat(request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/stays/new']);
      },
      error: (error: unknown) => {
        this.error.set(this.getApiErrorMessage(error, 'Error creating cat'));
        this.submitting.set(false);
      }
    });
  }

  private toNullableString(value: string): string | null {
    const trimmedValue = value.trim();

    return trimmedValue || null;
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
}