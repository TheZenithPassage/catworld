import { Component, computed, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { Owner } from '../../models/owner.model';
import { OwnerApiService } from '../../services/owner-api.service';
import { matchesSearchText } from '../../../../core/search/search-text.util';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';

@Component({
  selector: 'app-owners-overview-page',
  imports: [
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    MatTableModule,
    RouterLink,
    UiStateComponent,
  ],
  templateUrl: './owners-overview-page.html',
  styleUrl: './owners-overview-page.scss',
})
export class OwnersOverviewPage {
  private readonly ownerApiService = inject(OwnerApiService);
  private readonly i18nService = inject(I18nService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly details = inject(EntityDetailDialogService);

  readonly text = this.i18nService.text;

  readonly owners = signal<Owner[]>([]);
  readonly loading = signal(false);
  readonly error = createLanguageResetError(this.i18nService.language);
  readonly selectedOwnerId = signal<string | null>(null);
  readonly searchText = signal('');
  readonly displayedColumns = ['name', 'primaryPhone', 'secondaryPhone', 'address', 'social'];

  readonly filteredOwners = computed(() =>
    this.owners().filter((owner) => matchesSearchText([owner.fullName], this.searchText())),
  );

  constructor() {
    const queryParamMap = this.route.snapshot.queryParamMap;

    this.searchText.set(queryParamMap.get('search') ?? '');
    this.selectedOwnerId.set(queryParamMap.get('selectedOwnerId'));

    this.loadOwners();
  }

  loadOwners(): void {
    this.loading.set(true);
    this.error.set(null);

    this.ownerApiService.getOwners().subscribe({
      next: (owners) => {
        this.owners.set(owners);
        this.loading.set(false);
        this.scrollSelectedOwnerIntoView();
      },
      error: () => {
        this.error.set(this.text().owners.overview.errorLoading);
        this.loading.set(false);
      },
    });
  }

  setSearchText(value: string): void {
    this.searchText.set(value);
    this.selectedOwnerId.set(null);
  }

  clearSearch(): void {
    this.searchText.set('');
    this.selectedOwnerId.set(null);

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        search: null,
        selectedOwnerId: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  formatOptionalValue(value: string | null): string {
    return value || this.text().owners.emptyValue;
  }

  getSecondaryPhone(owner: Owner): string {
    if (!owner.secondaryPhone) {
      return this.text().owners.emptyValue;
    }

    if (!owner.secondaryPhoneName) {
      return owner.secondaryPhone;
    }

    return `${owner.secondaryPhone} (${owner.secondaryPhoneName})`;
  }

  isSelectedOwner(owner: Owner): boolean {
    return this.selectedOwnerId() === owner.id;
  }

  openOwner(owner: Owner): void {
    this.details
      .open({ entityType: 'owner', entityId: owner.id })
      .subscribe(() => this.loadOwners());
  }
  activateOwner(event: KeyboardEvent, owner: Owner): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openOwner(owner);
    }
  }

  private scrollSelectedOwnerIntoView(): void {
    const selectedOwnerId = this.selectedOwnerId();

    if (!selectedOwnerId) {
      return;
    }

    setTimeout(() => {
      document.getElementById(`owner-${selectedOwnerId}`)?.scrollIntoView({ block: 'center' });
    });
  }
}
