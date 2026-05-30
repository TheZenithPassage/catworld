import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Cat, Sex } from '../../models/cat.model';
import { CatApiService } from '../../services/cat-api.service';

@Component({
  selector: 'app-cats-overview-page',
  imports: [RouterLink],
  templateUrl: './cats-overview-page.html',
  styleUrl: './cats-overview-page.scss'
})
export class CatsOverviewPage {
  private readonly catApiService = inject(CatApiService);

  readonly cats = signal<Cat[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

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
        this.error.set('Error loading cats');
        this.loading.set(false);
      }
    });
  }

  formatOptionalValue(value: string | null): string {
    return value || '-';
  }

  formatDate(value: string | null): string {
    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'short'
    }).format(new Date(`${value}T00:00:00`));
  }

  formatSex(sex: Sex): string {
    return sex === 'MALE' ? 'Male' : 'Female';
  }

  getAppearance(cat: Cat): string {
    const values = [cat.breed, cat.coat, cat.color].filter(Boolean);

    return values.length > 0 ? values.join(' / ') : '-';
  }
}
