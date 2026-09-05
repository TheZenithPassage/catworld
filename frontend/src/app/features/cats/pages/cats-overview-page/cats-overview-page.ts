import { afterNextRender, Component, DestroyRef, inject, signal } from '@angular/core';
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
import { CatOverviewItem } from '../../models/cat.model';
import { CatApiService } from '../../services/cat-api.service';
@Component({
  selector: 'app-cats-overview-page',
  imports: [
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
    MatPaginator,
    RouterLink,
    UiStateComponent,
  ],
  templateUrl: './cats-overview-page.html',
  styleUrl: './cats-overview-page.scss',
})
export class CatsOverviewPage {
  private readonly api = inject(CatApiService);
  private readonly i18n = inject(I18nService);
  private readonly details = inject(EntityDetailDialogService);
  private request?: Subscription;
  private timer?: ReturnType<typeof setTimeout>;
  private photoObserverTimer?: ReturnType<typeof setTimeout>;
  private requestId = 0;
  private destroyed = false;
  private observer?: IntersectionObserver;
  private readonly photoRequests = new Map<string, Subscription>();
  private readonly urls = new Map<string, string>();
  readonly text = this.i18n.text;
  readonly cats = signal<CatOverviewItem[]>([]);
  readonly photos = signal<Record<string, string>>({});
  readonly loading = signal(false);
  readonly error = createLanguageResetError(this.i18n.language);
  readonly searchText = signal('');
  readonly page = signal(0);
  readonly totalElements = signal(0);
  readonly pageSize = 10;
  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.requestId++;
      clearTimeout(this.timer);
      this.request?.unsubscribe();
      this.retirePhotos();
    });
    afterNextRender(() => this.loadCats());
  }
  loadCats(page = this.page()): void {
    if (this.destroyed) return;
    const id = ++this.requestId;
    this.request?.unsubscribe();
    this.retirePhotos();
    this.loading.set(true);
    this.error.set(null);
    this.request = this.api.getCatOverview(page, this.searchText()).subscribe({
      next: (r) => {
        if (id !== this.requestId) return;
        const lastValidPage = Math.max(0, Math.ceil(r.totalElements / this.pageSize) - 1);
        if (page > lastValidPage) {
          this.loadCats(lastValidPage);
          return;
        }
        this.cats.set(r.items);
        this.page.set(r.page);
        this.totalElements.set(r.totalElements);
        this.loading.set(false);
        this.photoObserverTimer = setTimeout(() => {
          this.photoObserverTimer = undefined;
          if (!this.destroyed && id === this.requestId) this.observePhotos(id);
        });
      },
      error: () => {
        if (id === this.requestId) {
          this.error.set(this.text().cats.overview.errorLoading);
          this.loading.set(false);
        }
      },
    });
  }
  setSearchText(v: string): void {
    this.requestId++;
    this.request?.unsubscribe();
    this.searchText.set(v);
    clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = undefined;
      if (this.destroyed) return;
      this.page.set(0);
      this.loadCats(0);
    }, 300);
  }
  clearSearch(): void {
    clearTimeout(this.timer);
    this.searchText.set('');
    this.page.set(0);
    this.loadCats(0);
  }
  changePage(e: PageEvent): void {
    this.loadCats(e.pageIndex);
  }
  openCat(c: CatOverviewItem): void {
    this.details.open({ entityType: 'cat', entityId: c.id }).subscribe(() => this.loadCats());
  }
  activateCat(e: KeyboardEvent, c: CatOverviewItem): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      this.openCat(c);
    }
  }
  private observePhotos(generation: number): void {
    if (this.destroyed || generation !== this.requestId) return;
    this.observer?.disconnect();
    this.observer = new IntersectionObserver(
      (entries) => {
        if (this.destroyed || generation !== this.requestId) return;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const id = (entry.target as HTMLElement).dataset['catId'];
          if (id) this.loadPhoto(id, generation);
          this.observer?.unobserve(entry.target);
        }
      },
      { rootMargin: '160px' },
    );
    document
      .querySelectorAll<HTMLElement>('[data-cat-photo="true"]')
      .forEach((el) => this.observer?.observe(el));
  }
  private loadPhoto(id: string, generation: number): void {
    if (
      this.destroyed ||
      generation !== this.requestId ||
      this.photoRequests.has(id) ||
      this.urls.has(id)
    )
      return;
    this.photoRequests.set(
      id,
      this.api.getCatPhoto(id).subscribe({
        next: (blob) => {
          this.photoRequests.delete(id);
          if (this.destroyed || generation !== this.requestId) return;
          const url = URL.createObjectURL(blob);
          this.urls.set(id, url);
          this.photos.update((p) => ({ ...p, [id]: url }));
        },
        error: () => this.photoRequests.delete(id),
      }),
    );
  }
  private retirePhotos(): void {
    clearTimeout(this.photoObserverTimer);
    this.photoObserverTimer = undefined;
    this.observer?.disconnect();
    this.observer = undefined;
    this.photoRequests.forEach((r) => r.unsubscribe());
    this.photoRequests.clear();
    this.urls.forEach((url) => URL.revokeObjectURL(url));
    this.urls.clear();
    this.photos.set({});
  }
}
