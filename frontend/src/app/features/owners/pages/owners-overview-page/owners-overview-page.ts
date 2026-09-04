import { Component, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { OwnerOverviewItem } from '../../models/owner.model';
import { OwnerApiService } from '../../services/owner-api.service';

@Component({
  selector: 'app-owners-overview-page',
  imports: [
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    MatPaginator,
    RouterLink,
    UiStateComponent,
  ],
  templateUrl: './owners-overview-page.html',
  styleUrl: './owners-overview-page.scss',
})
export class OwnersOverviewPage {
  private readonly api = inject(OwnerApiService);
  private readonly i18n = inject(I18nService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly details = inject(EntityDetailDialogService);
  private request?: Subscription;
  private selectedRequest?: Subscription;
  private searchTimer?: ReturnType<typeof setTimeout>;
  private requestId = 0;
  readonly text = this.i18n.text;
  readonly owners = signal<OwnerOverviewItem[]>([]);
  readonly loading = signal(false);
  readonly error = createLanguageResetError(this.i18n.language);
  readonly searchText = signal('');
  readonly page = signal(0);
  readonly totalElements = signal(0);
  readonly pageSize = 10;
  readonly selectedOwnerId = signal<string | null>(null);
  readonly selectedOwner = signal<OwnerOverviewItem | null>(null);
  constructor() {
    const q = this.route.snapshot.queryParamMap;
    this.searchText.set(q.get('search') ?? '');
    this.selectedOwnerId.set(q.get('selectedOwnerId'));
    this.loadOwners();
  }
  loadOwners(page = this.page()): void {
    const id = ++this.requestId;
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);
    this.request = this.api.getOwnerOverview(page, this.searchText()).subscribe({
      next: (result) => {
        if (id !== this.requestId) return;
        if (!result.items.length && result.totalElements > 0 && page > 0) {
          this.loadOwners(Math.max(0, Math.ceil(result.totalElements / this.pageSize) - 1));
          return;
        }
        this.owners.set(result.items);
        this.page.set(result.page);
        this.totalElements.set(result.totalElements);
        this.loading.set(false);
        this.resolveSelectedOwner(result.items);
      },
      error: () => {
        if (id === this.requestId) {
          this.error.set(this.text().owners.overview.errorLoading);
          this.loading.set(false);
        }
      },
    });
  }
  setSearchText(value: string): void {
    this.searchText.set(value);
    this.selectedOwnerId.set(null);
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.page.set(0);
      this.loadOwners(0);
    }, 300);
  }
  clearSearch(): void {
    clearTimeout(this.searchTimer);
    this.searchText.set('');
    this.selectedOwnerId.set(null);
    this.page.set(0);
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { search: null, selectedOwnerId: null },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
    this.loadOwners(0);
  }
  changePage(event: PageEvent): void {
    this.loadOwners(event.pageIndex);
  }
  catNames(owner: OwnerOverviewItem): string {
    return owner.cats.map((cat) => cat.name).join(', ') || this.text().owners.emptyValue;
  }
  openOwner(owner: Pick<OwnerOverviewItem, 'id'>): void {
    this.details
      .open({ entityType: 'owner', entityId: owner.id })
      .subscribe(() => this.loadOwners());
  }
  activateOwner(event: KeyboardEvent, owner: OwnerOverviewItem): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openOwner(owner);
    }
  }
  isSelectedOwner(owner: OwnerOverviewItem): boolean {
    return owner.id === this.selectedOwnerId();
  }
  private resolveSelectedOwner(items: OwnerOverviewItem[]): void {
    const selectedId = this.selectedOwnerId();
    this.selectedRequest?.unsubscribe();
    if (!selectedId || items.some((owner) => owner.id === selectedId)) {
      this.selectedOwner.set(null);
      this.scrollSelected();
      return;
    }
    this.selectedRequest = this.api.getOwnerLookup(selectedId).subscribe({
      next: (owner) => {
        if (this.selectedOwnerId() !== selectedId) return;
        this.selectedOwner.set({
          id: owner.id,
          fullName: owner.fullName,
          cats: owner.currentCats,
        });
        this.scrollSelected();
      },
      error: () => this.selectedOwner.set(null),
    });
  }
  private scrollSelected(): void {
    const id = this.selectedOwnerId();
    if (id)
      setTimeout(() => document.getElementById(`owner-${id}`)?.scrollIntoView({ block: 'center' }));
  }
}
