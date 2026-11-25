import { Component, computed, effect, inject, input, OnDestroy, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { CatPhotoFrame, CatPhotoMutation, CENTERED_PHOTO_FRAME } from '../../models/cat.model';
import { CatApiService } from '../../services/cat-api.service';
import { CAT_PHOTO_ACCEPT, catPhotoFileError } from '../../utils/cat-photo-file';

const PREVIEW_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const PREVIEW_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp']);
const GENERIC_TYPES = new Set(['', 'application/octet-stream']);

@Component({
  selector: 'app-cat-photo-input',
  imports: [MatButton],
  templateUrl: './cat-photo-input.html',
  styleUrl: './cat-photo-input.scss',
})
export class CatPhotoInput implements OnDestroy {
  private readonly i18n = inject(I18nService);
  private readonly api = inject(CatApiService, { optional: true });
  readonly catId = input<string>();
  readonly savedHasPhoto = input(false);
  readonly savedUrl = signal<string | null>(null);
  readonly savedFrame = signal(CENTERED_PHOTO_FRAME);
  readonly frame = signal(CENTERED_PHOTO_FRAME);
  readonly position = computed(() => this.frame().frameX + '% ' + this.frame().frameY + '%');
  readonly zoom = computed(() => 'scale(' + this.frame().frameZoom / 100 + ')');

  constructor() {
    effect((cleanup) => {
      const id = this.catId();
      if (!id || !this.savedHasPhoto() || !this.api) return;
      let url: string | undefined;
      const request = this.api.getFramedCatPhoto(id).subscribe({
        next: ({ blob, frame }) => {
          url = URL.createObjectURL(blob);
          this.savedUrl.set(url);
          this.savedFrame.set(frame);
          if (!this.selectedFile()) this.frame.set(frame);
        },
        error: () => this.savedUrl.set(null),
      });
      cleanup(() => {
        request.unsubscribe();
        if (url) URL.revokeObjectURL(url);
        this.savedUrl.set(null);
      });
    });
  }

  setFrame(key: keyof CatPhotoFrame, event: Event): void {
    this.frame.update((frame) => ({
      ...frame,
      [key]: Number((event.target as HTMLInputElement).value),
    }));
  }
  readonly disabled = input(false);
  readonly text = this.i18n.text;
  private previewRequest?: Subscription;
  readonly acceptedFormats = CAT_PHOTO_ACCEPT;
  readonly selectedFile = signal<File | null>(null);
  readonly removePhoto = signal(false);
  readonly previewUrl = signal<string | null>(null);
  readonly selectionError = signal<string | null>(null);
  readonly valid = computed(() => {
    const file = this.selectedFile();
    return file === null || this.validate(file) === null;
  });

  select(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file) return;
    this.restore(file);
  }

  restore(file: File): boolean {
    const error = this.validate(file);
    if (error) {
      this.selectionError.set(error);
      return false;
    }
    this.selectionError.set(null);
    this.releasePreview();
    this.selectedFile.set(file);
    this.normalizedPreview = false;
    this.frame.set(CENTERED_PHOTO_FRAME);
    this.removePhoto.set(false);
    if (this.canPreview(file)) {
      this.previewUrl.set(URL.createObjectURL(file));
    } else {
      this.loadNormalizedPreview(file);
    }
    return true;
  }

  previewFailed(url: string): void {
    if (this.previewUrl() !== url) return;
    const file = this.selectedFile();
    this.releasePreview();
    if (file && !this.normalizedPreview) this.loadNormalizedPreview(file);
  }

  private normalizedPreview = false;
  private loadNormalizedPreview(file: File): void {
    this.normalizedPreview = true;
    this.previewRequest = this.api?.previewCatPhoto(file).subscribe({
      next: (blob) => this.previewUrl.set(URL.createObjectURL(blob)),
      error: () => this.previewUrl.set(null),
    });
  }

  removeSelection(): void {
    this.releasePreview();
    this.frame.set(this.savedFrame());
    this.selectedFile.set(null);
    this.removePhoto.set(false);
    this.selectionError.set(null);
  }

  markSavedPhotoForRemoval(): void {
    this.releasePreview();
    this.selectedFile.set(null);
    this.removePhoto.set(true);
    this.selectionError.set(null);
  }

  undoRemoval(): void {
    this.removePhoto.set(false);
    this.selectionError.set(null);
  }

  mutation(): CatPhotoMutation {
    const frame = this.frame();
    const initial = this.selectedFile() ? CENTERED_PHOTO_FRAME : this.savedFrame();
    const changed =
      frame.frameX !== initial.frameX ||
      frame.frameY !== initial.frameY ||
      frame.frameZoom !== initial.frameZoom;
    return {
      photo: this.selectedFile(),
      removePhoto: this.removePhoto(),
      ...(!this.removePhoto() && changed ? { frame } : {}),
    };
  }

  reset(): void {
    this.releasePreview();
    this.frame.set(this.savedFrame());
    this.selectedFile.set(null);
    this.removePhoto.set(false);
    this.selectionError.set(null);
  }

  ngOnDestroy(): void {
    this.releasePreview();
  }

  private validate(file: File): string | null {
    const error = catPhotoFileError(file);
    return error ? this.text().cats.photo.errors[error] : null;
  }

  private canPreview(file: File): boolean {
    const type = file.type.toLowerCase();
    if (PREVIEW_TYPES.has(type)) return true;
    if (!GENERIC_TYPES.has(type)) return false;
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    return PREVIEW_EXTENSIONS.has(extension);
  }

  private releasePreview(): void {
    this.previewRequest?.unsubscribe();
    this.previewRequest = undefined;
    const current = this.previewUrl();
    if (current) URL.revokeObjectURL(current);
    this.previewUrl.set(null);
  }
}
