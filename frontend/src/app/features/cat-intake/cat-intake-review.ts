import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, TemplateRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
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
import { distinctUntilChanged, map, Subscription } from 'rxjs';

import { I18nService } from '../../core/i18n/i18n.service';
import { CAT_INTAKE_TRANSLATIONS } from '../../core/i18n/translations/cat-intake.translations';
import { BusinessTimeService } from '../../core/time/business-time.service';
import { formatLocalDate } from '../../shared/date/local-date-format';
import { EntityDetailDialogService } from '../../shared/entity-detail/entity-detail-dialog.service';
import { CatIntakeApi } from './cat-intake-api';
import {
  CAT_INTAKE_FIELDS,
  CATWORLD_LITTER,
  CatIntakeField,
  CatIntakeFieldKey,
  CatIntakeFields,
  CatIntakeReviewDetail,
  CatIntakeReviewItem,
  IntakeFoodBrand,
} from './cat-intake-models';

type Decision = 'apply' | 'keep' | 'unresolved';

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
    MatAutocompleteModule,
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
  readonly sharedLitter = CATWORLD_LITTER;
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
  readonly notice = signal<'approved' | 'approveFailed' | 'stale' | 'unavailable' | null>(null);
  readonly approving = signal(false);
  readonly fields = signal<ReviewField[]>([]);
  readonly photos = signal<ReviewPhoto[]>([]);
  readonly foodBrands = signal<IntakeFoodBrand[]>([]);
  readonly foodBrandsState = signal<'idle' | 'loading' | 'ready' | 'error'>('idle');
  private readonly foodBrandQuery = computed(() =>
    this.normalizeBrand(this.fields().find(({ field }) => field.key === 'foodBrand')?.value ?? ''),
  );
  readonly suggestedFoodBrands = computed(() =>
    this.foodBrands().filter(({ name }) =>
      this.normalizeBrand(name).includes(this.foodBrandQuery()),
    ),
  );
  readonly isNewFoodBrand = computed(
    () =>
      this.foodBrandsState() === 'ready' &&
      this.foodBrandQuery().length > 0 &&
      !this.suggestedFoodBrands().some(
        ({ name }) => this.normalizeBrand(name) === this.foodBrandQuery(),
      ),
  );
  readonly canApprove = computed(() => {
    const detail = this.detail();
    return (
      detail !== null &&
      !this.approving() &&
      Number.isSafeInteger(detail.revision) &&
      this.photos().every(({ state }) => state === 'loaded' || state === 'excluded') &&
      this.fields().every(({ field, conflict, decision, value }) => {
        if (decision === 'unresolved') return false;
        if (
          field.key === 'foodBrand' &&
          decision === 'apply' &&
          value.trim() &&
          this.foodBrandsState() !== 'ready'
        ) {
          return false;
        }
        if (conflict && decision === 'apply') return value.trim().length > 0;
        return detail.catId !== null || !this.requiredForCreation(field) || value.trim().length > 0;
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
    if (this.approving()) return;
    this.clearDetail();
    this.selectedId.set(id);
    this.notice.set(stale ? 'stale' : null);
    this.loadingDetail.set(true);
    this.detailFailed.set(false);
    this.detailRequests.add(
      this.api.getReview(id).subscribe({
        next: (detail) => {
          this.detail.set(detail);
          this.fields.set(
            CAT_INTAKE_FIELDS.filter(
              ({ key }) => detail.catId === null || detail.proposed[key] != null,
            ).map((field) => {
              const conflict = detail.conflictFields.includes(field.key);
              return {
                field,
                value: detail.proposed[field.key] ?? '',
                conflict,
                decision: conflict ? 'unresolved' : 'apply',
              };
            }),
          );
          this.photos.set(detail.photos.map(({ id }) => ({ id, state: 'loading' })));
          this.loadingDetail.set(false);
          if (this.fields().some(({ field }) => field.key === 'foodBrand')) this.loadFoodBrands();
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
    if (this.approving()) return;
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
    this.fields.update((fields) =>
      fields.map((row) => (row.field.key === key ? { ...row, value } : row)),
    );
  }

  loadFoodBrands(): void {
    if (this.foodBrandsState() === 'loading') return;
    this.foodBrandsState.set('loading');
    this.detailRequests.add(
      this.api.listFoodBrands().subscribe({
        next: (brands) => {
          this.foodBrands.set(brands);
          this.foodBrandsState.set('ready');
        },
        error: () => this.foodBrandsState.set('error'),
      }),
    );
  }

  openCurrentCat(catId: string): void {
    this.details.open({ entityType: 'cat', entityId: catId });
  }

  setDecision(key: CatIntakeFieldKey, value: string): void {
    const decision = value === 'keep' || value === 'apply' ? value : 'unresolved';
    this.fields.update((fields) =>
      fields.map((row) => (row.field.key === key ? { ...row, decision } : row)),
    );
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
            selected: false,
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
    return key === 'foodDetail' ? this.copy().foodDetail : this.catCopy().form[key];
  }

  displayValue(key: CatIntakeFieldKey, value: string | null | undefined): string {
    if (!value) return this.catCopy().emptyValue;
    if (key === 'litterBrand' && value === CATWORLD_LITTER) return this.copy().sharedLitter;
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
    const fields: CatIntakeFields = {};
    for (const row of this.fields()) {
      const value = row.value.trim();
      if (row.decision === 'apply' && value) fields[row.field.key] = value;
    }
    this.approving.set(true);
    this.notice.set(null);
    this.api
      .approve(detail.id, {
        fields,
        photoIds: this.photos()
          .filter((photo) => photo.state === 'loaded' && photo.selected)
          .map((photo) => photo.id),
        expectedCatUpdatedAt: detail.catUpdatedAt,
        expectedReviewRevision: detail.revision,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.approving.set(false);
          this.back();
          this.notice.set('approved');
        },
        error: (error: unknown) => {
          this.approving.set(false);
          if (error instanceof HttpErrorResponse && error.status === 409) {
            this.open(detail.id, true);
          } else if (error instanceof HttpErrorResponse && error.status === 404) {
            this.closeUnavailable();
          } else {
            this.notice.set('approveFailed');
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

  private normalizeBrand(value: string): string {
    return value.trim().replace(/\s+/g, ' ').toLowerCase();
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
    this.foodBrands.set([]);
    this.foodBrandsState.set('idle');
  }
}
