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
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { finalize, Observable } from 'rxjs';

import { API_BASE_URL } from '../../core/config/api.config';
import { I18nService } from '../../core/i18n/i18n.service';
import { CatProfileOptionsService } from '../../shared/cat-profile-options/cat-profile-options.service';

const FIELDS = [
  'breed',
  'foodBrand',
  'foodDetail',
  'lastInternalDewormerName',
  'lastExternalDewormerName',
] as const;
type Field = (typeof FIELDS)[number];

interface ManagedOption {
  id: string;
  name: string;
  field: Field;
  brandId: string | null;
  active: boolean;
}

@Component({
  selector: 'app-catalog-management',
  imports: [MatButton, MatFormField, MatLabel, MatInput],
  templateUrl: './catalog-management.html',
  styleUrl: './catalog-management.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CatalogManagement {
  private readonly http = inject(HttpClient);
  private readonly optionsService = inject(CatProfileOptionsService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly endpoint = `${API_BASE_URL}/cat-profile-options/manage`;
  private readonly i18n = inject(I18nService);

  protected readonly copy = computed(() => this.i18n.text().catalogs);
  protected readonly fields = FIELDS;
  protected readonly field = signal<Field>('breed');
  protected readonly brandId = signal('');
  protected readonly name = signal('');
  protected readonly renameId = signal<string | null>(null);
  protected readonly renameName = signal('');
  protected readonly items = signal<ManagedOption[]>([]);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);
  protected readonly loadError = signal(false);
  protected readonly saveError = signal<'duplicate' | 'saveError' | null>(null);
  protected readonly saved = signal(false);
  protected readonly brands = computed(() =>
    this.items().filter((option) => option.field === 'foodBrand'),
  );
  protected readonly brand = computed(() =>
    this.brands().find((brand) => brand.id === this.brandId()),
  );
  protected readonly options = computed(() =>
    this.items().filter(
      (option) =>
        option.field === this.field() &&
        (this.field() !== 'foodDetail' || option.brandId === this.brandId()),
    ),
  );
  protected readonly maxLength = computed(() => (this.field() === 'foodDetail' ? 255 : 100));
  protected readonly disabled = computed(() => this.loading() || this.saving());
  protected readonly canAdd = computed(
    () => this.field() !== 'foodDetail' || this.brand()?.active === true,
  );

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
        next: (items) => this.items.set(items),
        error: () => this.loadError.set(true),
      });
  }

  protected selectField(field: string): void {
    if (!this.fields.some((option) => option === field)) return;
    this.field.set(field as Field);
    this.resetForm();
  }

  protected selectBrand(id: string): void {
    this.brandId.set(id);
    this.resetForm();
  }

  protected add(): void {
    const name = this.name().trim();
    if (!name || this.disabled() || !this.canAdd()) return;
    const key = (value: string) => value.replace(/\s+/g, ' ').trim().toLocaleLowerCase();
    if (this.options().some((option) => key(name) === key(option.name))) {
      this.saved.set(false);
      this.saveError.set('duplicate');
      return;
    }
    this.mutate(
      this.optionsService.publish(
        this.field(),
        name,
        this.field() === 'foodDetail' ? this.brandId() : undefined,
      ),
    );
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

  private change(option: ManagedOption, change: { name: string } | { active: boolean }): void {
    this.mutate(this.http.patch(`${this.endpoint}/${option.field}/${option.id}`, change));
  }

  private mutate(request: Observable<unknown>): void {
    this.saving.set(true);
    this.saved.set(false);
    this.saveError.set(null);
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
        error: (error: HttpErrorResponse) =>
          this.saveError.set(error.status === 409 ? 'duplicate' : 'saveError'),
      });
  }

  private resetForm(): void {
    this.name.set('');
    this.cancelRename();
    this.saveError.set(null);
    this.saved.set(false);
  }
}
