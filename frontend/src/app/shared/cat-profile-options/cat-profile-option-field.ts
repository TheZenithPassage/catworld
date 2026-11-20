import { Component, computed, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteTrigger, MatOption } from '@angular/material/autocomplete';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { CatProfileOptionFieldKey, CatProfileOptionsService } from './cat-profile-options.service';

@Component({
  selector: 'app-cat-profile-option-field',
  imports: [
    FormsModule,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    MatCheckbox,
    MatFormField,
    MatHint,
    MatInput,
    MatLabel,
  ],
  templateUrl: './cat-profile-option-field.html',
  styles: [
    `
      :host {
        display: block;
        min-width: 0;
      }
      mat-form-field {
        width: 100%;
      }
    `,
  ],
})
export class CatProfileOptionField {
  private readonly options = inject(CatProfileOptionsService);
  private readonly auth = inject(AuthSessionService);

  readonly text = inject(I18nService).text;
  readonly field = input.required<CatProfileOptionFieldKey>();
  readonly label = input.required<string>();
  readonly disabled = input(false);
  readonly allowApproval = input(true);
  readonly showPublicationHint = input(false);
  readonly value = model.required<string>();
  readonly approve = model(false);

  private readonly entries = computed(() => this.options.catalog()?.[this.field()] ?? null);
  private readonly search = computed(() => optionKey(this.value()));
  readonly suggestions = computed(() =>
    (this.entries() ?? []).filter(({ name }) => optionKey(name).includes(this.search())),
  );
  readonly canPublish = computed(
    () =>
      !this.disabled() &&
      this.auth.hasRole('ADMIN') &&
      !!this.search() &&
      this.entries()?.every(({ name }) => optionKey(name) !== this.search()) === true,
  );

  loadOptions(): void {
    this.options.load();
  }

  changeValue(value: string): void {
    if (value === this.value()) return;
    this.value.set(value);
    this.approve.set(false);
  }
}

function optionKey(value: string): string {
  // Match the server's Unicode whitespace policy before comparing a complete name.
  return value
    .replace(/[\t-\r\u0085\p{Z}]+/gu, ' ')
    .replace(/^ | $/g, '')
    .toLowerCase();
}
