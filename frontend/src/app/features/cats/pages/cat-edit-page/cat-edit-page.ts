import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin, of, switchMap } from 'rxjs';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import {
  EntityNameLengthDirective,
  isEntityNameLengthValid,
} from '../../../../shared/forms/entity-name-length.directive';
import { TrimRequiredDirective } from '../../../../shared/forms/trim-required.directive';
import { RemoteSearchSelectorComponent } from '../../../../shared/remote-search-selector/remote-search-selector';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { OwnerLookupOption, ownerLookupLabel } from '../../../owners/models/owner.model';
import { OwnerApiService } from '../../../owners/services/owner-api.service';
import { VetLookupOption, vetLookupOptionLabel } from '../../../vets/models/vet.model';
import { VetApiService } from '../../../vets/services/vet-api.service';
import { Cat, Sex, UpdateCatRequest } from '../../models/cat.model';
import { CatApiService } from '../../services/cat-api.service';

@Component({
  selector: 'app-cat-edit-page',
  imports: [
    FormsModule,
    MatButton,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    RouterLink,
    EntityNameLengthDirective,
    TrimRequiredDirective,
    RemoteSearchSelectorComponent,
    UiStateComponent,
  ],
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

  private readonly ownerSelector = viewChild(RemoteSearchSelectorComponent<OwnerLookupOption>);
  private readonly vetSelector = viewChild(RemoteSearchSelectorComponent<VetLookupOption>);

  readonly name = signal('');
  readonly birthDate = signal('');
  readonly sex = signal<Sex | ''>('');
  readonly ownerId = signal('');
  readonly vetId = signal('');
  readonly initialOwner = signal<OwnerLookupOption | null>(null);
  readonly initialVet = signal<VetLookupOption | null>(null);

  readonly searchOwners = (query: string, page: number) =>
    this.ownerApiService.searchLookupOptions(query, page);
  readonly ownerOptionId = (option: OwnerLookupOption) => option.id;
  readonly ownerOptionLabel = ownerLookupLabel;
  readonly searchVets = (query: string, page: number) => this.vetApiService.searchVets(query, page);
  readonly vetOptionId = (option: VetLookupOption) => option.id;
  readonly vetOptionLabel = vetLookupOptionLabel;

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
  readonly error = createLanguageResetError(this.i18nService.language);
  readonly catLoaded = signal(false);
  readonly nameError = createLanguageResetError(this.i18nService.language);
  readonly birthDateError = createLanguageResetError(this.i18nService.language);
  readonly sexError = createLanguageResetError(this.i18nService.language);
  readonly ownerIdError = createLanguageResetError(this.i18nService.language);

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

    this.catApiService
      .getCatById(this.catId)
      .pipe(
        switchMap((cat) =>
          forkJoin({
            cat: of(cat),
            owner: this.ownerApiService.getLookupOption(cat.ownerId),
            vet: cat.vetId ? this.vetApiService.resolveVetLookupOption(cat.vetId) : of(null),
          }),
        ),
      )
      .subscribe({
        next: ({ cat, owner, vet }) => {
          this.initialOwner.set(owner);
          this.initialVet.set(vet);
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
    this.error.set(null);
    this.clearValidationErrors();

    if (!this.catLoaded()) {
      this.showError(this.text().cats.edit.errors.dataNotLoaded);
      return;
    }

    if (!this.catId) {
      this.showError(this.text().cats.edit.errors.catIdMissing);
      return;
    }

    const trimmedName = this.name().trim();

    if (!trimmedName) {
      this.nameError.set(this.text().cats.edit.errors.nameRequired);
      return;
    }

    if (!isEntityNameLengthValid(trimmedName)) {
      this.nameError.set(this.text().cats.edit.errors.nameLength);
      return;
    }

    if (!this.birthDate()) {
      this.birthDateError.set(this.text().cats.edit.errors.birthDateRequired);
      return;
    }

    if (!this.sex()) {
      this.sexError.set(this.text().cats.edit.errors.sexRequired);
      return;
    }

    this.ownerSelector()?.markAsTouched();
    this.vetSelector()?.markAsTouched();

    if (!this.ownerId() || this.ownerSelector()?.isValid() === false) {
      this.ownerIdError.set(this.text().cats.edit.errors.ownerRequired);
      return;
    }

    if (this.vetSelector()?.isValid() === false) {
      return;
    }

    const request: UpdateCatRequest = {
      name: trimmedName,
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

  onOwnerSelection(option: OwnerLookupOption | null): void {
    this.ownerId.set(option?.id ?? '');
    this.ownerIdError.set(null);
  }

  onVetSelection(option: VetLookupOption | null): void {
    this.vetId.set(option?.id ?? '');
  }

  private toNullableString(value: string): string | null {
    const trimmedValue = value.trim();

    return trimmedValue || null;
  }

  private clearValidationErrors(): void {
    this.nameError.set(null);
    this.birthDateError.set(null);
    this.sexError.set(null);
    this.ownerIdError.set(null);
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
