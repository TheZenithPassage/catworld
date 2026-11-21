import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, TemplateRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import {
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { ActivatedRoute, Router } from '@angular/router';
import { distinctUntilChanged, finalize, map, Observable, Subscription } from 'rxjs';

import { I18nService } from '../../core/i18n/i18n.service';
import { CAT_INTAKE_TRANSLATIONS } from '../../core/i18n/translations/cat-intake.translations';
import { BusinessTimeService } from '../../core/time/business-time.service';
import { CatProfileOptionField } from '../../shared/cat-profile-options/cat-profile-option-field';
import { CatalogTextConfirmation } from '../../shared/cat-profile-options/catalog-text-confirmation';
import {
  catalogOptionKey,
  CatProfileOptionsService,
  matchingFoodBrandId,
} from '../../shared/cat-profile-options/cat-profile-options.service';
import { formatLocalDate } from '../../shared/date/local-date-format';
import { EntityDetailDialogService } from '../../shared/entity-detail/entity-detail-dialog.service';
import {
  CAT_COAT_LENGTHS,
  CATWORLD_LITTER,
  OWN_LITTER,
  CatCatalogSelection,
  CatCatalogSelectionField,
} from '../cats/models/cat.model';
import {
  catLitterChoice,
  catLitterLabel,
  catOwnLitterDetail,
} from '../cats/utils/cat-litter-label';
import { CatIntakeApi } from './cat-intake-api';
import {
  CAT_INTAKE_FIELDS,
  CatIntakeApproval,
  CatIntakeField,
  CatIntakeFieldKey,
  CatIntakeFields,
  CatIntakeReviewDetail,
  CatIntakeReviewItem,
  CatIntakeReviewVersion,
} from './cat-intake-models';

type Decision = 'apply' | 'keep' | 'unresolved';
type ReviewAction = 'approve' | 'dismiss';

interface ReviewField {
  field: CatIntakeField;
  value: string;
  conflict: boolean;
  decision: Decision;
}

type ReviewPhotoState =
  | { state: 'loading' | 'failed' | 'excluded' }
  | { state: 'loaded'; url: string; selected: boolean };

type ReviewPhoto = { id: string } & ReviewPhotoState;

interface ReviewGroup {
  ownerId: string;
  ownerName: string;
  items: CatIntakeReviewItem[];
}

@Component({
  selector: 'app-cat-intake-review',
  imports: [
    CatProfileOptionField,
    MatButton,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
  ],
  templateUrl: './cat-intake-review.html',
  styleUrl: './cat-intake-review.scss',
})
export class CatIntakeReview {
  private readonly api = inject(CatIntakeApi);
  private readonly profileOptions = inject(CatProfileOptionsService);
  private readonly catalogTextConfirmation = inject(CatalogTextConfirmation);
  private readonly i18n = inject(I18nService);
  private readonly businessTime = inject(BusinessTimeService);
  private readonly dialog = inject(MatDialog);
  private readonly details = inject(EntityDetailDialogService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private detailRequests = new Subscription();
  private photoDialog?: MatDialogRef<unknown>;

  readonly copy = computed(() => CAT_INTAKE_TRANSLATIONS[this.i18n.language()].review);
  readonly catCopy = computed(() => this.i18n.text().cats);
  readonly litterChoice = catLitterChoice;
  readonly litterDetail = signal<string | undefined>(undefined);
  readonly catalogSelection = signal<CatCatalogSelection>({});
  readonly coatLengths = CAT_COAT_LENGTHS;
  readonly pending = signal<CatIntakeReviewItem[]>([]);
  readonly groups = computed(() => {
    const groups = new Map<string, ReviewGroup>();
    for (const item of this.pending()) {
      let group = groups.get(item.ownerId);
      if (!group) {
        group = { ownerId: item.ownerId, ownerName: item.ownerName, items: [] };
        groups.set(item.ownerId, group);
      }
      group.items.push(item);
    }
    return [...groups.values()];
  });
  readonly loading = signal(true);
  readonly listFailed = signal(false);
  readonly selectedId = signal<string | null>(null);
  readonly detail = signal<CatIntakeReviewDetail | null>(null);
  readonly loadingDetail = signal(false);
  readonly detailFailed = signal(false);
  readonly notice = signal<
    | 'approved'
    | 'dismissed'
    | 'approveFailed'
    | 'dismissFailed'
    | 'stale'
    | 'unavailable'
    | 'catalogChanged'
    | null
  >(null);
  readonly saving = signal<ReviewAction | null>(null);
  readonly adjusting = signal(false);
  readonly confirmingDismiss = signal(false);
  readonly fields = signal<ReviewField[]>([]);
  readonly photos = signal<ReviewPhoto[]>([]);
  readonly birthKey = signal<'birthDate' | 'birthYear'>('birthDate');
  readonly unansweredRequests = computed(() =>
    (this.detail()?.unansweredRequestedFields ?? []).map((key) => this.fieldLabel(key)).join(', '),
  );
  readonly showExistingFieldChoices = computed(
    () => this.fields().length > 1 || this.photos().length > 0,
  );
  readonly selectedFields = computed(() => {
    const selected: CatIntakeFields = {};
    for (const { field, decision, value } of this.fields()) {
      const key = field.key === 'birthDate' ? this.birthKey() : field.key;
      if (decision === 'apply' && value.trim()) selected[key] = value.trim();
    }
    const explicitLitter = this.litterDetail()?.trim();
    const litterDetail =
      explicitLitter ??
      (this.catalogSelection().litterDetail ? catOwnLitterDetail(selected.litterBrand).trim() : '');
    if (catLitterChoice(selected.litterBrand) === 'own' && litterDetail) {
      selected.litterDetail = litterDetail;
    }
    return selected;
  });
  readonly foodBrandForApproval = computed(
    () => this.selectedFields().foodBrand ?? this.detail()?.current?.foodBrand ?? '',
  );
  readonly foodBrandIdForApproval = computed(() => {
    const brands = this.profileOptions.catalog()?.foodBrand ?? [];
    const selectedBrand = this.selectedFields().foodBrand;
    if (!selectedBrand) {
      const id = this.detail()?.currentFoodBrandId;
      return brands.find((brand) => brand.id === id)?.id;
    }
    const explicitId = this.catalogSelection().foodBrand;
    if (explicitId || this.retiredOption('foodBrand')) return explicitId;
    return matchingFoodBrandId(brands, selectedBrand);
  });
  readonly foodDetailBrandMismatch = computed(() => {
    const detail = this.detail();
    const selected = this.selectedFields();
    if (
      !detail?.proposedFoodDetailBrand ||
      !selected.foodDetail ||
      this.catalogSelection().foodDetail ||
      this.retiredOption('foodDetail')
    )
      return false;
    return (
      catalogOptionKey(this.foodBrandForApproval()) !==
      catalogOptionKey(detail.proposedFoodDetailBrand)
    );
  });
  private readonly selectedPhotoIds = computed(() =>
    this.photos()
      .filter((photo) => photo.state === 'loaded' && photo.selected)
      .map(({ id }) => id),
  );
  readonly emptyApproval = computed(
    () =>
      this.detail()?.catId != null &&
      Object.keys(this.selectedFields()).length === 0 &&
      this.selectedPhotoIds().length === 0,
  );
  readonly canApprove = computed(() => {
    const detail = this.detail();
    return (
      detail !== null &&
      !this.saving() &&
      !this.confirmingDismiss() &&
      !this.emptyApproval() &&
      !this.foodDetailBrandMismatch() &&
      Number.isSafeInteger(detail.revision) &&
      this.photos().every(({ state }) => state === 'loaded' || state === 'excluded') &&
      this.fields().every(({ field, decision, value }) => {
        if (decision === 'unresolved') return false;
        if (decision === 'keep') return true;
        if (field.key === 'birthDate' && this.birthKey() === 'birthYear')
          return this.validBirthYear(value);
        return !!value.trim() || (detail.catId === null && !this.requiredForCreation(field));
      })
    );
  });

  constructor() {
    this.destroyRef.onDestroy(() => this.clearDetail());
    this.route.queryParamMap
      .pipe(
        map((params) => params.get('reviewId')),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((id) => {
        if (id) this.open(id);
        else if (this.selectedId()) this.back();
      });
    if (!this.route.snapshot.queryParamMap.get('reviewId')) this.loadPending();
  }

  loadPending(): void {
    this.loading.set(true);
    this.listFailed.set(false);
    this.api
      .listReview()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.pending.set(items);
          this.loading.set(false);
        },
        error: () => {
          this.listFailed.set(true);
          this.loading.set(false);
        },
      });
  }

  open(id: string, stale = false): void {
    if (this.saving()) return;
    this.clearDetail();
    this.selectedId.set(id);
    this.notice.set(stale ? 'stale' : null);
    this.loadingDetail.set(true);
    this.detailFailed.set(false);
    this.detailRequests.add(
      this.api.getReview(id).subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.litterDetail.set(detail.proposed.litterDetail ?? undefined);
          this.birthKey.set(detail.proposed.birthYear ? 'birthYear' : 'birthDate');
          this.fields.set(
            CAT_INTAKE_FIELDS.filter(
              ({ key }) =>
                detail.catId === null ||
                detail.proposed[key === 'birthDate' ? this.birthKey() : key] != null,
            ).map((field) => {
              const key = field.key === 'birthDate' ? this.birthKey() : field.key;
              const conflict = detail.conflictFields.includes(key);
              return {
                field,
                value: detail.proposed[key] ?? '',
                conflict,
                decision: conflict ? 'unresolved' : 'apply',
              };
            }),
          );
          this.photos.set(detail.photos.map(({ id }) => ({ id, state: 'loading' })));
          this.loadingDetail.set(false);
          for (const photo of detail.photos) this.loadPhoto(detail.id, photo.id);
        },
        error: (error: unknown) => {
          if (
            error instanceof HttpErrorResponse &&
            (error.status === 404 || error.status === 409)
          ) {
            this.closeUnavailable();
            return;
          }
          this.detailFailed.set(true);
          this.loadingDetail.set(false);
        },
      }),
    );
  }

  back(): void {
    if (this.saving()) return;
    this.clearDetail();
    this.selectedId.set(null);
    this.notice.set(null);
    this.loadPending();
    if (this.route.snapshot.queryParamMap.has('reviewId')) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { reviewId: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  setValue(key: CatIntakeFieldKey, value: string): void {
    this.updateField(key, { value });
  }

  toggleAdjustment(): void {
    this.setAdjusting(!this.adjusting());
  }

  private setAdjusting(adjusting: boolean): void {
    if (this.adjusting() === adjusting) return;
    this.adjusting.set(adjusting);
    if (!adjusting) return;
    const hasFoodVariety = this.fields().some(({ field }) => field.key === 'foodDetail');
    if (hasFoodVariety) this.profileOptions.loadVarieties();
    if (
      hasFoodVariety ||
      this.fields().some(({ field }) => field.kind === 'option' || field.key === 'litterBrand')
    )
      this.profileOptions.load();
  }

  setBirthKey(key: string): void {
    if ((key !== 'birthYear' && key !== 'birthDate') || key === this.birthKey()) return;
    const value = this.fields().find(({ field }) => field.key === 'birthDate')?.value ?? '';
    this.setValue('birthDate', key === 'birthYear' ? value.slice(0, 4) : '');
    this.birthKey.set(key);
  }

  validBirthYear(value: string): boolean {
    return (
      /^[1-9]\d{3}$/.test(value) && value <= this.businessTime.currentLocalDateTime().slice(0, 4)
    );
  }

  setLitterSource(source: string): void {
    this.litterDetail.set(undefined);
    this.setOptionId('litterDetail');
    this.setValue(
      'litterBrand',
      source === 'shared' ? CATWORLD_LITTER : source === 'own' ? OWN_LITTER : '',
    );
  }

  ownLitterDetail(value: string): string {
    return this.litterDetail() ?? catOwnLitterDetail(value);
  }

  setLitterDescription(description: string): void {
    const detail = description.trim();
    this.litterDetail.set(description);
    this.setValue('litterBrand', detail && detail !== CATWORLD_LITTER ? description : OWN_LITTER);
  }

  setOptionId(field: CatCatalogSelectionField, id?: string): void {
    this.catalogSelection.update((selection) => ({ ...selection, [field]: id }));
  }

  retiredOption(key: CatIntakeFieldKey): boolean {
    const field = key === 'litterBrand' ? 'litterDetail' : key;
    return this.detail()?.retiredCatalogFields?.some((retired) => retired === field) ?? false;
  }

  isFixedCoatLength(value: string): value is (typeof CAT_COAT_LENGTHS)[number] {
    return this.coatLengths.some((length) => length === value);
  }

  openCurrentCat(catId: string): void {
    this.details.open({ entityType: 'cat', entityId: catId });
  }

  setDecision(key: CatIntakeFieldKey, value: string): void {
    const decision = value === 'keep' || value === 'apply' ? value : 'unresolved';
    this.updateField(key, { decision });
  }

  private updateField(
    key: CatIntakeFieldKey,
    change: Partial<Pick<ReviewField, 'value' | 'decision'>>,
  ): void {
    const previousBrand = this.foodBrandForApproval();
    this.fields.update((fields) =>
      fields.map((row) => (row.field.key === key ? { ...row, ...change } : row)),
    );
    if (
      key === 'foodBrand' &&
      this.catalogSelection().foodDetail &&
      catalogOptionKey(previousBrand) !== catalogOptionKey(this.foodBrandForApproval())
    ) {
      this.setOptionId('foodDetail');
      this.setValue('foodDetail', this.detail()?.proposed.foodDetail ?? '');
    }
  }

  setPhoto(id: string, selected: boolean): void {
    this.photos.update((photos) =>
      photos.map((photo) =>
        photo.id === id && photo.state === 'loaded' ? { ...photo, selected } : photo,
      ),
    );
  }

  excludePhoto(id: string): void {
    this.updatePhoto(id, { state: 'excluded' });
  }

  loadPhoto(reviewId: string, photoId: string): void {
    this.updatePhoto(photoId, { state: 'loading' });
    this.detailRequests.add(
      this.api.getReviewPhoto(reviewId, photoId).subscribe({
        next: (blob) => {
          this.updatePhoto(photoId, {
            state: 'loaded',
            url: URL.createObjectURL(blob),
            selected: true,
          });
        },
        error: () => this.updatePhoto(photoId, { state: 'failed' }),
      }),
    );
  }

  zoom(template: TemplateRef<unknown>, source: string, label: string): void {
    this.photoDialog = this.dialog.open(template, {
      data: { source, label },
      maxWidth: '95vw',
      width: '56rem',
    });
  }

  requiredForCreation(field: CatIntakeField): boolean {
    return 'required' in field && field.required;
  }

  maxLength(field: CatIntakeField): number | null {
    return 'maxLength' in field ? field.maxLength : null;
  }

  fieldLabel(key: CatIntakeFieldKey): string {
    switch (key) {
      case 'birthDate':
      case 'birthYear':
        return this.copy().birth;
      case 'foodDetail':
        return this.copy().foodDetail;
      default:
        return this.catCopy().form[key];
    }
  }

  keepLabel(key: CatIntakeFieldKey, current: CatIntakeFields | null): string {
    const value = current?.[key]?.trim() || (key === 'birthDate' && current?.birthYear?.trim());
    return value ? this.copy().keepCurrent : this.copy().skipField;
  }

  displayField(key: CatIntakeField['key'], fields: CatIntakeFields | null): string {
    if (key === 'birthDate' && fields?.birthYear)
      return this.copy().formatYearOnly(fields.birthYear);
    if (key === 'litterBrand' && fields?.litterDetail) {
      return catLitterLabel(fields.litterBrand, this.catCopy().form, 'OWN', fields.litterDetail);
    }
    return this.displayValue(key, fields?.[key]);
  }

  displayValue(key: CatIntakeFieldKey, value: string | null | undefined): string {
    if (key === 'litterBrand') return catLitterLabel(value, this.catCopy().form);
    if (!value) return this.catCopy().emptyValue;
    if (key === 'coat' && this.isFixedCoatLength(value))
      return this.catCopy().form.coatLengths[value];
    if (key === 'sex')
      return value === 'MALE' ? this.catCopy().form.male : this.catCopy().form.female;
    if (CAT_INTAKE_FIELDS.some((field) => field.key === key && field.kind === 'date')) {
      return formatLocalDate(value, this.i18n.dateLocale());
    }
    return value;
  }

  displayInstant(value: string): string {
    return this.businessTime.formatInstant(value, this.i18n.dateLocale());
  }

  approve(event: Event): void {
    event.preventDefault();
    const detail = this.detail();
    if (!detail || !this.canApprove()) return;
    const fields = this.selectedFields();
    const { foodDetail: varietyId, ...selection } = this.catalogSelection();
    const foodVarietyId = fields.foodDetail ? varietyId : undefined;
    const catalogOptionIds = Object.fromEntries(
      Object.entries(selection).filter(
        ([field, id]) => id && fields[field as keyof CatIntakeFields],
      ),
    );
    const approval: CatIntakeApproval = {
      fields,
      photoIds: this.selectedPhotoIds(),
      ...(foodVarietyId ? { foodVarietyId } : {}),
      ...(Object.keys(catalogOptionIds).length ? { catalogOptionIds } : {}),
      ...this.version(detail),
    };
    this.save(
      detail.id,
      'approve',
      this.catalogTextConfirmation.save(
        (confirmedCatalogText) =>
          this.api.approve(
            detail.id,
            confirmedCatalogText ? { ...approval, confirmedCatalogText } : approval,
          ),
        () => this.setAdjusting(true),
      ),
    );
  }

  dismiss(): void {
    const detail = this.detail();
    if (!detail || !this.confirmingDismiss() || this.saving()) return;
    this.save(detail.id, 'dismiss', this.api.dismiss(detail.id, this.version(detail)));
  }

  private version(detail: CatIntakeReviewDetail): CatIntakeReviewVersion {
    return {
      expectedCatUpdatedAt: detail.catUpdatedAt,
      expectedReviewRevision: detail.revision,
    };
  }

  private save(id: string, action: ReviewAction, request: Observable<void>): void {
    this.saving.set(action);
    this.notice.set(null);
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(null)),
      )
      .subscribe({
        next: () => {
          this.saving.set(null);
          this.back();
          this.notice.set(action === 'approve' ? 'approved' : 'dismissed');
        },
        error: (error: unknown) => {
          this.saving.set(null);
          if (error instanceof HttpErrorResponse && error.status === 409) {
            const code = error.error?.code;
            if (code === 'CAT_INTAKE_CATALOG_CHANGED') {
              this.setAdjusting(true);
              this.profileOptions.load();
              this.profileOptions.loadVarieties();
              this.notice.set('catalogChanged');
              return;
            }
            if (code !== 'CAT_CATALOG_TEXT_CONFIRMATION_REQUIRED') {
              this.open(id, true);
              return;
            }
          }
          if (error instanceof HttpErrorResponse && error.status === 404) {
            this.closeUnavailable();
          } else {
            this.notice.set(action === 'approve' ? 'approveFailed' : 'dismissFailed');
          }
        },
      });
  }

  private updatePhoto(photoId: string, state: ReviewPhotoState): void {
    this.photos.update((photos) =>
      photos.map((photo) => (photo.id === photoId ? { id: photoId, ...state } : photo)),
    );
  }

  private closeUnavailable(): void {
    this.back();
    this.notice.set('unavailable');
  }

  private clearDetail(): void {
    this.detailRequests.unsubscribe();
    this.detailRequests = new Subscription();
    this.photoDialog?.close();
    this.photoDialog = undefined;
    for (const photo of this.photos()) {
      if (photo.state === 'loaded') URL.revokeObjectURL(photo.url);
    }
    this.detail.set(null);
    this.photos.set([]);
    this.fields.set([]);
    this.litterDetail.set(undefined);
    this.catalogSelection.set({});
    this.adjusting.set(false);
    this.confirmingDismiss.set(false);
  }
}
