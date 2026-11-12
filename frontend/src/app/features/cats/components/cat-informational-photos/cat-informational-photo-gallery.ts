import {
  afterNextRender,
  Component,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { CatInformationalPhoto } from '../../models/cat.model';
import { CatApiService } from '../../services/cat-api.service';
import { catPhotoErrorMessage } from '../../utils/cat-photo-error';
import { CAT_PHOTO_ACCEPT, catPhotoFileError } from '../../utils/cat-photo-file';
import { CatInformationalPhotoThumbnail } from './cat-informational-photo-thumbnail';

@Component({
  selector: 'app-cat-informational-photo-gallery',
  imports: [MatButton, CatInformationalPhotoThumbnail],
  templateUrl: './cat-informational-photo-gallery.html',
  styleUrl: './cat-informational-photo-gallery.scss',
})
export class CatInformationalPhotoGallery {
  private readonly api = inject(CatApiService);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly addButton = viewChild('addButton', { read: ElementRef<HTMLButtonElement> });
  private readonly cancelButton = viewChild('cancelButton', {
    read: ElementRef<HTMLButtonElement>,
  });
  private readonly removeButtons = viewChildren('removeButton', {
    read: ElementRef<HTMLButtonElement>,
  });
  private listRequest: Subscription | undefined;
  readonly catId = input.required<string>();
  readonly disabled = input(false);
  readonly openPhoto = output<string>();
  readonly busyChanged = output<boolean>();
  readonly text = this.i18n.text;
  readonly acceptedFormats = CAT_PHOTO_ACCEPT;
  readonly photos = signal<CatInformationalPhoto[]>([]);
  readonly loading = signal(true);
  readonly loadFailed = signal(false);
  readonly busy = signal(false);
  readonly pendingRemoval = signal<string | null>(null);
  readonly error = createLanguageResetError(this.i18n.language);

  constructor() {
    effect(() => {
      const catId = this.catId();
      this.photos.set([]);
      this.pendingRemoval.set(null);
      this.error.set(null);
      this.load(catId);
    });
  }

  load(catId = this.catId()): void {
    this.listRequest?.unsubscribe();
    this.loadFailed.set(false);
    this.loading.set(true);
    this.listRequest = this.api
      .listInformationalPhotos(catId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (photos) => {
          this.photos.set(photos);
          this.loading.set(false);
        },
        error: () => {
          this.loadFailed.set(true);
          this.loading.set(false);
        },
      });
  }

  select(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.disabled() || this.busy()) return;
    const catId = this.catId();
    const localError = catPhotoFileError(file);
    if (localError) {
      this.error.set(this.text().cats.photo.errors[localError]);
      return;
    }

    this.error.set(null);
    this.pendingRemoval.set(null);
    this.setBusy(true);
    this.api
      .addInformationalPhoto(catId, file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.setBusy(false);
          this.load(catId);
        },
        error: (error: unknown) => {
          this.setBusy(false);
          const { photo, informationalPhotos } = this.text().cats;
          this.error.set(
            catPhotoErrorMessage(error, photo.errors) ?? informationalPhotos.addFailed,
          );
        },
      });
  }

  requestRemoval(photoId: string): void {
    this.pendingRemoval.set(photoId);
    this.focusAfterRender(this.cancelButton);
  }

  cancelRemoval(photoId: string): void {
    this.pendingRemoval.set(null);
    this.focusAfterRender(() =>
      this.removeButtons().find(
        ({ nativeElement }) => nativeElement.dataset['photoId'] === photoId,
      ),
    );
  }

  remove(photoId: string): void {
    if (this.disabled() || this.busy() || this.pendingRemoval() !== photoId) return;
    this.error.set(null);
    this.setBusy(true);
    this.api
      .deleteInformationalPhoto(this.catId(), photoId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.photos.update((photos) => photos.filter((photo) => photo.id !== photoId));
          this.pendingRemoval.set(null);
          this.setBusy(false);
          this.focusAfterRender(this.addButton);
        },
        error: () => {
          this.setBusy(false);
          this.error.set(this.text().cats.informationalPhotos.removeFailed);
        },
      });
  }

  private setBusy(value: boolean): void {
    this.busy.set(value);
    this.busyChanged.emit(value);
  }

  private focusAfterRender(button: () => ElementRef<HTMLButtonElement> | undefined): void {
    afterNextRender({ write: () => button()?.nativeElement.focus() }, { injector: this.injector });
  }
}
