import { Component, computed, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { Cat } from '../../models/cat.model';
import { CatApiService } from '../../services/cat-api.service';
import { matchesSearchText } from '../../../../core/search/search-text.util';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import { CatOverviewPhoto } from '../../components/cat-overview-photo/cat-overview-photo';

@Component({
  selector: 'app-cats-overview-page',
  imports: [
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    MatTableModule,
    RouterLink,
    CatOverviewPhoto,
    UiStateComponent,
  ],
  templateUrl: './cats-overview-page.html',
  styleUrl: './cats-overview-page.scss',
})
export class CatsOverviewPage {
  private readonly catApiService = inject(CatApiService);
  private readonly i18nService = inject(I18nService);
  private readonly details = inject(EntityDetailDialogService);

  readonly text = this.i18nService.text;
  readonly cats = signal<Cat[]>([]);
  readonly loading = signal(false);
  readonly error = createLanguageResetError(this.i18nService.language);
  readonly searchText = signal('');
  readonly displayedColumns = ['photo', 'name', 'owner'];

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

  openCat(cat: Cat): void {
    this.details.open({ entityType: 'cat', entityId: cat.id }).subscribe(() => this.loadCats());
  }
  activateCat(event: KeyboardEvent, cat: Cat): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openCat(cat);
    }
  }
}
