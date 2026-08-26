import { Component, computed, inject, output, signal, viewChild } from '@angular/core';
import { MatButton } from '@angular/material/button';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { CatLookup } from '../../../cats/models/cat.model';
import { OwnerLookup } from '../../../owners/models/owner.model';
import {
  CatLookupAdapter,
  OwnerLookupAdapter,
} from '../../../../shared/entity-lookup/domain-lookup.adapters';
import { EntityLookupState } from '../../../../shared/entity-lookup/entity-lookup.models';
import { RemoteEntitySelector } from '../../../../shared/entity-lookup/remote-entity-selector';
import {
  getDefaultStaySearchFilters,
  StaySearchFilters,
} from '../../utils/stay-search-filter.util';

@Component({
  selector: 'app-stay-search-filters',
  imports: [MatButton, RemoteEntitySelector],
  templateUrl: './stay-search-filters.html',
  styleUrl: './stay-search-filters.scss',
})
export class StaySearchFiltersComponent {
  private readonly i18nService = inject(I18nService);

  readonly text = this.i18nService.text;
  readonly filtersChange = output<StaySearchFilters>();
  readonly catAdapter = inject(CatLookupAdapter);
  readonly ownerAdapter = inject(OwnerLookupAdapter);
  readonly catSelector = viewChild<RemoteEntitySelector<CatLookup>>('catSelector');
  readonly ownerSelector = viewChild<RemoteEntitySelector<OwnerLookup>>('ownerSelector');

  readonly selectedCatId = signal<string | null>(null);
  readonly selectedOwnerId = signal<string | null>(null);
  readonly catContentPresent = signal(false);
  readonly ownerContentPresent = signal(false);

  readonly hasSearchFilters = computed(
    () =>
      Boolean(this.selectedCatId()) ||
      Boolean(this.selectedOwnerId()) ||
      this.catContentPresent() ||
      this.ownerContentPresent(),
  );

  onCatStateChange(state: EntityLookupState<CatLookup>): void {
    this.catContentPresent.set(state.rawContentPresent);
    const changed = this.selectedCatId() !== state.selectedId;
    this.selectedCatId.set(state.selectedId);

    if (state.value !== null) {
      this.ownerSelector()?.reset();
    }

    if (changed) this.emitFilters();
  }

  onOwnerStateChange(state: EntityLookupState<OwnerLookup>): void {
    this.ownerContentPresent.set(state.rawContentPresent);
    const changed = this.selectedOwnerId() !== state.selectedId;
    this.selectedOwnerId.set(state.selectedId);

    if (state.value !== null) {
      this.catSelector()?.reset();
    }

    if (changed) this.emitFilters();
  }

  clearFilters(): void {
    this.catSelector()?.reset();
    this.ownerSelector()?.reset();
    if (this.selectedCatId() === null && this.selectedOwnerId() === null) this.emitFilters();
  }

  private emitFilters(): void {
    this.filtersChange.emit({
      ...getDefaultStaySearchFilters(),
      catId: this.selectedCatId(),
      ownerId: this.selectedOwnerId(),
    });
  }
}
