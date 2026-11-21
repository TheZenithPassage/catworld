import { Component, effect, inject, input, signal } from '@angular/core';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { CatApiService } from '../../services/cat-api.service';

@Component({
  selector: 'app-cat-photo-thumbnail',
  template: `
    @if (url(); as source) {
      <img [src]="source" alt="" />
    }
  `,
  styles: `
    :host {
      display: block;
      height: 100%;
      overflow: hidden;
      background: var(--mat-sys-surface-container-low);
      border-radius: 0.5rem;
    }

    img {
      display: block;
      width: 100%;
      height: 100%;
      object-fit: var(--cat-thumbnail-fit, contain);
    }
  `,
})
export class CatPhotoThumbnail {
  private readonly api = inject(CatApiService);
  private readonly auth = inject(AuthSessionService);
  readonly catId = input.required<string>();
  readonly informationalPhotoId = input<string>();
  protected readonly url = signal<string | null>(null);

  constructor() {
    const session = this.auth.authenticated();
    effect((onCleanup) => {
      this.url.set(null);
      if (this.auth.authenticated() !== session) return;
      const catId = this.catId();
      const informationalPhotoId = this.informationalPhotoId();
      const photo = informationalPhotoId
        ? this.api.getInformationalPhoto(catId, informationalPhotoId)
        : this.api.getCatPhoto(catId);
      let url: string | undefined;
      const request = photo.subscribe({
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
