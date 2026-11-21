import { NgTemplateOutlet } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { finalize, Observable } from 'rxjs';

import { API_BASE_URL } from '../../core/config/api.config';
import { I18nService } from '../../core/i18n/i18n.service';
import {
  catalogOptionKey,
  CatProfileOptionsService,
} from '../../shared/cat-profile-options/cat-profile-options.service';
import { PermanentDeletionConfirmationDialog } from '../../shared/permanent-deletion/permanent-deletion-confirmation-dialog';

const FIELDS = [
  'breed',
  'foodBrand',
  'litterDetail',
  'lastInternalDewormerName',
  'lastExternalDewormerName',
] as const;
type Field = (typeof FIELDS)[number];

interface ManagedOption {
  id: string;
  name: string;
  field: Field | 'foodDetail';
  brandId: string | null;
  active: boolean;
}

@Component({
  selector: 'app-catalog-management',
  imports: [NgTemplateOutlet, MatButton, MatFormField, MatLabel, MatInput],
  templateUrl: './catalog-management.html',
  styleUrl: './catalog-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogManagement {
  private readonly http = inject(HttpClient);
  private readonly dialog = inject(MatDialog);
  private readonly optionsService = inject(CatProfileOptionsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly endpoint = `${API_BASE_URL}/cat-profile-options/manage`;
  private readonly i18n = inject(I18nService);

  protected readonly copy = computed(() => this.i18n.text().catalogs);
  protected readonly fields = FIELDS;
  protected readonly field = signal<Field>('breed');
  protected readonly brandId = signal('');
  protected readonly name = signal('');
  protected readonly varietyName = signal('');
  protected readonly renameId = signal<string | null>(null);
  protected readonly renameName = signal('');
  protected readonly items = signal<ManagedOption[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly loadError = signal(false);
  protected readonly saveError = signal<'duplicate' | 'saveError' | 'deleteError' | null>(null);
  protected readonly inUse = signal<ManagedOption | null>(null);
  protected readonly saved = signal(false);
  protected readonly options = computed(() =>
    this.items().filter((option) => option.field === this.field()),
  );
  protected readonly varieties = computed(() =>
    this.items().filter(
      (option) => option.field === 'foodDetail' && option.brandId === this.brandId(),
    ),
  );
  protected readonly disabled = computed(() => this.loading() || this.saving());

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.loadError.set(false);
    this.http
      .get<ManagedOption[]>(this.endpoint)
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loading.set(false)),
      )
      .subscribe({
        next: (items) => {
          this.items.set(items);
          if (
            !items.some((option) => option.field === 'foodBrand' && option.id === this.brandId())
          ) {
            this.brandId.set('');
          }
        },
        error: () => this.loadError.set(true),
      });
  }

  protected selectField(field: string): void {
    if (!this.fields.some((option) => option === field)) return;
    this.field.set(field as Field);
    this.brandId.set('');
    this.resetForm();
  }

  protected toggleBrand(option: ManagedOption): void {
    this.brandId.update((id) => (id === option.id ? '' : option.id));
    this.varietyName.set('');
    this.cancelRename();
    this.inUse.set(null);
  }

  protected add(brand?: ManagedOption): void {
    const name = (brand ? this.varietyName() : this.name()).trim();
    if (!name || this.disabled() || brand?.active === false) return;
    const options = brand ? this.varieties() : this.options();
    const key = catalogOptionKey(name);
    if (options.some((option) => key === catalogOptionKey(option.name))) {
      this.saved.set(false);
      this.saveError.set('duplicate');
      return;
    }
    this.mutate(this.optionsService.publish(brand ? 'foodDetail' : this.field(), name, brand?.id));
  }

  protected beginRename(option: ManagedOption): void {
    this.saved.set(false);
    this.saveError.set(null);
    this.renameId.set(option.id);
    this.renameName.set(option.name);
  }

  protected cancelRename(): void {
    this.renameId.set(null);
    this.renameName.set('');
  }

  protected rename(option: ManagedOption): void {
    const name = this.renameName().trim();
    if (!name || this.disabled()) return;
    this.change(option, { name });
  }

  protected toggleVisibility(option: ManagedOption): void {
    if (this.disabled()) return;
    this.change(option, { active: !option.active });
  }

  protected hideInUse(option: ManagedOption): void {
    if (!this.disabled() && option.active) this.change(option, { active: false });
  }

  protected deleteOption(option: ManagedOption): void {
    if (this.disabled()) return;
    this.dialog
      .open(PermanentDeletionConfirmationDialog, {
        data: {
          subject: option.name,
          extraDescription:
            option.field === 'foodBrand' ? this.copy().deleteBrand : this.copy().deleteOption,
        },
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed === true) {
          this.mutate(this.http.delete(this.optionEndpoint(option)), option);
        }
      });
  }

  private optionEndpoint(option: ManagedOption): string {
    return [this.endpoint, option.field, option.id].join('/');
  }

  private change(option: ManagedOption, change: { name: string } | { active: boolean }): void {
    this.mutate(this.http.patch(this.optionEndpoint(option), change));
  }

  private mutate(request: Observable<unknown>, deleting?: ManagedOption): void {
    this.saving.set(true);
    this.saved.set(false);
    this.saveError.set(null);
    this.inUse.set(null);
    request
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.saving.set(false)),
      )
      .subscribe({
        next: () => {
          this.resetForm();
          this.saved.set(true);
          this.load();
          this.optionsService.load();
          this.optionsService.loadVarieties();
        },
        error: (error: HttpErrorResponse) => {
          if (
            deleting &&
            error.status === 409 &&
            error.error?.code === 'CAT_CATALOG_OPTION_IN_USE'
          ) {
            this.inUse.set(deleting);
          } else {
            this.saveError.set(
              deleting ? 'deleteError' : error.status === 409 ? 'duplicate' : 'saveError',
            );
          }
        },
      });
  }

  private resetForm(): void {
    this.name.set('');
    this.varietyName.set('');
    this.cancelRename();
    this.saveError.set(null);
    this.inUse.set(null);
    this.saved.set(false);
  }
}
