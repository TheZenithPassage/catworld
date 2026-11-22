import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { map } from 'rxjs';
import { CatPhotoFrame, CENTERED_PHOTO_FRAME } from '../../models/cat.model';
import { CatApiService } from '../../services/cat-api.service';

@Component({
  selector: 'app-cat-photo-thumbnail',
  template: `
    @if (url(); as source) {
      <img [src]="source" alt=""
        [style.object-fit]="informationalPhotoId() ? null : 'cover'"
        [style.object-position]="position()" [style.transform-origin]="position()"
        [style.transform]="informationalPhotoId() ? null : 'scale(' + frame().frameZoom / 100 + ')'" />
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
  protected readonly frame = signal<CatPhotoFrame>(CENTERED_PHOTO_FRAME);
  protected readonly position = computed(() => this.frame().frameX + '% ' + this.frame().frameY + '%');
  protected readonly url = signal<string | null>(null);

  constructor() {
    const session = this.auth.authenticated();
    effect((onCleanup) => {
      this.url.set(null);
      if (this.auth.authenticated() !== session) return;
      const catId = this.catId();
      const informationalPhotoId = this.informationalPhotoId();
      const photo = informationalPhotoId
        ? this.api.getInformationalPhoto(catId, informationalPhotoId).pipe(
            map((blob) => ({ blob, frame: CENTERED_PHOTO_FRAME })),
          )
        : this.api.getFramedCatPhoto(catId);
      let url: string | undefined;
      const request = photo.subscribe({
        next: ({ blob, frame }) => {
          this.frame.set(frame);
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
