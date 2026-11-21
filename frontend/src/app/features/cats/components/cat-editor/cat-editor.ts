import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { RouterLink } from '@angular/router';
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
import {
  CAT_COAT_LENGTHS,
  Cat,
  CatCatalogSelection,
  CatCatalogSelectionField,
  CatLitterPreference,
  Sex,
  UpdateCatRequest,
} from '../../models/cat.model';
import { CatProfileOptionField } from '../../../../shared/cat-profile-options/cat-profile-option-field';
import { catLitterRequest } from '../../utils/cat-litter-label';
import { catCatalogSelectionRequest } from '../../utils/cat-catalog-selection';
import { CatBirthField, parseBirthYear } from '../cat-birth-field/cat-birth-field';
import { CatApiService } from '../../services/cat-api.service';
import { catPhotoErrorMessage } from '../../utils/cat-photo-error';
import { CatPhotoInput } from '../cat-photo-input/cat-photo-input';
import { CatCareFields } from '../cat-care-fields/cat-care-fields';
import { CatInformationalPhotoGallery } from '../cat-informational-photos/cat-informational-photo-gallery';
import { catPhotoRequestError } from '../../utils/cat-photo-file';

@Component({
  selector: 'app-cat-editor',
  imports: [
    FormsModule,
    RouterLink,
    MatButton,
    MatCheckbox,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    RemoteEntitySelector,
    TrimRequiredDirective,
    UiStateComponent,
    CatPhotoInput,
    CatInformationalPhotoGallery,
    CatCareFields,
    CatBirthField,
    CatProfileOptionField,
  ],
  templateUrl: '../../pages/cat-edit-page/cat-edit-page.html',
  styleUrl: '../../pages/cat-edit-page/cat-edit-page.scss',
})
export class CatEditor {
  private readonly photoInput = viewChild(CatPhotoInput);
  private readonly gallery = viewChild(CatInformationalPhotoGallery);
  private readonly initialDraft = signal<string | null>(null);
  private ownerSelector?: RemoteEntitySelector<OwnerLookup>;
  private vetSelector?: RemoteEntitySelector<VetLookup>;
  private initialCat: Cat | null = null;
  private readonly api = inject(CatApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);
  readonly entityId = input.required<string>();
  readonly entity = input<Cat | null>(null);
  readonly routed = input(false);
  readonly saved = output<Cat>();
  readonly reloaded = output<Cat>();
  readonly cancelled = output<void>();
  readonly submittingChanged = output<boolean>();
  readonly text = this.i18n.text;
  readonly ownerLookup = inject(OwnerLookupAdapter);
  readonly vetLookup = inject(VetLookupAdapter);
  readonly name = signal('');
  readonly deceased = signal(false);
  readonly birthDate = signal('');
  readonly birthYear = signal('');
  readonly yearOnly = signal(false);
  readonly sex = signal<Sex | ''>('');
  readonly ownerId = signal('');
  readonly vetId = signal('');
  readonly vetRawContentPresent = signal(false);
  readonly breed = signal('');
  readonly coat = signal('');
  readonly color = signal('');
  readonly foodBrand = signal('');
  readonly foodDetail = signal('');
  readonly catalogSelection = signal<CatCatalogSelection>({});
  readonly coatLengths = CAT_COAT_LENGTHS;
  readonly historicalCoat = signal('');
  readonly litterBrand = signal('');
  readonly litterPreference = signal<CatLitterPreference | null | undefined>(undefined);
  readonly personality = signal('');
  readonly careInstructions = signal('');
  readonly notes = signal('');
  readonly lastInternalDewormerName = signal('');
  readonly lastInternalDewormingDate = signal('');
  readonly lastExternalDewormerName = signal('');
  readonly lastExternalDewormingDate = signal('');
  readonly lastTripleFelineDate = signal('');
  readonly lastRabiesDate = signal('');
  readonly loadingData = signal(false);
  readonly submitting = signal(false);
  readonly staleEdit = signal(false);
  readonly formRevision = signal(0);
  readonly error = createLanguageResetError(this.i18n.language);
  readonly catLoaded = signal(false);
  readonly hasSavedPhoto = signal(false);
  readonly hasUnsavedChanges = computed(() => {
    const initial = this.initialDraft();
    const gallery = this.gallery();
    const photo = this.photoInput()?.mutation();
    return (
      initial !== null &&
      (this.draftValues() !== initial ||
        !!photo?.photo ||
        !!photo?.removePhoto ||
        !!gallery?.drafts().length ||
        !!gallery?.removals().length)
    );
  });
  readonly nameError = createLanguageResetError(this.i18n.language);
  readonly birthDateError = createLanguageResetError(this.i18n.language);
  readonly sexError = createLanguageResetError(this.i18n.language);
  readonly notesError = createLanguageResetError(this.i18n.language);
  readonly careInstructionsError = createLanguageResetError(this.i18n.language);
  readonly careInstructionsErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => this.careInstructionsError() !== null,
  };
  readonly notesErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => this.notesError() !== null,
  };

  setCatalogSelection(field: CatCatalogSelectionField, id?: string): void {
    this.catalogSelection.update((current) => ({ ...current, [field]: id }));
  }

  changeFoodBrand(value: string): void {
    if (value !== this.foodBrand()) {
      this.foodBrand.set(value);
      this.foodDetail.set('');
      this.setCatalogSelection('foodDetail');
    }
  }

  updateCareInstructions(value: string): void {
    this.careInstructions.set(value);
    this.careInstructionsError.set(
      value.trim().length > 2000 ? this.text().cats.form.careInstructionsTooLong : null,
    );
  }

  updateNotes(value: string): void {
    this.notes.set(value);
    this.notesError.set(value.length > 10000 ? this.text().cats.edit.errors.notesTooLong : null);
  }
  constructor() {
    effect(() => {
      const id = this.entityId();
      const entity = this.entity();
      if (entity?.id === id) {
        if (entity !== this.initialCat) this.setValues(entity);
      } else {
        this.catLoaded.set(false);
        this.loadCat(id);
      }
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
  reloadCat(): void {
    if (this.staleEdit() && !this.loadingData()) this.loadCat(this.entityId(), true);
  }
  private loadCat(id: string, reload = false): void {
    this.error.set(null);
    if (!id) {
      this.error.set(this.text().cats.edit.errors.catIdMissing);
      return;
    }
    this.loadingData.set(true);
    this.api
      .getCatById(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cat) => {
          if (id !== this.entityId()) return;
          this.setValues(cat);
          this.loadingData.set(false);
          if (reload) {
            this.formRevision.update((revision) => revision + 1);
            this.reloaded.emit(cat);
          }
        },
        error: (e) => {
          if (id !== this.entityId()) return;
          this.error.set(this.apiMessage(e, this.text().cats.edit.errors.loadFormDataFailed));
          this.loadingData.set(false);
        },
      });
  }
  submit(): void {
    if (this.staleEdit() || this.loadingData()) return;
    this.error.set(null);
    this.nameError.set(null);
    this.birthDateError.set(null);
    this.sexError.set(null);
    this.notesError.set(null);
    this.careInstructionsError.set(null);
    if (this.photoInput()?.valid() === false) return;
    if (!this.entityId()) {
      this.error.set(this.text().cats.edit.errors.catIdMissing);
      return;
    }
    const expectedUpdatedAt = this.initialCat?.updatedAt;
    if (!expectedUpdatedAt) {
      this.error.set(this.text().cats.edit.errors.dataNotLoaded);
      return;
    }
    if (!this.name().trim()) {
      this.nameError.set(this.text().cats.edit.errors.nameRequired);
      return;
    }
    const birthYear = this.yearOnly() ? parseBirthYear(this.birthYear()) : null;
    if (this.yearOnly() && birthYear === null) {
      this.birthDateError.set(this.text().cats.form.birthYearInvalid);
      return;
    }
    if (!this.yearOnly() && !this.birthDate()) {
      this.birthDateError.set(this.text().cats.edit.errors.birthDateRequired);
      return;
    }
    if (!this.sex()) {
      this.sexError.set(this.text().cats.edit.errors.sexRequired);
      return;
    }
    if (this.notes().length > 10000) {
      this.notesError.set(this.text().cats.edit.errors.notesTooLong);
      return;
    }
    const careInstructions = this.careInstructions().trim();
    if (careInstructions.length > 2000) {
      this.careInstructionsError.set(this.text().cats.form.careInstructionsTooLong);
      return;
    }

    this.ownerSelector?.markSubmitted();
    this.vetSelector?.markSubmitted();
    if (!this.ownerId() || (this.vetRawContentPresent() && !this.vetId())) return;
    const photoMutation = this.photoInput()?.mutation() ?? { photo: null, removePhoto: false };
    const attachments = this.gallery()?.files() ?? [];
    const photoError = catPhotoRequestError(photoMutation.photo, attachments, true);
    if (photoError) {
      this.error.set(this.text().cats.photo.errors[photoError]);
      return;
    }
    const removedInformationalPhotoIds = this.gallery()?.removals();
    const original = this.initialCat;
    const request: UpdateCatRequest = {
      expectedUpdatedAt,
      ...(removedInformationalPhotoIds?.length ? { removedInformationalPhotoIds } : {}),
      name: this.name().trim(),
      deceased: this.deceased(),
      birthDate: this.yearOnly() ? null : this.birthDate(),
      ...(birthYear === null ? {} : { birthYear }),
      sex: this.sex() as Sex,
      breed: this.storedValue(this.breed(), original?.breed),
      coat: this.storedValue(this.coat(), original?.coat),
      color: this.storedValue(this.color(), original?.color),
      ...(this.foodBrand() !== (original?.foodBrand ?? '')
        ? { foodBrand: this.optional(this.foodBrand()) }
        : {}),
      ...(this.foodDetail() !== (this.initialCat?.foodDetail ?? '')
        ? { foodDetail: this.optional(this.foodDetail()) }
        : {}),
      ...catCatalogSelectionRequest(this.catalogSelection(), this.savedCatalogSelection(original)),
      ...this.litterUpdate(original),
      personality: this.optional(this.personality()),
      ...(this.careInstructions() !== (this.initialCat?.careInstructions ?? '')
        ? { careInstructions: careInstructions || null }
        : {}),
      notes: this.optional(this.notes()),
      lastInternalDewormerName: this.storedValue(
        this.lastInternalDewormerName(),
        original?.lastInternalDewormerName,
      ),
      lastInternalDewormingDate: this.optional(this.lastInternalDewormingDate()),
      lastExternalDewormerName: this.storedValue(
        this.lastExternalDewormerName(),
        original?.lastExternalDewormerName,
      ),
      lastExternalDewormingDate: this.optional(this.lastExternalDewormingDate()),
      lastTripleFelineDate: this.optional(this.lastTripleFelineDate()),
      lastRabiesDate: this.optional(this.lastRabiesDate()),
      ownerId: this.ownerId(),
      vetId: this.optional(this.vetId()),
    };
    this.setSubmitting(true);
    this.api
      .updateCat(
        this.entityId(),
        request,
        photoMutation.photo,
        photoMutation.removePhoto,
        attachments,
      )
      .subscribe({
        next: (c) => {
          this.releaseDraftMedia();
          this.initialDraft.set(this.draftValues());
          this.setSubmitting(false);
          this.saved.emit(c);
        },
        error: (e) => {
          if (
            e instanceof HttpErrorResponse &&
            e.status === 409 &&
            e.error?.code === 'CAT_EDIT_STALE'
          ) {
            this.staleEdit.set(true);
          } else {
            this.error.set(
              catPhotoErrorMessage(e, this.text().cats.photo.errors) ??
                this.apiMessage(e, this.text().cats.edit.errors.updateFailed),
            );
          }
          this.setSubmitting(false);
        },
      });
  }
  cancel(): void {
    this.cancelled.emit();
  }
  releaseDraftMedia(): void {
    this.photoInput()?.reset();
    this.gallery()?.resetDraft();
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
    untracked(() => this.releaseDraftMedia());
    this.staleEdit.set(false);
    this.notesError.set(null);
    this.careInstructionsError.set(null);
    this.name.set(c.name);
    this.deceased.set(c.deceased ?? false);
    this.birthDateError.set(null);
    this.birthDate.set(c.birthDate ?? '');
    this.birthYear.set(c.birthYear?.toString() ?? '');
    this.yearOnly.set(!c.birthDate && c.birthYear != null);
    this.sex.set(c.sex);
    this.ownerId.set(c.ownerId);
    this.vetId.set(c.vetId ?? '');
    this.vetRawContentPresent.set(c.vetId !== null);
    this.breed.set(c.breed ?? '');
    this.coat.set(c.coat ?? '');
    this.historicalCoat.set(
      this.coatLengths.some((length) => length === c.coat) ? '' : (c.coat ?? ''),
    );
    this.color.set(c.color ?? '');
    this.foodBrand.set(c.foodBrand ?? '');
    this.foodDetail.set(c.foodDetail ?? '');
    this.catalogSelection.set(this.savedCatalogSelection(c));
    this.litterPreference.set(c.litterPreference);
    this.litterBrand.set((c.litterPreference === undefined ? c.litterBrand : c.litterDetail) ?? '');
    this.personality.set(c.personality ?? '');
    this.careInstructions.set(c.careInstructions ?? '');
    this.notes.set(c.notes ?? '');
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
    this.initialDraft.set(untracked(() => this.draftValues()));
  }
  private draftValues(): string {
    const catalogIds = Object.entries(this.catalogSelection())
      .filter(([, id]) => !!id)
      .sort(([left], [right]) => left.localeCompare(right));
    return JSON.stringify([
      this.name().trim(),
      this.deceased(),
      this.yearOnly(),
      this.yearOnly() ? this.birthYear() : this.birthDate(),
      this.sex(),
      this.ownerId(),
      this.vetId(),
      this.vetRawContentPresent(),
      this.breed().trim(),
      this.coat().trim(),
      this.color().trim(),
      this.foodBrand().trim(),
      this.foodDetail().trim(),
      catalogIds,
      this.litterPreference(),
      this.litterBrand().trim(),
      this.personality().trim(),
      this.careInstructions().trim(),
      this.notes().trim(),
      this.lastInternalDewormerName().trim(),
      this.lastInternalDewormingDate(),
      this.lastExternalDewormerName().trim(),
      this.lastExternalDewormingDate(),
      this.lastTripleFelineDate(),
      this.lastRabiesDate(),
    ]);
  }
  private litterUpdate(original: Cat | null) {
    const preference = this.litterPreference();
    const value = this.litterBrand();
    const originalValue =
      original?.litterPreference === undefined ? original?.litterBrand : original.litterDetail;
    const selection = this.catalogSelection().litterDetail;
    const newSelection = selection && selection !== original?.catalogOptionIds?.litterDetail;
    if (
      preference !== original?.litterPreference ||
      value !== (originalValue ?? '') ||
      newSelection
    ) {
      return catLitterRequest(value, newSelection ? 'OWN' : preference);
    }
    return {};
  }

  private savedCatalogSelection(cat: Cat | null): CatCatalogSelection {
    return {
      breed: cat?.catalogOptionIds?.breed,
      foodBrand: cat?.foodBrandId ?? undefined,
      foodDetail: cat?.catalogOptionIds?.foodDetail,
      litterDetail: cat?.catalogOptionIds?.litterDetail,
      lastInternalDewormerName: cat?.catalogOptionIds?.lastInternalDewormerName,
      lastExternalDewormerName: cat?.catalogOptionIds?.lastExternalDewormerName,
    };
  }
  private storedValue(value: string, saved?: string | null): string | null {
    return value === saved ? saved : this.optional(value);
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
