import { Component, computed, inject, input, output, signal } from '@angular/core';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
} from '@angular/material/autocomplete';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
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
  imports: [FormsModule, MatAutocompleteModule, MatButton, MatFormField, MatInput, MatLabel],
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

  readonly hasSearchFilters = computed(
    () =>
      Boolean(this.selectedCatId()) ||
      Boolean(this.selectedOwnerId()) ||
      Boolean(this.catSearch().trim()) ||
      Boolean(this.ownerSearch().trim()),
  );

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

  selectCatFromAutocomplete(event: MatAutocompleteSelectedEvent): void {
    this.selectCat(event.option.value as StayCatFilterOption);
  }

  selectOwner(option: StayOwnerFilterOption): void {
    this.selectedOwnerId.set(option.ownerId);
    this.ownerSearch.set(option.label);

    this.selectedCatId.set(null);
    this.catSearch.set('');

    this.emitFilters();
  }

  selectOwnerFromAutocomplete(event: MatAutocompleteSelectedEvent): void {
    this.selectOwner(event.option.value as StayOwnerFilterOption);
  }

  displayCatOption(option: StayCatFilterOption | string | null): string {
    return typeof option === 'string' ? option : (option?.label ?? '');
  }

  displayOwnerOption(option: StayOwnerFilterOption | string | null): string {
    return typeof option === 'string' ? option : (option?.label ?? '');
  }

  clearFilters(): void {
    this.selectedCatId.set(null);
    this.catSearch.set('');
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
