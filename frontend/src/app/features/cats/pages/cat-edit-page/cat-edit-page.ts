import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Owner } from '../../../owners/models/owner.model';
import { OwnerApiService } from '../../../owners/services/owner-api.service';
import { Vet } from '../../../vets/models/vet.model';
import { VetApiService } from '../../../vets/services/vet-api.service';
import { Cat, Sex, UpdateCatRequest } from '../../models/cat.model';
import { CatApiService } from '../../services/cat-api.service';
import { I18nService } from '../../../../core/i18n/i18n.service';

@Component({
  selector: 'app-cat-edit-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './cat-edit-page.html',
  styleUrl: './cat-edit-page.scss',
})
export class CatEditPage {
  private readonly catApiService = inject(CatApiService);
  private readonly ownerApiService = inject(OwnerApiService);
  private readonly vetApiService = inject(VetApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18nService = inject(I18nService);

  readonly text = this.i18nService.text;

  readonly owners = signal<Owner[]>([]);
  readonly vets = signal<Vet[]>([]);

  readonly name = signal('');
  readonly birthDate = signal('');
  readonly sex = signal<Sex | ''>('');
  readonly ownerId = signal('');
  readonly vetId = signal('');

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
  readonly catLoaded = signal(false);

  private readonly catId = this.route.snapshot.paramMap.get('id');

  constructor() {
    this.loadData();
  }

  loadData(): void {
    this.error.set(null);
    this.catLoaded.set(false);

    if (!this.catId) {
      this.showError(this.text().cats.edit.errors.catIdMissing);
      return;
    }

    this.loadingData.set(true);

    forkJoin({
      cat: this.catApiService.getCatById(this.catId),
      owners: this.ownerApiService.getOwners(),
      vets: this.vetApiService.getVets(),
    }).subscribe({
      next: ({ cat, owners, vets }) => {
        this.owners.set(owners);
        this.vets.set(vets);
        this.setFormValues(cat);
        this.catLoaded.set(true);
        this.loadingData.set(false);
      },
      error: (error: unknown) => {
        this.showError(
          this.getApiErrorMessage(error, this.text().cats.edit.errors.loadFormDataFailed),
        );
        this.loadingData.set(false);
      },
    });
  }

  submit(): void {
    if (!this.catLoaded()) {
      this.showError(this.text().cats.edit.errors.dataNotLoaded);
      return;
    }

    if (!this.catId) {
      this.showError(this.text().cats.edit.errors.catIdMissing);
      return;
    }

    if (!this.name().trim()) {
      this.showError(this.text().cats.edit.errors.nameRequired);
      return;
    }

    if (!this.birthDate()) {
      this.showError(this.text().cats.edit.errors.birthDateRequired);
      return;
    }

    if (!this.sex()) {
      this.showError(this.text().cats.edit.errors.sexRequired);
      return;
    }

    if (!this.ownerId()) {
      this.showError(this.text().cats.edit.errors.ownerRequired);
      return;
    }

    const request: UpdateCatRequest = {
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
      vetId: this.toNullableString(this.vetId()),
    };

    this.submitting.set(true);

    this.catApiService.updateCat(this.catId, request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/cats']);
      },
      error: (error: unknown) => {
        this.showError(this.getApiErrorMessage(error, this.text().cats.edit.errors.updateFailed));
        this.submitting.set(false);
      },
    });
  }

  private setFormValues(cat: Cat): void {
    this.name.set(cat.name);
    this.birthDate.set(cat.birthDate);
    this.sex.set(cat.sex);
    this.ownerId.set(cat.ownerId);
    this.vetId.set(cat.vetId ?? '');

    this.breed.set(cat.breed ?? '');
    this.coat.set(cat.coat ?? '');
    this.color.set(cat.color ?? '');
    this.foodBrand.set(cat.foodBrand ?? '');
    this.litterBrand.set(cat.litterBrand ?? '');
    this.personality.set(cat.personality ?? '');
    this.lastInternalDewormerName.set(cat.lastInternalDewormerName ?? '');
    this.lastInternalDewormingDate.set(cat.lastInternalDewormingDate ?? '');
    this.lastExternalDewormerName.set(cat.lastExternalDewormerName ?? '');
    this.lastExternalDewormingDate.set(cat.lastExternalDewormingDate ?? '');
    this.lastTripleFelineDate.set(cat.lastTripleFelineDate ?? '');
    this.lastRabiesDate.set(cat.lastRabiesDate ?? '');
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
