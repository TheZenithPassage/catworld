import { Component, inject, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteTrigger, MatOption } from '@angular/material/autocomplete';
import { MatFormField, MatHint, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { catLitterLabel } from '../../utils/cat-litter-label';
import { CATWORLD_LITTER, OWN_LITTER } from '../../models/cat.model';

@Component({
  selector: 'app-cat-care-fields',
  imports: [
    FormsModule,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    MatFormField,
    MatHint,
    MatInput,
    MatLabel,
  ],
  templateUrl: './cat-care-fields.html',
  styles: [
    `
      :host {
        display: contents;
      }
      mat-form-field {
        width: 100%;
        min-width: 0;
      }
    `,
  ],
})
export class CatCareFields {
  readonly text = inject(I18nService).text;
  readonly sharedLitter = CATWORLD_LITTER;
  readonly ownLitter = OWN_LITTER;
  readonly foodDetail = model.required<string>();
  readonly litterBrand = model.required<string>();
  readonly displayLitter = (value: string): string => catLitterLabel(value, this.text().cats.form);
}
