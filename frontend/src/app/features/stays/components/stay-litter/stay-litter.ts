import { Component, computed, inject, input, output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { I18nService } from '../../../../core/i18n/i18n.service';
import {
  StayCatSummary,
  StayLitterBreakdown,
  StayLitterChoice,
  StayLitterChoices,
} from '../../models/stay.model';

@Component({
  selector: 'app-stay-litter',
  imports: [FormsModule, MatFormField, MatInput, MatLabel],
  templateUrl: './stay-litter.html',
  styleUrl: './stay-litter.scss',
})
export class StayLitter {
  private readonly i18n = inject(I18nService);
  readonly copy = computed(() => this.i18n.text().stays.pricing.litter);
  readonly unavailable = computed(() => this.i18n.text().stays.pricing.unavailable);
  readonly litter = input.required<StayLitterBreakdown>();
  readonly cats = input.required<StayCatSummary[]>();
  readonly editable = input(false);
  readonly disabled = input(false);
  readonly updating = input(false);
  readonly choices = input<StayLitterChoices>({});
  readonly choiceChange = output<{ catId: string; choice: StayLitterChoice }>();
  readonly options = ['OWN', 'HALF', 'ONE'] as const;
  readonly rows = computed(() => {
    const records = new Map(this.litter().cats.map((cat) => [cat.catId, cat]));
    return this.cats().flatMap(({ catId, name }) => {
      const record = records.get(catId);
      return record ? [{ ...record, name }] : [];
    });
  });

  format(value: string): string {
    return this.i18n.language() === 'es' ? value.replace('.', ',') : value;
  }
}
