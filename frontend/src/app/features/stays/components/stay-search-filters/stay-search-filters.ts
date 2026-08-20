import { Component, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { RemoteSearchSelectorComponent } from '../../../../shared/remote-search-selector/remote-search-selector';
import { CatLookupOption, catLookupOptionLabel } from '../../../cats/models/cat.model';
import { CatApiService } from '../../../cats/services/cat-api.service';
import { OwnerLookupOption, ownerLookupLabel } from '../../../owners/models/owner.model';
import { OwnerApiService } from '../../../owners/services/owner-api.service';
import { Stay } from '../../models/stay.model';
import {
  getDefaultStaySearchFilters,
  StaySearchFilters,
} from '../../utils/stay-search-filter.util';

@Component({
  selector: 'app-stay-search-filters',
  imports: [MatButton, RemoteSearchSelectorComponent],
  templateUrl: './stay-search-filters.html',
  styleUrl: './stay-search-filters.scss',
})
export class StaySearchFiltersComponent {
  private readonly i18nService = inject(I18nService);
  private readonly catApiService = inject(CatApiService);
  private readonly ownerApiService = inject(OwnerApiService);
  private readonly catSelector =
    viewChild<RemoteSearchSelectorComponent<CatLookupOption>>('catSelector');
  private readonly ownerSelector =
    viewChild<RemoteSearchSelectorComponent<OwnerLookupOption>>('ownerSelector');

  readonly text = this.i18nService.text;
  readonly stays = input<Stay[]>([]);
  readonly filtersChange = output<StaySearchFilters>();

  readonly selectedCat = signal<CatLookupOption | null>(null);
  readonly selectedOwner = signal<OwnerLookupOption | null>(null);
  readonly selectedCatId = computed(() => this.selectedCat()?.id ?? null);
  readonly selectedOwnerId = computed(() => this.selectedOwner()?.id ?? null);
  readonly hasSearchFilters = computed(
    () =>
      this.selectedCatId() !== null ||
      this.selectedOwnerId() !== null ||
      Boolean(this.catSelector()?.searchText().trim()) ||
      Boolean(this.ownerSelector()?.searchText().trim()),
  );

  readonly searchCats = (query: string, page: number) =>
    this.catApiService.searchLookupOptions(query, page);
  readonly searchOwners = (query: string, page: number) =>
    this.ownerApiService.searchLookupOptions(query, page);
  readonly catOptionId = (option: CatLookupOption): string => option.id;
  readonly catOptionLabel = catLookupOptionLabel;
  readonly ownerOptionId = (option: OwnerLookupOption): string => option.id;
  readonly ownerOptionLabel = ownerLookupLabel;

  selectCat(option: CatLookupOption | null): void {
    this.selectedCat.set(option);

    if (option !== null) {
      this.selectedOwner.set(null);
    }

    this.emitFilters();
  }

  selectOwner(option: OwnerLookupOption | null): void {
    this.selectedOwner.set(option);

    if (option !== null) {
      this.selectedCat.set(null);
    }

    this.emitFilters();
  }

  clearFilters(): void {
    this.selectedCat.set(null);
    this.selectedOwner.set(null);
    this.catSelector()?.clear();
    this.ownerSelector()?.clear();
    this.emitFilters();
  }

  private emitFilters(): void {
    this.filtersChange.emit({
      ...getDefaultStaySearchFilters(),
      catId: this.selectedCatId(),
      ownerId: this.selectedOwnerId(),
    });
  }
}
