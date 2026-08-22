import { Component, computed, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { RouterLink } from '@angular/router';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { Vet } from '../../models/vet.model';
import { VetApiService } from '../../services/vet-api.service';
import { matchesSearchText } from '../../../../core/search/search-text.util';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';

@Component({
  selector: 'app-vets-overview-page',
  imports: [
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    MatTableModule,
    RouterLink,
    UiStateComponent,
  ],
  templateUrl: './vets-overview-page.html',
  styleUrl: './vets-overview-page.scss',
})
export class VetsOverviewPage {
  private readonly vetApiService = inject(VetApiService);
  private readonly i18nService = inject(I18nService);
  private readonly details = inject(EntityDetailDialogService);

  readonly text = this.i18nService.text;

  readonly vets = signal<Vet[]>([]);
  readonly loading = signal(false);
  readonly error = createLanguageResetError(this.i18nService.language);
  readonly searchText = signal('');
  readonly displayedColumns = ['name', 'phoneNumber', 'address'];

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
  openVet(vet: Vet): void {
    this.details.open({ entityType: 'vet', entityId: vet.id });
  }
  activateVet(event: KeyboardEvent, vet: Vet): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openVet(vet);
    }
  }
}
