import {
  Component,
  DestroyRef,
  ElementRef,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
  MatDialogRef,
} from '@angular/material/dialog';
import { CatDetail } from '../../features/cats/components/cat-detail/cat-detail';
import { OwnerDetail } from '../../features/owners/components/owner-detail/owner-detail';
import { VetDetail } from '../../features/vets/components/vet-detail/vet-detail';
import { StayDetail } from '../../features/stays/components/stay-detail/stay-detail';
import { EntityDetailUpdate, EntityReference } from './entity-reference';
import { I18nService } from '../../core/i18n/i18n.service';
import { UiStateComponent } from '../ui-state/ui-state';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { OwnerApiService } from '../../features/owners/services/owner-api.service';
import { VetApiService } from '../../features/vets/services/vet-api.service';
import { CatRelationshipPage } from './relationship.models';
import { StayRelationshipPage } from './relationship.models';
import { CatApiService } from '../../features/cats/services/cat-api.service';
import { StayApiService } from '../../features/stays/services/stay-api.service';
import { Observable } from 'rxjs';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { StayRelationshipLabel } from '../../features/stays/components/stay-relationship-label/stay-relationship-label';
import { Router } from '@angular/router';

const ENTITY_DETAIL_DIALOG_WIDTH = 'min(52rem, calc(100vw - 2rem))';

type RelationshipKind = 'owner-cats' | 'vet-cats' | 'owner-stays' | 'cat-stays' | 'stay-cats';
type HistoryEntry =
  | { kind: 'detail'; reference: EntityReference }
  | { kind: 'list'; relationship: RelationshipKind; parent: EntityReference; page: number }
  | { kind: 'cat-photo'; catId: string; catName: string; ownerName: string };
type PhotoState = 'loading' | 'success' | 'missing' | 'error';
@Component({
  selector: 'app-entity-detail-dialog',
  imports: [
    MatButton,
    MatIconButton,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    OwnerDetail,
    CatDetail,
    VetDetail,
    StayDetail,
    UiStateComponent,
    MatPaginator,
    MatProgressSpinner,
    StayRelationshipLabel,
  ],
  templateUrl: './entity-detail-dialog.html',
  styleUrl: './entity-detail-dialog.scss',
})
export class EntityDetailDialog {
  private readonly ownerApi = inject(OwnerApiService);
  private readonly vetApi = inject(VetApiService);
  private readonly catApi = inject(CatApiService);
  private readonly stayApi = inject(StayApiService);
  private readonly dialogRef = inject(MatDialogRef<EntityDetailDialog>);
  private readonly router = inject(Router);
  private readonly element = inject(ElementRef<HTMLElement>);
  private requestGeneration = 0;
  private geometryGeneration = 0;
  private contentResolved = false;
  private photoSubscription: Subscription | null = null;
  private readonly contentRegion = viewChild<ElementRef<HTMLElement>>('contentRegion');
  readonly reference = signal(inject<EntityReference>(MAT_DIALOG_DATA));
  readonly history = signal<HistoryEntry[]>([{ kind: 'detail', reference: this.reference() }]);
  readonly entry = signal<HistoryEntry>(this.history()[0]);
  readonly relationshipPage = signal<CatRelationshipPage | StayRelationshipPage | null>(null);
  readonly relationshipLoading = signal(false);
  readonly relationshipError = signal(false);
  readonly editing = signal(false);
  readonly text = inject(I18nService).text;
  readonly entityUpdated = output<EntityDetailUpdate>();
  readonly submitting = signal(false);
  readonly detailRefreshing = signal(false);
  readonly preservedContentHeight = signal<number | null>(null);
  readonly photoState = signal<PhotoState>('loading');
  readonly photoUrl = signal<string | null>(null);
  readonly photoWidth = signal<number | null>(null);
  readonly photoHeight = signal<number | null>(null);
  constructor() {
    this.dialogRef.beforeClosed().subscribe(() => this.leavePhoto());
    inject(DestroyRef).onDestroy(() => {
      this.geometryGeneration++;
      this.leavePhoto();
    });
  }
  title(): string {
    if (this.entry().kind === 'list') return this.relationshipTitle();
    if (this.entry().kind === 'cat-photo') {
      const entry = this.entry() as Extract<HistoryEntry, { kind: 'cat-photo' }>;
      return `${this.text().cats.detail.photo} — ${entry.catName} (${entry.ownerName})`;
    }
    const text = this.text();
    return this.reference().entityType === 'owner'
      ? text.owners.detail.title
      : this.reference().entityType === 'cat'
        ? text.cats.detail.title
        : this.reference().entityType === 'vet'
          ? text.vets.detail.title
          : text.stays.detail.title;
  }
  closeLabel(): string {
    const text = this.text();
    return this.reference().entityType === 'owner'
      ? text.owners.detail.close
      : this.reference().entityType === 'cat'
        ? text.cats.detail.close
        : this.reference().entityType === 'vet'
          ? text.vets.detail.close
          : text.stays.detail.close;
  }
  photoAlt(): string {
    const entry = this.entry();
    return entry.kind === 'cat-photo' ? this.text().cats.detail.photoAlt(entry.catName) : '';
  }
  showReference(reference: EntityReference): void {
    if (this.submitting()) return;
    this.leavePhoto();
    this.captureContentGeometry();
    this.editing.set(false);
    this.detailRefreshing.set(false);
    this.reference.set(reference);
    const entry: HistoryEntry = { kind: 'detail', reference };
    this.history.update((items) => [...items, entry]);
    this.entry.set(entry);
    this.focusContent();
  }
  openCats(parent: EntityReference): void {
    if (this.submitting()) return;
    this.leavePhoto();
    this.captureContentGeometry();
    this.detailRefreshing.set(false);
    const relationship: RelationshipKind =
      parent.entityType === 'owner'
        ? 'owner-cats'
        : parent.entityType === 'stay'
          ? 'stay-cats'
          : 'vet-cats';
    const entry: HistoryEntry = { kind: 'list', relationship, parent, page: 0 };
    this.history.update((items) => [...items, entry]);
    this.entry.set(entry);
    this.reference.set(parent);
    this.relationshipPage.set(null);
    this.loadRelationship(entry);
    this.focusContent();
  }
  openStays(parent: EntityReference): void {
    if (this.submitting()) return;
    this.leavePhoto();
    this.captureContentGeometry();
    this.detailRefreshing.set(false);
    const relationship: RelationshipKind =
      parent.entityType === 'owner' ? 'owner-stays' : 'cat-stays';
    const entry: HistoryEntry = { kind: 'list', relationship, parent, page: 0 };
    this.history.update((items) => [...items, entry]);
    this.entry.set(entry);
    this.reference.set(parent);
    this.relationshipPage.set(null);
    this.loadRelationship(entry);
    this.focusContent();
  }
  back(): void {
    if (this.submitting()) return;
    if (this.history().length <= 1) return;
    this.captureContentGeometry();
    this.leavePhoto();
    this.editing.set(false);
    this.detailRefreshing.set(false);
    this.history.update((items) => items.slice(0, -1));
    const entry = this.history()[this.history().length - 1];
    this.entry.set(entry);
    if (entry.kind === 'detail') {
      this.reference.set(entry.reference);
    } else if (entry.kind === 'list') {
      this.reference.set(entry.parent);
      this.loadRelationship(entry);
    }
    this.focusContent();
  }
  openCatPhoto(photo: { catId: string; catName: string; ownerName: string }): void {
    if (this.submitting()) return;
    this.captureContentGeometry();
    this.leavePhoto();
    const entry: HistoryEntry = { kind: 'cat-photo', ...photo };
    this.history.update((items) => [...items, entry]);
    this.entry.set(entry);
    this.photoState.set('loading');
    const generation = ++this.requestGeneration;
    this.photoSubscription = this.catApi.getCatPhoto(photo.catId).subscribe({
      next: (blob) => {
        if (generation !== this.requestGeneration || this.entry() !== entry) return;
        const url = URL.createObjectURL(blob);
        if (generation !== this.requestGeneration || this.entry() !== entry) {
          URL.revokeObjectURL(url);
          return;
        }
        this.photoUrl.set(url);
      },
      error: (error: HttpErrorResponse) => {
        if (generation !== this.requestGeneration || this.entry() !== entry) return;
        this.photoState.set(error.status === 404 ? 'missing' : 'error');
        this.destinationSettled();
      },
    });
    this.focusContent();
  }
  photoLoaded(url: string, event: Event): void {
    if (this.entry().kind !== 'cat-photo' || this.photoUrl() !== url) return;
    const image = event.currentTarget as HTMLImageElement;
    this.applyPhotoGeometry(image.naturalWidth, image.naturalHeight);
    this.photoState.set('success');
    this.destinationSettled();
  }
  photoFailed(url: string): void {
    if (this.entry().kind !== 'cat-photo' || this.photoUrl() !== url) return;
    URL.revokeObjectURL(url);
    this.photoUrl.set(null);
    this.photoState.set('error');
    this.destinationSettled();
  }
  private leavePhoto(): void {
    const wasPhoto = this.entry().kind === 'cat-photo';
    this.requestGeneration++;
    this.photoSubscription?.unsubscribe();
    this.photoSubscription = null;
    const url = this.photoUrl();
    if (url) URL.revokeObjectURL(url);
    this.photoUrl.set(null);
    this.photoWidth.set(null);
    this.photoHeight.set(null);
    if (wasPhoto) this.dialogRef.updateSize(ENTITY_DETAIL_DIALOG_WIDTH, '');
  }

  private applyPhotoGeometry(naturalWidth: number, naturalHeight: number): void {
    if (naturalWidth <= 0 || naturalHeight <= 0) return;
    const view = this.element.nativeElement.ownerDocument.defaultView;
    if (!view) return;
    const generation = this.requestGeneration;
    const apply = (remainingMeasurements: number): void => {
      if (generation !== this.requestGeneration || this.entry().kind !== 'cat-photo') return;
      this.updatePhotoGeometry(naturalWidth, naturalHeight, view);
      if (remainingMeasurements > 0) {
        view.requestAnimationFrame(() => apply(remainingMeasurements - 1));
      }
    };
    apply(2);
  }

  private updatePhotoGeometry(naturalWidth: number, naturalHeight: number, view: Window): void {
    const outerMargin = 32;
    const content = this.contentRegion()?.nativeElement;
    const header = this.element.nativeElement.querySelector('.dialog-header');
    const contentStyle = content ? view.getComputedStyle(content) : null;
    const horizontalPadding = contentStyle
      ? parseFloat(contentStyle.paddingLeft) + parseFloat(contentStyle.paddingRight)
      : 48;
    const verticalPadding = contentStyle
      ? parseFloat(contentStyle.paddingTop) + parseFloat(contentStyle.paddingBottom)
      : 48;
    const headerHeight = header?.getBoundingClientRect().height ?? 72;
    const availableWidth = Math.max(1, view.innerWidth - outerMargin - horizontalPadding);
    const availableHeight = Math.max(
      1,
      view.innerHeight - outerMargin - headerHeight - verticalPadding,
    );
    const scale = Math.min(1, availableWidth / naturalWidth, availableHeight / naturalHeight);
    const imageWidth = Math.floor(naturalWidth * scale);
    const imageHeight = Math.floor(naturalHeight * scale);
    const minimumWidth = Math.min(320, view.innerWidth - outerMargin);
    this.photoWidth.set(imageWidth);
    this.photoHeight.set(imageHeight);
    this.dialogRef.updateSize(
      `${Math.max(minimumWidth, imageWidth + horizontalPadding)}px`,
      `${imageHeight + verticalPadding + headerHeight}px`,
    );
  }
  pageChanged(event: PageEvent): void {
    const current = this.entry();
    if (current.kind !== 'list') return;
    const updated = { ...current, page: event.pageIndex };
    this.entry.set(updated);
    this.history.update((items) => [...items.slice(0, -1), updated]);
    this.loadRelationship(updated);
  }
  retryRelationship(): void {
    const current = this.entry();
    if (current.kind === 'list') {
      this.captureContentGeometry();
      this.loadRelationship(current);
    }
  }
  relationshipTitle(): string {
    const entry = this.entry();
    return entry.kind === 'list' && entry.relationship.includes('stays')
      ? this.text().entityDetail.stays
      : this.text().entityDetail.cats;
  }
  private loadRelationship(entry: Extract<HistoryEntry, { kind: 'list' }>): void {
    const generation = ++this.requestGeneration;
    this.relationshipLoading.set(true);
    this.relationshipError.set(false);
    const request =
      entry.relationship === 'owner-cats'
        ? this.ownerApi.getOwnerCats(entry.parent.entityId, entry.page)
        : entry.relationship === 'vet-cats'
          ? this.vetApi.getVetCats(entry.parent.entityId, entry.page)
          : entry.relationship === 'owner-stays'
            ? this.ownerApi.getOwnerStays(entry.parent.entityId, entry.page)
            : entry.relationship === 'cat-stays'
              ? this.catApi.getCatStays(entry.parent.entityId, entry.page)
              : this.stayApi.getStayCats(entry.parent.entityId, entry.page);
    (request as Observable<CatRelationshipPage | StayRelationshipPage>).subscribe({
      next: (page) => {
        if (generation !== this.requestGeneration || this.entry() !== entry) return;
        if (entry.page > 0 && entry.page >= page.totalPages) {
          const clamped = { ...entry, page: Math.max(0, page.totalPages - 1) };
          this.entry.set(clamped);
          this.history.update((items) => [...items.slice(0, -1), clamped]);
          this.loadRelationship(clamped);
          return;
        }
        this.relationshipPage.set(page);
        this.relationshipLoading.set(false);
        this.destinationSettled();
      },
      error: () => {
        if (generation !== this.requestGeneration || this.entry() !== entry) return;
        this.relationshipError.set(true);
        this.relationshipLoading.set(false);
        this.destinationSettled();
      },
    });
  }
  private focusContent(): void {
    setTimeout(() =>
      (
        this.element.nativeElement.querySelector('[data-dialog-focus]') as HTMLElement | null
      )?.focus(),
    );
  }
  enterEdit(): void {
    this.editing.set(true);
  }
  leaveEdit(): void {
    this.editing.set(false);
  }
  referenceSaved(): void {
    const reference = this.reference();
    if (reference.entityType === 'stay') return;
    this.leaveEdit();
    this.entityUpdated.emit({
      entityType: reference.entityType,
      entityId: reference.entityId,
    });
  }
  stayUpdated(update: EntityDetailUpdate): void {
    this.leaveEdit();
    this.entityUpdated.emit(update);
  }
  deletionCompleted(reference: EntityReference): void {
    this.submissionChanged(false);
    if (this.history().length === 1) {
      this.entityUpdated.emit(reference);
      this.dialogRef.close();
      return;
    }
    this.back();
  }
  submissionChanged(submitting: boolean): void {
    this.submitting.set(submitting);
    this.dialogRef.disableClose = submitting;
  }
  refreshChanged(refreshing: boolean): void {
    this.detailRefreshing.set(refreshing);
  }
  destinationSettled(): void {
    const generation = ++this.geometryGeneration;
    const view = this.element.nativeElement.ownerDocument.defaultView;
    if (!view) {
      this.preservedContentHeight.set(null);
      this.contentResolved = true;
      return;
    }
    view.requestAnimationFrame(() => {
      if (generation !== this.geometryGeneration) return;
      this.preservedContentHeight.set(null);
      this.contentResolved = true;
    });
  }
  private captureContentGeometry(): void {
    if (!this.contentResolved) return;
    const height = this.contentRegion()?.nativeElement.getBoundingClientRect().height ?? 0;
    if (height > 0) this.preservedContentHeight.set(height);
    this.contentResolved = false;
    this.geometryGeneration++;
  }
  openStayPricing(): void {
    if (this.submitting()) return;
    const stayId = this.reference().entityId;
    const origin = this.router.url;
    this.dialogRef.close();
    void this.router.navigate(['/stays', stayId, 'pricing'], {
      state: { stayPricingOrigin: origin },
    });
  }
}
