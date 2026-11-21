import { Component, effect, inject, input, signal } from '@angular/core';
import { CatApiService } from '../../services/cat-api.service';

@Component({
  selector: 'app-cat-informational-photo-thumbnail',
  template: `
    @if (url(); as source) {
      <img [src]="source" alt="" />
    }
  `,
  styles: `
    :host {
      display: block;
      height: 6rem;
      overflow: hidden;
      background: var(--mat-sys-surface-container-low);
      border-radius: 0.5rem;
    }

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  `,
})
export class CatInformationalPhotoThumbnail {
  private readonly api = inject(CatApiService);
  readonly catId = input.required<string>();
  readonly photoId = input.required<string>();
  readonly url = signal<string | null>(null);

  constructor() {
    effect((onCleanup) => {
      this.url.set(null);
      let url: string | undefined;
      const request = this.api.getInformationalPhoto(this.catId(), this.photoId()).subscribe({
        next: (blob) => {
          url = URL.createObjectURL(blob);
          this.url.set(url);
        },
        error: () => this.url.set(null),
      });
      onCleanup(() => {
        request.unsubscribe();
        if (url) URL.revokeObjectURL(url);
      });
    });
  }
}
