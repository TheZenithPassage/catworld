import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  DestroyRef,
  inject,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatOption } from '@angular/material/core';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect } from '@angular/material/select';
import { finalize, Observable, Subscription } from 'rxjs';

import { I18nService } from '../../core/i18n/i18n.service';
import { GALLERY_PUBLICATION_TRANSLATIONS } from '../../core/i18n/translations/gallery-publication.translations';
import { CatPhotoInput } from '../cats/components/cat-photo-input/cat-photo-input';
import { catPhotoErrorMessage } from '../cats/utils/cat-photo-error';
import {
  GalleryCatKind,
  GalleryPublicationApi,
  GalleryPublicationRequest,
  GalleryPublicationSummary,
} from './gallery-publication-api.service';

type FeedbackKey = 'saved' | 'publishedMessage' | 'hiddenMessage';

@Component({
  selector: 'app-gallery-publication-page',
  imports: [
    CatPhotoInput,
    FormsModule,
    MatButton,
    MatCheckbox,
    MatFormField,
    MatInput,
    MatLabel,
    MatOption,
    MatSelect,
  ],
  templateUrl: './gallery-publication-page.html',
  styleUrl: './gallery-publication-page.scss',
})
export class GalleryPublicationPage implements OnDestroy {
  private readonly api = inject(GalleryPublicationApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly i18n = inject(I18nService);
  private readonly photoInput = viewChild(CatPhotoInput);
  private previewRequest: Subscription | undefined;

  readonly text = computed(() => GALLERY_PUBLICATION_TRANSLATIONS[this.i18n.language()]);
  readonly entries = signal<GalleryPublicationSummary[]>([]);
  readonly selected = signal<GalleryPublicationSummary | null>(null);
  readonly editorOpen = signal(false);
  readonly name = signal('');
  readonly description = signal('');
  readonly kind = signal<GalleryCatKind>('RESIDENT');
  readonly permission = signal(false);
  readonly previewUrl = signal<string | null>(null);
  readonly previewFailed = signal(false);
  readonly loading = signal(false);
  readonly loadFailed = signal(false);
  readonly busy = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly feedback = signal<FeedbackKey | null>(null);
  readonly stale = signal(false);

  readonly selectedPhoto = computed(() => this.photoInput()?.selectedFile() ?? null);
  readonly published = computed(() => this.selected()?.publishedAt != null);
  readonly dirty = computed(() => {
    const entry = this.selected();
    return (
      !!this.selectedPhoto() ||
      this.name().trim() !== (entry?.name ?? '') ||
      this.description().trim() !== (entry?.description ?? '') ||
      this.kind() !== (entry?.kind ?? 'RESIDENT')
    );
  });
  readonly canSave = computed(
    () =>
      !this.busy() &&
      !this.published() &&
      !this.stale() &&
      !!this.name().trim() &&
      this.dirty() &&
      (!!this.selected() || !!this.selectedPhoto()),
  );
  readonly canPublish = computed(
    () =>
      !this.busy() &&
      !this.published() &&
      !this.stale() &&
      !!this.selected() &&
      !this.dirty() &&
      !!this.previewUrl() &&
      (this.kind() !== 'GUEST' || this.permission()),
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.loadFailed.set(false);
    this.api
      .list()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (entries) => this.entries.set(entries),
        error: () => this.loadFailed.set(true),
      });
  }

  open(entry: GalleryPublicationSummary | null): void {
    this.actionError.set(null);
    this.feedback.set(null);
    this.loadEditor(entry);
  }

  save(): void {
    if (!this.canSave()) return;
    const selected = this.selected();
    const photo = this.selectedPhoto();
    const request: GalleryPublicationRequest = {
      name: this.name().trim(),
      description: this.description().trim() || null,
      kind: this.kind(),
    };
    if (selected) {
      this.run(this.api.update(selected.id, request, photo), 'saved');
    } else if (photo) {
      this.run(this.api.create(request, photo), 'saved');
    }
  }

  publish(): void {
    const entry = this.selected();
    if (!entry || !this.canPublish()) return;
    this.run(this.api.publish(entry.id, entry.version, this.permission()), 'publishedMessage');
  }

  hide(): void {
    const entry = this.selected();
    if (!entry?.publishedAt || this.busy() || this.stale()) return;
    this.run(this.api.hide(entry.id), 'hiddenMessage');
  }

  markPreviewFailed(url: string): void {
    if (this.previewUrl() !== url) return;
    this.releasePreview();
    this.previewFailed.set(true);
  }

  ngOnDestroy(): void {
    this.previewRequest?.unsubscribe();
    this.releasePreview();
  }

  private run(request: Observable<GalleryPublicationSummary>, feedback: FeedbackKey): void {
    this.busy.set(true);
    this.actionError.set(null);
    this.feedback.set(null);
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.busy.set(false)),
      )
      .subscribe({
        next: (entry) => {
          this.entries.update((entries) => {
            if (!entries.some(({ id }) => id === entry.id)) return [entry, ...entries];
            return entries.map((current) => (current.id === entry.id ? entry : current));
          });
          this.loadEditor(entry);
          this.feedback.set(feedback);
        },
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 409) {
            this.stale.set(true);
            this.actionError.set(this.text().conflict);
            this.load();
          } else {
            this.actionError.set(
              catPhotoErrorMessage(error, this.i18n.text().cats.photo.errors) ??
                this.text().actionError,
            );
          }
        },
      });
  }

  private loadEditor(entry: GalleryPublicationSummary | null): void {
    this.previewRequest?.unsubscribe();
    this.releasePreview();
    this.previewFailed.set(false);
    this.photoInput()?.reset();
    this.editorOpen.set(true);
    this.selected.set(entry);
    this.name.set(entry?.name ?? '');
    this.description.set(entry?.description ?? '');
    this.kind.set(entry?.kind ?? 'RESIDENT');
    this.permission.set(false);
    this.stale.set(false);
    if (entry) {
      this.previewRequest = this.api
        .preview(entry.id)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (blob) => this.previewUrl.set(URL.createObjectURL(blob)),
          error: () => this.previewFailed.set(true),
        });
    }
  }

  private releasePreview(): void {
    const preview = this.previewUrl();
    if (preview) URL.revokeObjectURL(preview);
    this.previewUrl.set(null);
  }
}
