import { Component, ElementRef, inject, output, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
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
import { Stay } from '../../features/stays/models/stay.model';
import { EntityDetailUpdate, EntityReference } from './entity-reference';
import { I18nService } from '../../core/i18n/i18n.service';
import { UiStateComponent } from '../ui-state/ui-state';
import { MatPaginator, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { OwnerApiService } from '../../features/owners/services/owner-api.service';
import { VetApiService } from '../../features/vets/services/vet-api.service';
import { CatRelationshipPage } from './relationship.models';
import { StayRelationshipPage } from './relationship.models';
import { CatApiService } from '../../features/cats/services/cat-api.service';
import { StayApiService } from '../../features/stays/services/stay-api.service';
import { dialogPaginatorIntl } from './dialog-paginator-intl';
import { Observable } from 'rxjs';
import { StayRelationshipLabel } from '../../features/stays/components/stay-relationship-label/stay-relationship-label';
import { Router } from '@angular/router';

type RelationshipKind = 'owner-cats' | 'vet-cats' | 'owner-stays' | 'cat-stays' | 'stay-cats';
type HistoryEntry =
  | { kind: 'detail'; reference: EntityReference }
  | { kind: 'list'; relationship: RelationshipKind; parent: EntityReference; page: number };
@Component({
  selector: 'app-entity-detail-dialog',
  imports: [
    MatButton,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    OwnerDetail,
    CatDetail,
    VetDetail,
    StayDetail,
    UiStateComponent,
    MatPaginator,
    StayRelationshipLabel,
  ],
  providers: [{ provide: MatPaginatorIntl, useFactory: dialogPaginatorIntl }],
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
  title(): string {
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
  showReference(reference: EntityReference): void {
    this.editing.set(false);
    this.reference.set(reference);
    const entry: HistoryEntry = { kind: 'detail', reference };
    this.history.update((items) => [...items, entry]);
    this.entry.set(entry);
    this.focusContent();
  }
  openCats(parent: EntityReference): void {
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
    this.loadRelationship(entry);
    this.focusContent();
  }
  openStays(parent: EntityReference): void {
    const relationship: RelationshipKind =
      parent.entityType === 'owner' ? 'owner-stays' : 'cat-stays';
    const entry: HistoryEntry = { kind: 'list', relationship, parent, page: 0 };
    this.history.update((items) => [...items, entry]);
    this.entry.set(entry);
    this.reference.set(parent);
    this.loadRelationship(entry);
    this.focusContent();
  }
  back(): void {
    if (this.history().length <= 1) return;
    this.editing.set(false);
    this.history.update((items) => items.slice(0, -1));
    const entry = this.history()[this.history().length - 1];
    this.entry.set(entry);
    if (entry.kind === 'detail') {
      this.reference.set(entry.reference);
    } else {
      this.reference.set(entry.parent);
      this.loadRelationship(entry);
    }
    this.focusContent();
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
    if (current.kind === 'list') this.loadRelationship(current);
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
      },
      error: () => {
        if (generation !== this.requestGeneration || this.entry() !== entry) return;
        this.relationshipError.set(true);
        this.relationshipLoading.set(false);
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
  staySaved(stay: Stay): void {
    this.leaveEdit();
    this.entityUpdated.emit(stay);
  }
  submissionChanged(submitting: boolean): void {
    this.submitting.set(submitting);
    this.dialogRef.disableClose = submitting;
  }
  openStayPricing(): void {
    const stayId = this.reference().entityId;
    const origin = this.router.url;
    this.dialogRef.close();
    void this.router.navigate(['/stays', stayId, 'pricing'], {
      state: { stayPricingOrigin: origin },
    });
  }
}
