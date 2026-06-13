import { Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { Stay } from '../../models/stay.model';
import {
  getDefaultStaySearchFilters,
  getStayCatFilterOptions,
  getStayOwnerFilterOptions,
  normalizeSearchText,
  StayCatFilterOption,
  StayOwnerFilterOption,
  StaySearchFilters,
} from '../../utils/stay-search-filter.util';

@Component({
  selector: 'app-stay-search-filters',
  imports: [FormsModule],
  templateUrl: './stay-search-filters.html',
  styleUrl: './stay-search-filters.scss',
})
export class StaySearchFiltersComponent {
  private readonly i18nService = inject(I18nService);

  readonly text = this.i18nService.text;
  readonly stays = input<Stay[]>([]);
  readonly filtersChange = output<StaySearchFilters>();

  readonly catSearch = signal('');
  readonly ownerSearch = signal('');
  readonly selectedCatId = signal<string | null>(null);
  readonly selectedOwnerId = signal<string | null>(null);

  readonly catOptions = computed(() => getStayCatFilterOptions(this.stays()));
  readonly ownerOptions = computed(() => getStayOwnerFilterOptions(this.stays()));

  readonly matchingCatOptions = computed(() => {
    const searchText = normalizeSearchText(this.catSearch());

    if (!searchText || this.selectedCatId()) {
      return [];
    }

    return this.catOptions().filter((option) => option.searchText.includes(searchText));
  });

  readonly matchingOwnerOptions = computed(() => {
    const searchText = normalizeSearchText(this.ownerSearch());

    if (!searchText || this.selectedOwnerId()) {
      return [];
    }

    return this.ownerOptions().filter((option) => option.searchText.includes(searchText));
  });

  onCatSearchChange(value: string): void {
    this.catSearch.set(value);

    if (this.selectedCatId()) {
      this.selectedCatId.set(null);
      this.emitFilters();
    }
  }

  onOwnerSearchChange(value: string): void {
    this.ownerSearch.set(value);

    if (this.selectedOwnerId()) {
      this.selectedOwnerId.set(null);
      this.emitFilters();
    }
  }

  selectCat(option: StayCatFilterOption): void {
    this.selectedCatId.set(option.catId);
    this.catSearch.set(option.label);

    this.selectedOwnerId.set(null);
    this.ownerSearch.set('');

    this.emitFilters();
  }

  selectOwner(option: StayOwnerFilterOption): void {
    this.selectedOwnerId.set(option.ownerId);
    this.ownerSearch.set(option.label);

    this.selectedCatId.set(null);
    this.catSearch.set('');

    this.emitFilters();
  }

  clearCat(): void {
    this.selectedCatId.set(null);
    this.catSearch.set('');
    this.emitFilters();
  }

  clearOwner(): void {
    this.selectedOwnerId.set(null);
    this.ownerSearch.set('');
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
