import { Component, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatCheckbox } from '@angular/material/checkbox';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { I18nService } from '../../../../core/i18n/i18n.service';

export function parseBirthYear(value: string): number | null {
  const year = Number(value);
  return /^\d{4}$/.test(value) && year >= 1000 && year <= new Date().getFullYear() ? year : null;
}

@Component({
  selector: 'app-cat-birth-field',
  imports: [FormsModule, MatCheckbox, MatError, MatFormField, MatInput, MatLabel],
  templateUrl: './cat-birth-field.html',
  styles: [
    `
      :host {
        display: grid;
        grid-template-columns: minmax(0, 1fr) auto;
        align-items: start;
        min-width: 0;
        gap: 0.25rem;
      }

      mat-form-field {
        min-width: 0;
      }

      mat-checkbox {
        max-width: 8rem;
        align-self: start;
        margin-block-start: 0.35rem;
      }
    `,
  ],
})
export class CatBirthField {
  readonly text = inject(I18nService).text;
  readonly birthDate = model.required<string>();
  readonly birthYear = model.required<string>();
  readonly yearOnly = model.required<boolean>();
  readonly error = model<string | null>(null);
  readonly disabled = input(false);
  readonly errorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => this.error() !== null,
  };

  changePrecision(yearOnly: boolean): void {
    if (yearOnly && !this.birthYear() && this.birthDate()) {
      this.birthYear.set(this.birthDate().slice(0, 4));
    }
    this.yearOnly.set(yearOnly);
    this.error.set(null);
  }
}
