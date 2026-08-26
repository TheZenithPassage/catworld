import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, input, output, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { of } from 'rxjs';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { EntityLookupState } from '../../../../shared/entity-lookup/entity-lookup.models';
import {
  OwnerLookupAdapter,
  VetLookupAdapter,
} from '../../../../shared/entity-lookup/domain-lookup.adapters';
import { RemoteEntitySelector } from '../../../../shared/entity-lookup/remote-entity-selector';
import { TrimRequiredDirective } from '../../../../shared/forms/trim-required.directive';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { OwnerLookup } from '../../../owners/models/owner.model';
import { VetLookup } from '../../../vets/models/vet.model';
import { Cat, Sex, UpdateCatRequest } from '../../models/cat.model';
import { CatApiService } from '../../services/cat-api.service';
import { catPhotoErrorMessage } from '../../utils/cat-photo-error';
import { CatPhotoInput } from '../cat-photo-input/cat-photo-input';

@Component({
  selector: 'app-cat-editor',
  imports: [
    FormsModule,
    RouterLink,
    MatButton,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    RemoteEntitySelector,
    TrimRequiredDirective,
    UiStateComponent,
    CatPhotoInput,
  ],
  templateUrl: '../../pages/cat-edit-page/cat-edit-page.html',
  styleUrl: '../../pages/cat-edit-page/cat-edit-page.scss',
})
export class CatEditor {
  @ViewChild(CatPhotoInput) private photoInput?: CatPhotoInput;
  private ownerSelector?: RemoteEntitySelector<OwnerLookup>;
  private vetSelector?: RemoteEntitySelector<VetLookup>;
  private initialCat: Cat | null = null;
  private readonly api = inject(CatApiService);
  private readonly i18n = inject(I18nService);
  readonly entityId = input.required<string>();
  readonly entity = input<Cat | null>(null);
  readonly routed = input(false);
  readonly saved = output<Cat>();
  readonly cancelled = output<void>();
  readonly submittingChanged = output<boolean>();
  readonly text = this.i18n.text;
  readonly ownerLookup = inject(OwnerLookupAdapter);
  readonly vetLookup = inject(VetLookupAdapter);
  readonly name = signal('');
  readonly birthDate = signal('');
  readonly sex = signal<Sex | ''>('');
  readonly ownerId = signal('');
  readonly vetId = signal('');
  readonly vetRawContentPresent = signal(false);
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
  readonly error = createLanguageResetError(this.i18n.language);
  readonly catLoaded = signal(false);
  readonly hasSavedPhoto = signal(false);
  readonly nameError = createLanguageResetError(this.i18n.language);
  readonly birthDateError = createLanguageResetError(this.i18n.language);
  readonly sexError = createLanguageResetError(this.i18n.language);
  constructor() {
    effect(() => {
      const entity = this.entity();
      this.loadData(entity);
    });
  }
  @ViewChild('ownerSelector')
  set ownerSelectorInstance(selector: RemoteEntitySelector<OwnerLookup> | undefined) {
    this.ownerSelector = selector;
    const cat = this.initialCat;
    if (cat) selector?.trustInitialValue({ id: cat.ownerId, label: cat.ownerName });
  }
  @ViewChild('vetSelector')
  set vetSelectorInstance(selector: RemoteEntitySelector<VetLookup> | undefined) {
    this.vetSelector = selector;
    const cat = this.initialCat;
    if (cat) {
      selector?.trustInitialValue(
        cat.vetId && cat.vetName ? { id: cat.vetId, label: cat.vetName } : null,
      );
    }
  }
  loadData(entity: Cat | null = this.entity()): void {
    this.error.set(null);
    this.catLoaded.set(false);
    if (!this.entityId()) {
      this.error.set(this.text().cats.edit.errors.catIdMissing);
      return;
    }
    this.loadingData.set(true);
    (entity ? of(entity) : this.api.getCatById(this.entityId())).subscribe({
      next: (cat) => {
        this.setValues(cat);
        this.loadingData.set(false);
      },
      error: (e) => {
        this.error.set(this.apiMessage(e, this.text().cats.edit.errors.loadFormDataFailed));
        this.loadingData.set(false);
      },
    });
  }
  submit(): void {
    this.error.set(null);
    this.nameError.set(null);
    this.birthDateError.set(null);
    this.sexError.set(null);
    if (this.photoInput && !this.photoInput.valid()) return;
    if (!this.entityId()) {
      this.error.set(this.text().cats.edit.errors.catIdMissing);
      return;
    }
    if (!this.name().trim()) {
      this.nameError.set(this.text().cats.edit.errors.nameRequired);
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
    this.ownerSelector?.markSubmitted();
    this.vetSelector?.markSubmitted();
    if (!this.ownerId() || (this.vetRawContentPresent() && !this.vetId())) return;
    const request: UpdateCatRequest = {
      name: this.name().trim(),
      birthDate: this.birthDate(),
      sex: this.sex() as Sex,
      breed: this.optional(this.breed()),
      coat: this.optional(this.coat()),
      color: this.optional(this.color()),
      foodBrand: this.optional(this.foodBrand()),
      litterBrand: this.optional(this.litterBrand()),
      personality: this.optional(this.personality()),
      lastInternalDewormerName: this.optional(this.lastInternalDewormerName()),
      lastInternalDewormingDate: this.optional(this.lastInternalDewormingDate()),
      lastExternalDewormerName: this.optional(this.lastExternalDewormerName()),
      lastExternalDewormingDate: this.optional(this.lastExternalDewormingDate()),
      lastTripleFelineDate: this.optional(this.lastTripleFelineDate()),
      lastRabiesDate: this.optional(this.lastRabiesDate()),
      ownerId: this.ownerId(),
      vetId: this.optional(this.vetId()),
    };
    this.setSubmitting(true);
    const photoMutation = this.photoInput?.mutation() ?? { photo: null, removePhoto: false };
    this.api
      .updateCat(this.entityId(), request, photoMutation.photo, photoMutation.removePhoto)
      .subscribe({
        next: (c) => {
          this.photoInput?.reset();
          this.setSubmitting(false);
          this.saved.emit(c);
        },
        error: (e) => {
          this.error.set(
            catPhotoErrorMessage(e, this.text().cats.photo.errors) ??
              this.apiMessage(e, this.text().cats.edit.errors.updateFailed),
          );
          this.setSubmitting(false);
        },
      });
  }
  cancel(): void {
    this.photoInput?.reset();
    this.cancelled.emit();
  }
  ownerChanged(state: EntityLookupState<OwnerLookup>): void {
    this.ownerId.set(state.selectedId ?? '');
  }
  vetChanged(state: EntityLookupState<VetLookup>): void {
    this.vetId.set(state.selectedId ?? '');
    this.vetRawContentPresent.set(state.rawContentPresent);
  }
  private setSubmitting(value: boolean): void {
    this.submitting.set(value);
    this.submittingChanged.emit(value);
  }
  private setValues(c: Cat): void {
    this.initialCat = c;
    this.photoInput?.reset();
    this.name.set(c.name);
    this.birthDate.set(c.birthDate);
    this.sex.set(c.sex);
    this.ownerId.set(c.ownerId);
    this.vetId.set(c.vetId ?? '');
    this.vetRawContentPresent.set(c.vetId !== null);
    this.breed.set(c.breed ?? '');
    this.coat.set(c.coat ?? '');
    this.color.set(c.color ?? '');
    this.foodBrand.set(c.foodBrand ?? '');
    this.litterBrand.set(c.litterBrand ?? '');
    this.personality.set(c.personality ?? '');
    this.lastInternalDewormerName.set(c.lastInternalDewormerName ?? '');
    this.lastInternalDewormingDate.set(c.lastInternalDewormingDate ?? '');
    this.lastExternalDewormerName.set(c.lastExternalDewormerName ?? '');
    this.lastExternalDewormingDate.set(c.lastExternalDewormingDate ?? '');
    this.lastTripleFelineDate.set(c.lastTripleFelineDate ?? '');
    this.lastRabiesDate.set(c.lastRabiesDate ?? '');
    this.hasSavedPhoto.set(c.hasPhoto);
    this.catLoaded.set(true);
    this.ownerSelector?.trustInitialValue({ id: c.ownerId, label: c.ownerName });
    this.vetSelector?.trustInitialValue(
      c.vetId && c.vetName ? { id: c.vetId, label: c.vetName } : null,
    );
  }
  private optional(v: string): string | null {
    return v.trim() || null;
  }
  private apiMessage(e: unknown, f: string): string {
    if (!(e instanceof HttpErrorResponse)) return f;
    const b: unknown = e.error;
    if (this.isValidationMap(b)) {
      const errors = this.text().cats.edit.errors;
      const messages = Object.keys(b).flatMap((field) =>
        field === 'name'
          ? [errors.nameRequired]
          : field === 'birthDate'
            ? [errors.birthDateRequired]
            : field === 'sex'
              ? [errors.sexRequired]
              : field === 'ownerId'
                ? [errors.ownerRequired]
                : [],
      );
      return [...new Set(messages)].join('. ') || f;
    }
    return f;
  }
  private isValidationMap(value: unknown): value is Record<string, string> {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      Object.values(value).every((message) => typeof message === 'string')
    );
  }
}
