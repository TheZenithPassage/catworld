import {
  afterNextRender,
  Component,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

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
  StayDateFilters,
  StaySearchFilters,
} from '../../utils/stay-search-filter.util';

import { StayDateFiltersComponent } from '../../../../shared/stay-date-filters/stay-date-filters';

@Component({
  selector: 'app-stay-search-filters',
  imports: [RemoteEntitySelector, StayDateFiltersComponent],
  templateUrl: './stay-search-filters.html',
  styleUrl: './stay-search-filters.scss',
})
export class StaySearchFiltersComponent {
  private readonly i18nService = inject(I18nService);

  readonly text = this.i18nService.text;
  readonly filtersChange = output<StaySearchFilters>();
  readonly dateFilters = input<StayDateFilters>(getDefaultStaySearchFilters());
  readonly dates = viewChild(StayDateFiltersComponent);
  validateDates(): boolean {
    return this.dates()?.validate() ?? true;
  }
  setDates(dates: StayDateFilters): void {
    this.emitFilters(dates);
  }
  readonly initialCatId = input<string | null>(null);
  readonly initialOwnerId = input<string | null>(null);
  readonly catAdapter = inject(CatLookupAdapter);
  readonly ownerAdapter = inject(OwnerLookupAdapter);
  readonly catSelector = viewChild<RemoteEntitySelector<CatLookup>>('catSelector');
  readonly ownerSelector = viewChild<RemoteEntitySelector<OwnerLookup>>('ownerSelector');

  readonly selectedCatId = signal<string | null>(null);
  readonly selectedOwnerId = signal<string | null>(null);
  constructor() {
    afterNextRender(() => {
      const catId = this.initialCatId();
      const ownerId = this.initialOwnerId();
      // The deep link already supplies the filter identity; resolving its label
      // must not temporarily remove it from date/mode draft changes.
      this.selectedCatId.set(catId);
      this.selectedOwnerId.set(catId ? null : ownerId);
      if (catId) this.catSelector()?.resolveKnownId(catId);
      else if (ownerId) this.ownerSelector()?.resolveKnownId(ownerId);
    });
  }
  onCatStateChange(state: EntityLookupState<CatLookup>): void {
    const changed = this.selectedCatId() !== state.selectedId;
    this.selectedCatId.set(state.selectedId);

    if (state.value !== null) {
      this.ownerSelector()?.reset();
    }

    if (changed) this.emitFilters();
  }

  onOwnerStateChange(state: EntityLookupState<OwnerLookup>): void {
    const changed = this.selectedOwnerId() !== state.selectedId;
    this.selectedOwnerId.set(state.selectedId);

    if (state.value !== null) {
      this.catSelector()?.reset();
    }

    if (changed) this.emitFilters();
  }

  private emitFilters(change: StayDateFilters = {}): void {
    this.filtersChange.emit({
      ...getDefaultStaySearchFilters(),
      ...this.dateFilters(),
      ...change,
      catId: this.selectedCatId(),
      ownerId: this.selectedOwnerId(),
    });
  }
}
