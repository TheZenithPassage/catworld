import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { Vet } from '../../models/vet.model';
import { VetApiService } from '../../services/vet-api.service';
import { matchesSearchText } from '../../../../core/search/search-text.util';

@Component({
  selector: 'app-vets-overview-page',
  imports: [RouterLink],
  templateUrl: './vets-overview-page.html',
  styleUrl: './vets-overview-page.scss',
})
export class VetsOverviewPage {
  private readonly vetApiService = inject(VetApiService);
  private readonly i18nService = inject(I18nService);

  readonly text = this.i18nService.text;

  readonly vets = signal<Vet[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchText = signal('');

  readonly filteredVets = computed(() =>
    this.vets().filter((vet) => matchesSearchText([vet.name], this.searchText())),
  );

  constructor() {
    this.loadVets();
  }

  loadVets(): void {
    this.loading.set(true);
    this.error.set(null);

    this.vetApiService.getVets().subscribe({
      next: (vets) => {
        this.vets.set(vets);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.text().vets.overview.errorLoading);
        this.loading.set(false);
      },
    });
  }

  setSearchText(value: string): void {
    this.searchText.set(value);
  }

  clearSearch(): void {
    this.searchText.set('');
  }

  formatOptionalValue(value: string | null): string {
    return value || this.text().vets.emptyValue;
  }
}
