import { Component, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { VetOverviewItem } from '../../models/vet.model';
import { VetApiService } from '../../services/vet-api.service';
@Component({
  selector: 'app-vets-overview-page',
  imports: [
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    MatPaginator,
    RouterLink,
    UiStateComponent,
  ],
  templateUrl: './vets-overview-page.html',
  styleUrl: './vets-overview-page.scss',
})
export class VetsOverviewPage {
  private readonly api = inject(VetApiService);
  private readonly i18n = inject(I18nService);
  private readonly details = inject(EntityDetailDialogService);
  private request?: Subscription;
  private timer?: ReturnType<typeof setTimeout>;
  private requestId = 0;
  readonly text = this.i18n.text;
  readonly vets = signal<VetOverviewItem[]>([]);
  readonly loading = signal(false);
  readonly error = createLanguageResetError(this.i18n.language);
  readonly searchText = signal('');
  readonly page = signal(0);
  readonly totalElements = signal(0);
  readonly pageSize = 10;
  constructor() {
    this.loadVets();
  }
  loadVets(page = this.page()): void {
    const id = ++this.requestId;
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);
    this.request = this.api.getVetOverview(page, this.searchText()).subscribe({
      next: (r) => {
        if (id !== this.requestId) return;
        const lastValidPage = Math.max(0, Math.ceil(r.totalElements / this.pageSize) - 1);
        if (page > lastValidPage) {
          this.loadVets(lastValidPage);
          return;
        }
        this.vets.set(r.items);
        this.page.set(r.page);
        this.totalElements.set(r.totalElements);
        this.loading.set(false);
      },
      error: () => {
        if (id === this.requestId) {
          this.error.set(this.text().vets.overview.errorLoading);
          this.loading.set(false);
        }
      },
    });
  }
  setSearchText(value: string): void {
    this.requestId++;
    this.request?.unsubscribe();
    this.searchText.set(value);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.page.set(0);
      this.loadVets(0);
    }, 300);
  }
  clearSearch(): void {
    clearTimeout(this.timer);
    this.searchText.set('');
    this.page.set(0);
    this.loadVets(0);
  }
  changePage(e: PageEvent): void {
    this.loadVets(e.pageIndex);
  }
  formatOptionalValue(v: string | null): string {
    return v || this.text().vets.emptyValue;
  }
  openVet(v: VetOverviewItem): void {
    this.details.open({ entityType: 'vet', entityId: v.id }).subscribe(() => this.loadVets());
  }
  activateVet(e: KeyboardEvent, v: VetOverviewItem): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.openVet(v);
    }
  }
}
