import { Component, computed, DestroyRef, inject, input, model, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteTrigger, MatOption } from '@angular/material/autocomplete';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatFormField, MatHint, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { finalize } from 'rxjs';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { I18nService } from '../../core/i18n/i18n.service';
import {
  CatProfileOption,
  CatProfileOptionFieldKey,
  CatProfileOptionsService,
} from './cat-profile-options.service';

@Component({
  selector: 'app-cat-profile-option-field',
  imports: [
    FormsModule,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    MatButton,
    MatIconButton,
    MatFormField,
    MatHint,
    MatInput,
    MatLabel,
    MatSuffix,
  ],
  templateUrl: './cat-profile-option-field.html',
  styleUrl: './cat-profile-option-field.scss',
})
export class CatProfileOptionField {
  private readonly options = inject(CatProfileOptionsService);
  private readonly auth = inject(AuthSessionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly text = inject(I18nService).text;
  readonly field = input.required<CatProfileOptionFieldKey | 'foodDetail'>();
  readonly label = input.required<string>();
  readonly controlName = input<string>();
  readonly disabled = input(false);
  readonly allowApproval = input(true);
  readonly showPublicationHint = input(false);
  readonly brandId = input<string>();
  readonly brandName = input('');
  readonly value = model.required<string>();
  readonly optionId = model<string>();
  readonly focused = signal(false);
  readonly publishing = signal(false);
  readonly publicationStatus = signal('');
  readonly publicationFailed = signal(false);

  private readonly entries = computed(() => {
    const field = this.field();
    if (field !== 'foodDetail') return this.options.catalog()?.[field] ?? null;
    const brandId = this.brandId();
    return brandId
      ? (this.options.varieties()?.filter((option) => option.brandId === brandId) ?? null)
      : [];
  });
  private readonly search = computed(() => optionKey(this.value()));
  readonly suggestions = computed(() =>
    (this.entries() ?? []).filter(({ name }) => optionKey(name).includes(this.search())),
  );
  readonly example = computed(() => {
    const field = this.field();
    return this.focused() &&
      !this.value() &&
      (field === 'breed' || field === 'foodBrand' || field === 'foodDetail')
      ? this.text().cats.form.catalogExamples[field]
      : '';
  });
  readonly catalogName = computed(() => {
    const field = this.field();
    if (field === 'coat' || field === 'color') return '';
    const copy = this.text().cats.form;
    return field === 'foodDetail'
      ? copy.varietyCatalog(this.brandName())
      : copy.catalogNames[field];
  });
  readonly canPublish = computed(
    () =>
      !this.disabled() &&
      this.auth.hasRole('ADMIN') &&
      !!this.catalogName() &&
      !!this.search() &&
      !this.optionId() &&
      (this.field() !== 'foodDetail' || !!this.brandId()) &&
      this.entries()?.every(({ name }) => optionKey(name) !== this.search()) === true,
  );

  readonly displayName = (value: string | CatProfileOption | null): string =>
    typeof value === 'string' ? value : (value?.name ?? '');

  loadOptions(): void {
    if (this.field() === 'foodDetail') {
      if (this.brandId()) this.options.loadVarieties();
    } else {
      this.options.load();
    }
  }

  changeValue(value: string | CatProfileOption): void {
    if (typeof value !== 'string' || value === this.value()) return;
    this.value.set(value);
    this.optionId.set(undefined);
    this.publicationStatus.set('');
  }

  clear(input: HTMLInputElement): void {
    this.changeValue('');
    input.focus();
  }

  select(option: CatProfileOption): void {
    this.value.set(option.name);
    this.optionId.set(option.id);
    this.publicationStatus.set('');
  }

  publish(): void {
    if (!this.allowApproval() || !this.canPublish() || this.publishing()) return;
    const catalog = this.catalogName();
    this.publishing.set(true);
    this.publicationStatus.set('');
    this.options
      .publish(this.field(), this.value(), this.brandId())
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.publishing.set(false)),
      )
      .subscribe({
        next: (option) => {
          this.select(option);
          this.publicationFailed.set(false);
          this.publicationStatus.set(this.text().cats.form.publishedOption(option.name, catalog));
          this.loadOptions();
        },
        error: () => {
          this.publicationFailed.set(true);
          this.publicationStatus.set(this.text().cats.form.publishOptionError);
        },
      });
  }
}

function optionKey(value: string): string {
  return value
    .replace(/[\t-\r\u0085\p{Z}]+/gu, ' ')
    .replace(/^ | $/g, '')
    .toLowerCase();
}
