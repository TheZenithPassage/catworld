import { Component, DestroyRef, effect, inject, input, signal } from '@angular/core';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { CatApiService } from '../../services/cat-api.service';

@Component({
  selector: 'app-cat-overview-photo',
  templateUrl: './cat-overview-photo.html',
  styleUrl: './cat-overview-photo.scss',
})
export class CatOverviewPhoto {
  private readonly api = inject(CatApiService);
  private loadGeneration = 0;
  private currentUrl: string | null = null;

  readonly catId = input.required<string>();
  readonly catName = input.required<string>();
  readonly hasPhoto = input.required<boolean>();
  readonly text = inject(I18nService).text;
  readonly photoUrl = signal<string | null>(null);

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.loadGeneration++;
      this.replaceUrl(null);
    });

    effect(() => {
      const catId = this.catId();
      const hasPhoto = this.hasPhoto();
      const generation = ++this.loadGeneration;

      this.replaceUrl(null);
      if (!hasPhoto) return;

      this.api.getCatPhoto(catId).subscribe({
        next: (photo) => {
          if (generation !== this.loadGeneration || catId !== this.catId()) return;
          this.replaceUrl(URL.createObjectURL(photo));
        },
        error: () => {
          if (generation !== this.loadGeneration || catId !== this.catId()) return;
          this.replaceUrl(null);
        },
      });
    });
  }

  private replaceUrl(nextUrl: string | null): void {
    if (this.currentUrl) URL.revokeObjectURL(this.currentUrl);
    this.currentUrl = nextUrl;
    this.photoUrl.set(nextUrl);
  }
}
