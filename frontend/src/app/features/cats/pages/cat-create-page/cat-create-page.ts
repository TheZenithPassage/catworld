import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { TrimRequiredDirective } from '../../../../shared/forms/trim-required.directive';
import { EntityLookupState } from '../../../../shared/entity-lookup/entity-lookup.models';
import {
  OwnerLookupAdapter,
  VetLookupAdapter,
} from '../../../../shared/entity-lookup/domain-lookup.adapters';
import { RemoteEntitySelector } from '../../../../shared/entity-lookup/remote-entity-selector';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { OwnerLookup } from '../../../owners/models/owner.model';
import { VetLookup } from '../../../vets/models/vet.model';
import { CreateCatRequest, Sex } from '../../models/cat.model';
import { CatApiService } from '../../services/cat-api.service';
import { catPhotoErrorMessage } from '../../utils/cat-photo-error';
import { CatPhotoInput } from '../../components/cat-photo-input/cat-photo-input';

@Component({
  selector: 'app-cat-create-page',
  imports: [
    FormsModule,
    MatButton,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    RouterLink,
    TrimRequiredDirective,
    RemoteEntitySelector,
    UiStateComponent,
    CatPhotoInput,
  ],
  templateUrl: './cat-create-page.html',
  styleUrl: './cat-create-page.scss',
})
export class CatCreatePage implements AfterViewInit {
  @ViewChild(CatPhotoInput) private photoInput?: CatPhotoInput;
  @ViewChild('ownerSelector') private ownerSelector?: RemoteEntitySelector<OwnerLookup>;
  @ViewChild('vetSelector') private vetSelector?: RemoteEntitySelector<VetLookup>;
  private readonly catApiService = inject(CatApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18nService = inject(I18nService);

  readonly text = this.i18nService.text;

  readonly ownerLookup = inject(OwnerLookupAdapter);
  readonly vetLookup = inject(VetLookupAdapter);

  readonly name = signal('');
  readonly birthDate = signal('');
  readonly sex = signal<Sex | ''>('');
  readonly ownerId = signal('');
  readonly vetId = signal('');
  readonly vetRawContentPresent = signal(false);
  private ownerLookupStateReceived = false;
  private vetLookupStateReceived = false;

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

  readonly submitting = signal(false);
  readonly error = createLanguageResetError(this.i18nService.language);
  readonly nameError = createLanguageResetError(this.i18nService.language);
  readonly birthDateError = createLanguageResetError(this.i18nService.language);
  readonly sexError = createLanguageResetError(this.i18nService.language);
  ngAfterViewInit(): void {
    const ownerId = this.route.snapshot.queryParamMap.get('ownerId');
    const vetId = this.route.snapshot.queryParamMap.get('vetId');
    if (ownerId) this.ownerSelector?.resolveKnownId(ownerId);
    if (vetId) this.vetSelector?.resolveKnownId(vetId);
  }

  ownerChanged(state: EntityLookupState<OwnerLookup>): void {
    this.ownerLookupStateReceived = true;
    this.ownerId.set(state.selectedId ?? '');
  }

  vetChanged(state: EntityLookupState<VetLookup>): void {
    this.vetLookupStateReceived = true;
    this.vetId.set(state.selectedId ?? '');
    this.vetRawContentPresent.set(state.rawContentPresent);
  }

  submit(): void {
    this.error.set(null);
    this.clearValidationErrors();
    if (this.photoInput && !this.photoInput.valid()) return;

    if (!this.name().trim()) {
      this.nameError.set(this.text().cats.create.errors.nameRequired);
      return;
    }

    if (!this.birthDate()) {
      this.birthDateError.set(this.text().cats.create.errors.birthDateRequired);
      return;
    }

    if (!this.sex()) {
      this.sexError.set(this.text().cats.create.errors.sexRequired);
      return;
    }

    this.ownerSelector?.markSubmitted();
    this.vetSelector?.markSubmitted();
    if (!this.ownerId() || (this.vetRawContentPresent() && !this.vetId())) return;

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
      vetId: this.toNullableString(this.vetId()),
    };

    this.submitting.set(true);

    this.catApiService.createCat(request, this.photoInput?.mutation().photo ?? null).subscribe({
      next: (cat) => {
        this.photoInput?.reset();
        this.submitting.set(false);
        this.navigateAfterSuccess(cat.id, cat.ownerId);
      },
      error: (error: unknown) => {
        this.error.set(
          catPhotoErrorMessage(error, this.text().cats.photo.errors) ??
            this.getApiErrorMessage(error, this.text().cats.create.errors.createFailed),
        );
        this.submitting.set(false);
      },
    });
  }

  cancel(): void {
    this.photoInput?.reset();
    const returnTo = this.route.snapshot.queryParamMap.get('returnTo');
    if (returnTo === '/stays/new') {
      const ownerId =
        this.ownerId() ||
        (!this.ownerLookupStateReceived ? this.route.snapshot.queryParamMap.get('ownerId') : null);
      this.router.navigate(['/stays/new'], {
        queryParams: ownerId ? { ownerId } : undefined,
      });
      return;
    }
    this.router.navigate(['/cats']);
  }

  private clearValidationErrors(): void {
    this.nameError.set(null);
    this.birthDateError.set(null);
    this.sexError.set(null);
  }

  getCreateVetQueryParams(): Record<string, string> {
    const queryParams: Record<string, string> = {
      returnTo: '/cats/new',
    };

    const currentOwnerId =
      this.ownerId() ||
      (!this.ownerLookupStateReceived ? this.route.snapshot.queryParamMap.get('ownerId') : null);
    const currentReturnTo = this.route.snapshot.queryParamMap.get('returnTo');

    if (currentOwnerId) {
      queryParams['ownerId'] = currentOwnerId;
    }

    if (currentReturnTo === '/stays/new') {
      queryParams['catReturnTo'] = currentReturnTo;
    }

    return queryParams;
  }

  getCreateOwnerQueryParams(): Record<string, string> {
    const queryParams: Record<string, string> = {
      returnTo: '/cats/new',
    };

    const currentVetId =
      this.vetId() ||
      (!this.vetLookupStateReceived ? this.route.snapshot.queryParamMap.get('vetId') : null);
    const currentReturnTo = this.route.snapshot.queryParamMap.get('returnTo');

    if (currentVetId) {
      queryParams['vetId'] = currentVetId;
    }

    if (currentReturnTo === '/stays/new') {
      queryParams['catReturnTo'] = currentReturnTo;
    }

    return queryParams;
  }

  private toNullableString(value: string): string | null {
    const trimmedValue = value.trim();

    return trimmedValue || null;
  }

  private navigateAfterSuccess(catId: string, ownerId: string): void {
    const returnTo = this.route.snapshot.queryParamMap.get('returnTo');

    if (returnTo === '/stays/new') {
      this.router.navigate(['/stays/new'], {
        queryParams: { ownerId, catId },
      });
      return;
    }

    this.router.navigate(['/cats']);
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
