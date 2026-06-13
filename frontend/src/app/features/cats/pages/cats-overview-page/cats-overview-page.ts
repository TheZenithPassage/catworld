import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { Cat, Sex } from '../../models/cat.model';
import { CatApiService } from '../../services/cat-api.service';
import { matchesSearchText } from '../../../../core/search/search-text.util';

@Component({
  selector: 'app-cats-overview-page',
  imports: [RouterLink],
  templateUrl: './cats-overview-page.html',
  styleUrl: './cats-overview-page.scss',
})
export class CatsOverviewPage {
  private readonly catApiService = inject(CatApiService);
  private readonly i18nService = inject(I18nService);

  readonly text = this.i18nService.text;
  readonly dateLocale = this.i18nService.dateLocale;

  readonly cats = signal<Cat[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly searchText = signal('');

  readonly filteredCats = computed(() =>
    this.cats().filter((cat) => matchesSearchText([cat.name, cat.ownerName], this.searchText())),
  );

  constructor() {
    this.loadCats();
  }

  loadCats(): void {
    this.loading.set(true);
    this.error.set(null);

    this.catApiService.getCats().subscribe({
      next: (cats) => {
        this.cats.set(cats);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.text().cats.overview.errorLoading);
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
    return value || this.text().cats.emptyValue;
  }

  formatDate(value: string | null): string {
    if (!value) {
      return this.text().cats.emptyValue;
    }

    return new Intl.DateTimeFormat(this.dateLocale(), {
      dateStyle: 'short',
    }).format(new Date(`${value}T00:00:00`));
  }

  formatSex(sex: Sex): string {
    return sex === 'MALE' ? this.text().cats.form.male : this.text().cats.form.female;
  }

  getAppearance(cat: Cat): string {
    const values = [cat.breed, cat.coat, cat.color].filter(Boolean);

    return values.length > 0 ? values.join(' / ') : this.text().cats.emptyValue;
  }
}
