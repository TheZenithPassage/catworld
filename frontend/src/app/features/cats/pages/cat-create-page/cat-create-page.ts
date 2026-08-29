import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, inject, signal, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { CREATION_FLOW_QUERY_PARAM } from '../../../../core/creation-flow/creation-flow.models';
import { CreationFlowService } from '../../../../core/creation-flow/creation-flow.service';
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
  private readonly creationFlow = inject(CreationFlowService);

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
  readonly notes = signal('');
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
  readonly notesError = createLanguageResetError(this.i18nService.language);
  readonly notesErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => this.notesError() !== null,
  };

  updateNotes(value: string): void {
    this.notes.set(value);
    this.notesError.set(value.length > 10000 ? this.text().cats.create.errors.notesTooLong : null);
  }
  ngAfterViewInit(): void {
    const queryParamMap = this.route.snapshot.queryParamMap;
    const flowId = queryParamMap.get(CREATION_FLOW_QUERY_PARAM);
    const hasFlowMarker = queryParamMap.has(CREATION_FLOW_QUERY_PARAM);
    const hasMatchingFlow = this.creationFlow.has(flowId);
    const draft = hasMatchingFlow ? this.creationFlow.consumeCat(flowId) : null;
    if (draft) {
      this.name.set(draft.name);
      this.birthDate.set(draft.birthDate);
      this.sex.set(draft.sex);
      this.breed.set(draft.breed);
      this.coat.set(draft.coat);
      this.color.set(draft.color);
      this.foodBrand.set(draft.foodBrand);
      this.litterBrand.set(draft.litterBrand);
      this.personality.set(draft.personality);
      this.notes.set(draft.notes);
      this.lastInternalDewormerName.set(draft.lastInternalDewormerName);
      this.lastInternalDewormingDate.set(draft.lastInternalDewormingDate);
      this.lastExternalDewormerName.set(draft.lastExternalDewormerName);
      this.lastExternalDewormingDate.set(draft.lastExternalDewormingDate);
      this.lastTripleFelineDate.set(draft.lastTripleFelineDate);
      this.lastRabiesDate.set(draft.lastRabiesDate);
      const returnedOwnerId = this.route.snapshot.queryParamMap.get('ownerId');
      const returnedVetId = this.route.snapshot.queryParamMap.get('vetId');
      const ownerId = returnedOwnerId || draft.ownerId;
      const vetId = returnedVetId || draft.vetId;
      if (ownerId) this.ownerSelector?.resolveKnownId(ownerId);
      if (vetId) this.vetSelector?.resolveKnownId(vetId);
      if (draft.photo) this.photoInput?.restore(draft.photo);
      return;
    }
    if (!hasFlowMarker) {
      const ownerId = queryParamMap.get('ownerId');
      const vetId = queryParamMap.get('vetId');
      if (ownerId) this.ownerSelector?.resolveKnownId(ownerId);
      if (vetId) this.vetSelector?.resolveKnownId(vetId);
    } else if (hasMatchingFlow && this.creationFlow.root(flowId) === 'stay') {
      const ownerId = queryParamMap.get('ownerId');
      if (ownerId) this.ownerSelector?.resolveKnownId(ownerId);
    }
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
    if (this.notes().length > 10000) {
      this.notesError.set(this.text().cats.create.errors.notesTooLong);
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
      notes: this.toNullableString(this.notes()),
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
    if (this.submitting()) return;

    this.photoInput?.reset();
    const returnTo = this.route.snapshot.queryParamMap.get('returnTo');
    if (returnTo === '/stays/new') {
      const queryParams: Record<string, string> = {};
      const flowId = this.route.snapshot.queryParamMap.get(CREATION_FLOW_QUERY_PARAM);
      const isStayFlow = this.creationFlow.has(flowId) && this.creationFlow.root(flowId) === 'stay';
      if (!isStayFlow) {
        const ownerId =
          this.ownerId() ||
          (!this.ownerLookupStateReceived
            ? this.route.snapshot.queryParamMap.get('ownerId')
            : null);
        if (ownerId) queryParams['ownerId'] = ownerId;
      }
      this.prepareFlowReturn('/stays/new', queryParams);
      this.router.navigate(['/stays/new'], {
        queryParams: Object.keys(queryParams).length > 0 ? queryParams : undefined,
      });
      return;
    }
    this.clearRootFlow();
    this.router.navigate(['/cats']);
  }

  private clearValidationErrors(): void {
    this.nameError.set(null);
    this.birthDateError.set(null);
    this.sexError.set(null);
    this.notesError.set(null);
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

  createRelated(kind: 'owner' | 'vet', event: Event): void {
    event.preventDefault();
    if (this.submitting()) return;
    const existingId = this.route.snapshot.queryParamMap.get(CREATION_FLOW_QUERY_PARAM);
    const flowId = this.creationFlow.has(existingId) ? existingId : this.creationFlow.start('cat');
    this.creationFlow.captureCat(flowId, this.captureDraft());
    const destination = kind === 'owner' ? '/owners/new' : '/vets/new';
    this.creationFlow.expectHop(flowId, '/cats/new', destination);
    const queryParams =
      kind === 'owner' ? this.getCreateOwnerQueryParams() : this.getCreateVetQueryParams();
    queryParams[CREATION_FLOW_QUERY_PARAM] = flowId;
    this.router.navigate([destination], { queryParams });
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
      const queryParams: Record<string, string> = { ownerId, catId };
      this.prepareFlowReturn('/stays/new', queryParams);
      this.router.navigate(['/stays/new'], {
        queryParams,
      });
      return;
    }

    this.clearRootFlow();
    this.router.navigate(['/cats']);
  }

  private captureDraft() {
    return {
      name: this.name(),
      birthDate: this.birthDate(),
      sex: this.sex(),
      breed: this.breed(),
      coat: this.coat(),
      color: this.color(),
      foodBrand: this.foodBrand(),
      litterBrand: this.litterBrand(),
      personality: this.personality(),
      notes: this.notes(),
      lastInternalDewormerName: this.lastInternalDewormerName(),
      lastInternalDewormingDate: this.lastInternalDewormingDate(),
      lastExternalDewormerName: this.lastExternalDewormerName(),
      lastExternalDewormingDate: this.lastExternalDewormingDate(),
      lastTripleFelineDate: this.lastTripleFelineDate(),
      lastRabiesDate: this.lastRabiesDate(),
      ownerId: this.ownerId(),
      vetId: this.vetId(),
      photo: this.photoInput?.mutation().photo ?? null,
    };
  }

  private prepareFlowReturn(destination: string, queryParams: Record<string, string>): void {
    const queryParamMap = this.route.snapshot.queryParamMap;
    if (!queryParamMap.has(CREATION_FLOW_QUERY_PARAM)) return;
    const flowId = queryParamMap.get(CREATION_FLOW_QUERY_PARAM) ?? '';
    if (this.creationFlow.has(flowId) && this.creationFlow.root(flowId) === 'cat') {
      this.creationFlow.clear(flowId);
      return;
    }
    queryParams[CREATION_FLOW_QUERY_PARAM] = flowId;
    if (this.creationFlow.has(flowId)) {
      this.creationFlow.expectHop(flowId, '/cats/new', destination);
    }
  }

  private clearRootFlow(): void {
    const flowId = this.route.snapshot.queryParamMap.get(CREATION_FLOW_QUERY_PARAM);
    if (flowId && this.creationFlow.root(flowId) === 'cat') this.creationFlow.clear(flowId);
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
