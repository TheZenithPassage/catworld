import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import {
  MatDialog,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogRef,
  MatDialogTitle,
} from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { CatInformationalPhoto } from '../../models/cat.model';
import { CatApiService } from '../../services/cat-api.service';
import { CAT_PHOTO_ACCEPT, catPhotoFileError } from '../../utils/cat-photo-file';
import { CatInformationalPhotoThumbnail } from './cat-informational-photo-thumbnail';

interface DraftPhoto {
  file: File;
  url: string;
}

@Component({
  selector: 'app-cat-informational-photo-gallery',
  imports: [
    MatButton,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    CatInformationalPhotoThumbnail,
  ],
  templateUrl: './cat-informational-photo-gallery.html',
  styleUrl: './cat-informational-photo-gallery.scss',
})
export class CatInformationalPhotoGallery {
  private readonly api = inject(CatApiService);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly auth = inject(AuthSessionService);
  private readonly dialog = inject(MatDialog);
  private readonly previewTemplate = viewChild.required<TemplateRef<unknown>>('preview');
  private readonly addButton = viewChild('addButton', { read: ElementRef<HTMLButtonElement> });
  private readonly cancelButton = viewChild('cancelButton', {
    read: ElementRef<HTMLButtonElement>,
  });
  private readonly removeButtons = viewChildren('removeButton', {
    read: ElementRef<HTMLButtonElement>,
  });
  private listRequest?: Subscription;
  private previewRequest?: Subscription;
  private previewRef?: MatDialogRef<unknown>;
  private savedPreviewUrl?: string;
  private readonly photos = signal<CatInformationalPhoto[]>([]);
  readonly catId = input<string | null>(null);
  readonly editable = input(false);
  readonly disabled = input(false);
  readonly openPhoto = output<string>();
  readonly text = this.i18n.text;
  readonly acceptedFormats = CAT_PHOTO_ACCEPT;
  readonly drafts = signal<DraftPhoto[]>([]);
  readonly removals = signal<string[]>([]);
  private readonly numberedPhotos = computed(() =>
    this.photos().map(({ id }, index) => ({ id, number: index + 1 })),
  );
  readonly visiblePhotos = computed(() => {
    const removals = new Set(this.removals());
    return this.numberedPhotos().filter(({ id }) => !removals.has(id));
  });
  readonly removedPhotos = computed(() => {
    const removals = new Set(this.removals());
    return this.numberedPhotos().filter(({ id }) => removals.has(id));
  });
  readonly loading = signal(false);
  readonly loadFailed = signal(false);
  readonly pendingRemoval = signal<string | null>(null);
  readonly error = createLanguageResetError(this.i18n.language);
  readonly previewUrl = signal<string | null>(null);
  readonly previewLoading = signal(false);

  constructor() {
    effect(() => {
      const catId = this.catId();
      this.photos.set([]);
      if (catId) this.load(catId);
    });
    let session = this.auth.authenticated();
    effect(() => {
      const current = this.auth.authenticated();
      if (session && current !== session) {
        untracked(() => {
          this.listRequest?.unsubscribe();
          this.photos.set([]);
          this.resetDraft();
        });
      }
      session = current;
    });
    this.destroyRef.onDestroy(() => this.resetDraft());
  }

  load(catId = this.catId()): void {
    this.listRequest?.unsubscribe();
    if (!catId) return;
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
    if (file && this.editable() && !this.disabled()) this.stage(file);
  }

  stage(file: File): void {
    const localError = catPhotoFileError(file);
    if (localError) {
      this.error.set(this.text().cats.photo.errors[localError]);
      return;
    }
    this.error.set(null);
    this.pendingRemoval.set(null);
    this.drafts.update((drafts) => [...drafts, { file, url: URL.createObjectURL(file) }]);
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

  removeSaved(photoId: string): void {
    if (this.disabled() || this.pendingRemoval() !== photoId) return;
    this.removals.update((ids) => [...ids, photoId]);
    this.pendingRemoval.set(null);
    this.focusAfterRender(this.addButton);
  }

  restoreSaved(photoId: string): void {
    if (this.disabled()) return;
    this.removals.update((ids) => ids.filter((id) => id !== photoId));
    this.focusAfterRender(() =>
      this.removeButtons().find(
        ({ nativeElement }) => nativeElement.dataset['photoId'] === photoId,
      ),
    );
  }

  removeDraft(draft: DraftPhoto): void {
    this.drafts.update((drafts) => drafts.filter((entry) => entry !== draft));
    URL.revokeObjectURL(draft.url);
    this.focusAfterRender(this.addButton);
  }

  files(): File[] {
    return this.drafts().map(({ file }) => file);
  }

  resetDraft(): void {
    this.clearPreview();
    this.previewRef?.close();
    for (const draft of this.drafts()) URL.revokeObjectURL(draft.url);
    this.drafts.set([]);
    this.removals.set([]);
    this.pendingRemoval.set(null);
    this.error.set(null);
  }

  showSaved(photoId: string): void {
    if (!this.editable()) {
      this.openPhoto.emit(photoId);
      return;
    }
    const catId = this.catId();
    if (!catId || this.previewRef) return;
    this.openPreview();
    this.previewLoading.set(true);
    this.previewRequest = this.api.getInformationalPhoto(catId, photoId).subscribe({
      next: (blob) => {
        this.savedPreviewUrl = URL.createObjectURL(blob);
        this.previewUrl.set(this.savedPreviewUrl);
        this.previewLoading.set(false);
      },
      error: () => this.previewLoading.set(false),
    });
  }

  showDraft(draft: DraftPhoto): void {
    if (this.previewRef) return;
    this.previewUrl.set(draft.url);
    this.openPreview();
  }

  private openPreview(): void {
    const ref = this.dialog.open(this.previewTemplate(), {
      width: '44rem',
      maxWidth: 'calc(100vw - 2rem)',
      maxHeight: 'calc(100dvh - 2rem)',
    });
    this.previewRef = ref;
    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.previewRef = undefined;
        this.clearPreview();
      });
  }

  private clearPreview(): void {
    this.previewRequest?.unsubscribe();
    this.previewRequest = undefined;
    if (this.savedPreviewUrl) URL.revokeObjectURL(this.savedPreviewUrl);
    this.savedPreviewUrl = undefined;
    this.previewUrl.set(null);
    this.previewLoading.set(false);
  }

  private focusAfterRender(button: () => ElementRef<HTMLButtonElement> | undefined): void {
    afterNextRender({ write: () => button()?.nativeElement.focus() }, { injector: this.injector });
  }
}
