import { Component, computed, inject, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { CatProfileOptionField } from '../../../../shared/cat-profile-options/cat-profile-option-field';
import { catLitterChoice, catOwnLitterDetail } from '../../utils/cat-litter-label';
import { CatLitterPreference } from '../../models/cat.model';

@Component({
  selector: 'app-cat-care-fields',
  imports: [FormsModule, MatFormField, MatInput, MatLabel, CatProfileOptionField],
  templateUrl: './cat-care-fields.html',
  styles: [':host { display: contents; }', 'mat-form-field { width: 100%; min-width: 0; }'],
})
export class CatCareFields {
  readonly text = inject(I18nService).text;
  readonly disabled = input(false);
  readonly litterBrand = model.required<string>();
  readonly litterPreference = model<CatLitterPreference | null>();
  readonly litterOptionId = model<string>();
  readonly choice = computed(() => {
    const preference = this.litterPreference();
    return preference === undefined
      ? catLitterChoice(this.litterBrand())
      : (preference?.toLowerCase() ?? '');
  });
  readonly ownDetail = computed(() =>
    this.litterPreference() === 'OWN' ? this.litterBrand() : catOwnLitterDetail(this.litterBrand()),
  );
  private lastOwnDetail = '';
  private lastOwnOption?: string;

  changeChoice(choice: 'shared' | 'own' | ''): void {
    if (choice === this.choice()) return;
    if (this.choice() === 'own') {
      this.lastOwnDetail = this.ownDetail();
      this.lastOwnOption = this.litterOptionId();
    }
    this.litterPreference.set(choice === 'own' ? 'OWN' : choice === 'shared' ? 'SHARED' : null);
    this.litterBrand.set(choice === 'own' ? this.lastOwnDetail : '');
    this.litterOptionId.set(choice === 'own' ? this.lastOwnOption : undefined);
  }

  changeOwnDetail(detail: string): void {
    this.litterPreference.set('OWN');
    this.litterBrand.set(detail);
  }
}
