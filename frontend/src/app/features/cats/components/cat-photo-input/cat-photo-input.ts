import { Component, computed, inject, input, OnDestroy, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { CatPhotoMutation } from '../../models/cat.model';

const MAX_PHOTO_BYTES = 32 * 1024 * 1024;
const ACCEPTED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'heic', 'heif']);
const ACCEPTED_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/heic',
  'image/heif',
]);
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
  readonly savedHasPhoto = input(false);
  readonly disabled = input(false);
  readonly text = this.i18n.text;
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
    this.removePhoto.set(false);
    if (this.canPreview(file)) {
      this.previewUrl.set(URL.createObjectURL(file));
    }
    return true;
  }

  previewFailed(url: string): void {
    if (this.previewUrl() === url) this.releasePreview();
  }

  removeSelection(): void {
    this.releasePreview();
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
    return { photo: this.selectedFile(), removePhoto: this.removePhoto() };
  }

  reset(): void {
    this.releasePreview();
    this.selectedFile.set(null);
    this.removePhoto.set(false);
    this.selectionError.set(null);
  }

  ngOnDestroy(): void {
    this.releasePreview();
  }

  private validate(file: File): string | null {
    if (file.size > MAX_PHOTO_BYTES) return this.text().cats.photo.errors.localFileTooLarge;
    const type = file.type.toLowerCase();
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    const mimeClearlyUnsupported = !GENERIC_TYPES.has(type) && !ACCEPTED_TYPES.has(type);
    const extensionClearlyUnsupported = extension !== '' && !ACCEPTED_EXTENSIONS.has(extension);
    if (mimeClearlyUnsupported && extensionClearlyUnsupported) {
      return this.text().cats.photo.errors.localUnsupportedFormat;
    }
    return null;
  }

  private canPreview(file: File): boolean {
    const type = file.type.toLowerCase();
    if (PREVIEW_TYPES.has(type)) return true;
    if (!GENERIC_TYPES.has(type)) return false;
    const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
    return PREVIEW_EXTENSIONS.has(extension);
  }

  private releasePreview(): void {
    const current = this.previewUrl();
    if (current) URL.revokeObjectURL(current);
    this.previewUrl.set(null);
  }
}
