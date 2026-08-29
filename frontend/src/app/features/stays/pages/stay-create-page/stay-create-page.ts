import { HttpErrorResponse } from '@angular/common/http';
import { AfterViewInit, Component, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import {
  CREATION_FLOW_QUERY_PARAM,
  CreationFlowId,
  StayCreationDraft,
} from '../../../../core/creation-flow/creation-flow.models';
import { CreationFlowService } from '../../../../core/creation-flow/creation-flow.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { OwnerLookupAdapter } from '../../../../shared/entity-lookup/domain-lookup.adapters';
import { RemoteEntitySelector } from '../../../../shared/entity-lookup/remote-entity-selector';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { OwnerLookup } from '../../../owners/models/owner.model';
import {
  VaccineConflictDialog,
  VaccineConflictDialogData,
} from '../../components/vaccine-conflict-dialog/vaccine-conflict-dialog';
import {
  CreateStayRequest,
  CreationPricingPreview,
  isStalePricingConfirmationError,
  isVaccineConflictError,
  VaccineConflictResponse,
} from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { calculateStayNights } from '../../utils/stay-nights.util';
import { isValidWholeMoney, sameWholeMoney } from '../../utils/stay-money.util';

@Component({
  selector: 'app-stay-create-page',
  imports: [
    FormsModule,
    MatButton,
    MatCheckbox,
    MatFormField,
    MatError,
    MatInput,
    MatLabel,
    MatProgressSpinner,
    RemoteEntitySelector,
    UiStateComponent,
  ],
  templateUrl: './stay-create-page.html',
  styleUrl: './stay-create-page.scss',
})
export class StayCreatePage implements AfterViewInit {
  private readonly stayApiService = inject(StayApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18nService = inject(I18nService);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly creationFlow = inject(CreationFlowService);
  private readonly dialog = inject(MatDialog);
  private readonly ownerSelector = viewChild.required(RemoteEntitySelector<OwnerLookup>);

  readonly text = this.i18nService.text;
  readonly ownerLookupAdapter = inject(OwnerLookupAdapter);
  readonly selectedOwner = signal<OwnerLookup | null>(null);

  readonly selectedOwnerId = computed(() => this.selectedOwner()?.id ?? '');
  readonly selectedCatIds = signal<string[]>([]);

  readonly startAt = signal(this.getDefaultDateTimeLocalValue(0));
  readonly endAt = signal(this.getDefaultDateTimeLocalValue(7));
  readonly notes = signal('');
  readonly agreedAmount = signal('');
  readonly pricingReason = signal('');
  readonly pricingReasonContext = signal<'untouched' | 'manual' | 'suggested'>('untouched');
  readonly pricingPreview = signal<CreationPricingPreview | null>(null);
  readonly previewLoading = signal(false);
  readonly previewError = createLanguageResetError(this.i18nService.language);
  readonly pricingConfirmed = signal(false);
  readonly stalePricing = signal(false);
  readonly numberOfNights = computed(() => calculateStayNights(this.startAt(), this.endAt()));
  readonly nightCountLabel = computed(() => {
    const numberOfNights = this.numberOfNights();

    if (numberOfNights === null) {
      return '';
    }

    const unit =
      numberOfNights === 1 ? this.text().stays.nights.singular : this.text().stays.nights.plural;

    return `${numberOfNights} ${unit}`;
  });

  readonly submitting = signal(false);
  readonly error = createLanguageResetError(this.i18nService.language);
  readonly notesError = createLanguageResetError(this.i18nService.language);
  readonly notesErrorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => this.notesError() !== null,
  };

  updateNotes(value: string): void {
    this.notes.set(value);
    this.notesError.set(value.length > 10000 ? this.text().stays.create.errors.notesTooLong : null);
  }

  readonly availableCats = computed(() => this.selectedOwner()?.currentCats ?? []);
  readonly reasonRequired = computed(() => {
    const suggestion = this.pricingPreview()?.suggestedAmount;
    return (
      suggestion !== null &&
      suggestion !== undefined &&
      !sameWholeMoney(this.agreedAmount(), suggestion)
    );
  });
  readonly decisionValid = computed(
    () =>
      isValidWholeMoney(this.agreedAmount()) &&
      (!this.reasonRequired() || this.pricingReason().trim().length > 0),
  );
  readonly amountValid = computed(() => isValidWholeMoney(this.agreedAmount()));
  readonly pricingReasonPlaceholder = computed(() => {
    if (this.pricingReasonContext() === 'suggested') {
      return this.text().stays.pricing.reasonSuggestedPlaceholder;
    }
    if (this.pricingReasonContext() === 'manual') {
      return this.text().stays.pricing.reasonDifferentPlaceholder;
    }
    return '';
  });

  private previewRequestSequence = 0;
  private ownerResetGeneration = 0;
  private vaccineOverrideRecoveryBasis: string | null = null;
  private returnQuerySelectionApplicable = true;
  private pendingRestoredCatIds: string[] | null = null;

  ngAfterViewInit(): void {
    const flowId = this.route.snapshot.queryParamMap.get(CREATION_FLOW_QUERY_PARAM);
    if (flowId) {
      const draft = this.creationFlow.consumeStay(flowId);
      if (draft) this.restoreDraft(draft);
      return;
    }

    const queryOwnerId = this.route.snapshot.queryParamMap.get('ownerId');
    if (queryOwnerId) this.ownerSelector().resolveKnownId(queryOwnerId);
  }

  onOwnerLookupInput(): void {
    this.returnQuerySelectionApplicable = false;
    this.pendingRestoredCatIds = null;
  }

  onOwnerChange(owner: OwnerLookup | null): void {
    if (owner === this.selectedOwner()) return;
    this.resetOwnerDependentState();
    this.selectedOwner.set(owner);

    if (owner && this.pendingRestoredCatIds) {
      const validCatIds = new Set(owner.currentCats.map((cat) => cat.id));
      this.selectedCatIds.set(
        [...new Set(this.pendingRestoredCatIds)].filter((catId) => validCatIds.has(catId)),
      );
      this.pendingRestoredCatIds = null;
      this.refreshPricingPreview();
      return;
    }

    if (owner && this.returnQuerySelectionApplicable) {
      this.returnQuerySelectionApplicable = false;
      const queryOwnerId = this.route.snapshot.queryParamMap.get('ownerId');
      const queryCatId = this.route.snapshot.queryParamMap.get('catId');
      if (
        owner.id === queryOwnerId &&
        queryCatId &&
        owner.currentCats.some((cat) => cat.id === queryCatId)
      ) {
        this.selectedCatIds.set([queryCatId]);
        this.refreshPricingPreview();
      }
    }
  }

  private resetOwnerDependentState(): void {
    this.ownerResetGeneration++;
    this.clearVaccineOverrideRecovery();
    this.selectedCatIds.set([]);
    this.previewRequestSequence++;
    this.pricingPreview.set(null);
    this.previewLoading.set(false);
    this.previewError.set(null);
    this.pricingConfirmed.set(false);
    this.stalePricing.set(false);
    if (this.pricingReasonContext() === 'suggested') this.pricingReasonContext.set('manual');
  }

  onCatToggle(catId: string, checked: boolean): void {
    this.clearVaccineOverrideRecovery();
    if (checked) {
      this.selectedCatIds.update((catIds) => [...catIds, catId]);
      this.refreshPricingPreview();
      return;
    }

    this.selectedCatIds.update((catIds) => catIds.filter((currentCatId) => currentCatId !== catId));
    this.refreshPricingPreview();
  }

  onStartAtChange(value: string): void {
    this.clearVaccineOverrideRecovery();
    this.startAt.set(value);
    this.refreshPricingPreview();
  }

  onEndAtChange(value: string): void {
    this.clearVaccineOverrideRecovery();
    this.endAt.set(value);
    this.refreshPricingPreview();
  }

  onPricingDecisionChange(): void {
    this.pricingConfirmed.set(false);
  }

  onAgreedAmountChange(value: string): void {
    this.agreedAmount.set(value);
    this.pricingReasonContext.set('manual');
    this.onPricingDecisionChange();
  }

  confirmPricing(): void {
    if (!this.previewLoading() && this.pricingPreview() && this.decisionValid()) {
      this.pricingConfirmed.set(true);
      this.stalePricing.set(false);
      this.scrollToSubmit();
    }
  }

  useSuggestedAmount(): void {
    if (this.previewLoading()) return;

    const suggestedAmount = this.pricingPreview()?.suggestedAmount;
    if (suggestedAmount === null || suggestedAmount === undefined) return;

    this.agreedAmount.set(suggestedAmount);
    this.pricingReason.set('');
    this.pricingReasonContext.set('suggested');
    this.pricingConfirmed.set(true);
    this.stalePricing.set(false);
    this.scrollToSubmit();
  }

  toggleCatFromPill(event: MouseEvent, catId: string): void {
    if (event.target !== event.currentTarget) {
      return;
    }

    this.onCatToggle(catId, !this.isCatSelected(catId));
  }

  isCatSelected(catId: string): boolean {
    return this.selectedCatIds().includes(catId);
  }

  submit(): void {
    this.error.set(null);
    this.notesError.set(null);

    if (this.notes().length > 10000) {
      this.notesError.set(this.text().stays.create.errors.notesTooLong);
      return;
    }

    if (!this.ownerSelector().markSubmitted() || !this.selectedOwner()) return;

    if (this.selectedCatIds().length === 0) {
      this.error.set(this.text().stays.create.errors.selectAtLeastOneCat);
      return;
    }

    if (!this.startAt() || !this.endAt()) {
      this.error.set(this.text().stays.create.errors.datesRequired);
      return;
    }

    if (new Date(this.endAt()) <= new Date(this.startAt())) {
      this.error.set(this.text().stays.create.errors.endAfterStart);
      return;
    }

    const preview = this.pricingPreview();
    if (this.previewLoading() || !preview || !this.pricingConfirmed() || !this.decisionValid()) {
      this.error.set(this.text().stays.pricing.errors.confirmationRequired);
      return;
    }

    const basis = this.currentPreviewBasis();
    const overrideVaccineConflicts = this.vaccineOverrideRecoveryBasis === basis;
    const request: CreateStayRequest = {
      catIds: this.selectedCatIds(),
      startAt: this.startAt(),
      endAt: this.endAt(),
      notes: this.notes().trim() || null,
      overrideVaccineConflicts,
      pricingDecision: {
        agreedAmount: this.agreedAmount(),
        reason: this.pricingReason().trim() || null,
      },
      confirmation: preview.confirmation,
    };

    this.saveStay(request, !overrideVaccineConflicts, basis, this.ownerResetGeneration);
  }

  cancel(): void {
    if (this.submitting()) return;
    this.clearRootFlow();
    this.router.navigate(['/stays']);
  }

  createRelated(kind: 'owner' | 'cat', event: Event): void {
    event.preventDefault();
    if (this.submitting()) return;

    const existingId = this.route.snapshot.queryParamMap.get(CREATION_FLOW_QUERY_PARAM);
    const flowId =
      this.creationFlow.has(existingId) && this.creationFlow.root(existingId) === 'stay'
        ? existingId
        : this.creationFlow.start('stay');
    this.creationFlow.captureStay(flowId, this.captureDraft());
    const destination = kind === 'owner' ? '/owners/new' : '/cats/new';
    this.creationFlow.expectHop(flowId, '/stays/new', destination);
    const queryParams: Record<string, string> = {
      returnTo: '/stays/new',
      [CREATION_FLOW_QUERY_PARAM]: flowId,
    };
    if (kind === 'cat') queryParams['ownerId'] = this.selectedOwnerId();
    this.router.navigate([destination], { queryParams });
  }

  private saveStay(
    request: CreateStayRequest,
    showVaccineConflict: boolean,
    basis: string,
    ownerGeneration: number,
  ): void {
    this.submitting.set(true);

    this.stayApiService.createStay(request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.clearRootFlow();
        this.router.navigate(['/stays']);
      },
      error: (error: unknown) => {
        this.submitting.set(false);
        if (ownerGeneration !== this.ownerResetGeneration) return;

        if (isStalePricingConfirmationError(error)) {
          this.vaccineOverrideRecoveryBasis = request.overrideVaccineConflicts ? basis : null;
          this.stalePricing.set(true);
          this.pricingConfirmed.set(false);
          this.error.set(this.text().stays.pricing.errors.stale);
          this.refreshPricingPreview();
          return;
        }
        if (showVaccineConflict && isVaccineConflictError(error)) {
          this.openVaccineConflictDialog(error.error, request, basis, ownerGeneration);
          return;
        }

        if (request.overrideVaccineConflicts) {
          this.clearVaccineOverrideRecovery();
        }
        this.error.set(this.getCreateStayErrorMessage(error));
      },
    });
  }

  private openVaccineConflictDialog(
    conflict: VaccineConflictResponse,
    request: CreateStayRequest,
    basis: string,
    ownerGeneration: number,
  ): void {
    const canOverride = this.authSessionService.hasRole('ADMIN');
    const data: VaccineConflictDialogData = {
      violations: conflict.violations,
      canOverride,
    };

    this.dialog
      .open<VaccineConflictDialog, VaccineConflictDialogData, boolean>(VaccineConflictDialog, {
        data,
        width: '36rem',
        maxWidth: 'calc(100vw - 2rem)',
      })
      .afterClosed()
      .subscribe((confirmed) => {
        if (
          confirmed !== true ||
          !canOverride ||
          !this.authSessionService.hasRole('ADMIN') ||
          ownerGeneration !== this.ownerResetGeneration ||
          basis !== this.currentPreviewBasis()
        ) {
          return;
        }

        this.saveStay(
          { ...request, overrideVaccineConflicts: true },
          false,
          basis,
          ownerGeneration,
        );
      });
  }

  private refreshPricingPreview(): void {
    if (this.pricingReasonContext() === 'suggested') this.pricingReasonContext.set('manual');
    this.pricingConfirmed.set(false);
    this.previewError.set(null);
    const sequence = ++this.previewRequestSequence;

    if (
      this.selectedCatIds().length === 0 ||
      !this.startAt() ||
      !this.endAt() ||
      new Date(this.endAt()) <= new Date(this.startAt())
    ) {
      this.pricingPreview.set(null);
      this.previewLoading.set(false);
      return;
    }

    const catIds = [...this.selectedCatIds()].sort();
    const basis = JSON.stringify([this.startAt(), this.endAt(), catIds]);
    this.previewLoading.set(true);

    this.stayApiService
      .previewCreationPricing({ startAt: this.startAt(), endAt: this.endAt(), catIds })
      .subscribe({
        next: (preview) => {
          if (sequence !== this.previewRequestSequence || basis !== this.currentPreviewBasis()) {
            return;
          }
          this.pricingPreview.set(preview);
          this.previewLoading.set(false);
        },
        error: () => {
          if (sequence !== this.previewRequestSequence) return;
          this.pricingPreview.set(null);
          this.previewLoading.set(false);
          this.previewError.set(this.text().stays.pricing.errors.previewFailed);
        },
      });
  }

  private currentPreviewBasis(): string {
    return JSON.stringify([this.startAt(), this.endAt(), [...this.selectedCatIds()].sort()]);
  }

  private scrollToSubmit(): void {
    document
      .getElementById('create-stay-submit')
      ?.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
  }

  private clearVaccineOverrideRecovery(): void {
    this.vaccineOverrideRecoveryBasis = null;
  }

  private captureDraft(): StayCreationDraft {
    return {
      ownerId: this.selectedOwnerId(),
      catIds: this.selectedCatIds(),
      startAt: this.startAt(),
      endAt: this.endAt(),
      notes: this.notes(),
      agreedAmount: this.agreedAmount(),
      pricingReason: this.pricingReason(),
    };
  }

  private restoreDraft(draft: StayCreationDraft): void {
    this.startAt.set(draft.startAt);
    this.endAt.set(draft.endAt);
    this.notes.set(draft.notes);
    this.agreedAmount.set(draft.agreedAmount);
    this.pricingReason.set(draft.pricingReason);
    this.pricingReasonContext.set('manual');
    this.clearVaccineOverrideRecovery();
    this.previewRequestSequence++;
    this.pricingPreview.set(null);
    this.previewLoading.set(false);
    this.previewError.set(null);
    this.pricingConfirmed.set(false);
    this.stalePricing.set(false);
    this.error.set(null);
    this.notesError.set(null);

    const returnedOwnerId = this.route.snapshot.queryParamMap.get('ownerId');
    const returnedCatId = this.route.snapshot.queryParamMap.get('catId');
    let ownerId = draft.ownerId;
    let catIds = draft.catIds;

    if (returnedCatId) {
      ownerId = returnedOwnerId || draft.ownerId;
      catIds = ownerId === draft.ownerId ? [...draft.catIds, returnedCatId] : [returnedCatId];
    } else if (returnedOwnerId && returnedOwnerId !== draft.ownerId) {
      ownerId = returnedOwnerId;
      catIds = [];
    }

    if (!ownerId) return;
    this.returnQuerySelectionApplicable = false;
    this.pendingRestoredCatIds = catIds;
    this.ownerSelector().resolveKnownId(ownerId);
  }

  private clearRootFlow(): void {
    const flowId = this.route.snapshot.queryParamMap.get(CREATION_FLOW_QUERY_PARAM);
    if (flowId && this.creationFlow.root(flowId) === 'stay') this.creationFlow.clear(flowId);
  }

  private getCreateStayErrorMessage(error: unknown): string {
    const fallbackMessage = this.text().stays.create.errors.createFailed;

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

  private getDefaultDateTimeLocalValue(daysToAdd: number): string {
    const date = new Date();

    date.setDate(date.getDate() + daysToAdd);
    date.setHours(10, 0, 0, 0);

    return this.toDateTimeLocalValue(date);
  }

  private toDateTimeLocalValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
