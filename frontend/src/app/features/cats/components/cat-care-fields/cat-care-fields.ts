import { Component, computed, inject, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { catLitterChoice, catOwnLitterDetail } from '../../utils/cat-litter-label';
import { CATWORLD_LITTER, OWN_LITTER } from '../../models/cat.model';

@Component({
  selector: 'app-cat-care-fields',
  imports: [FormsModule, MatFormField, MatInput, MatLabel],
  templateUrl: './cat-care-fields.html',
  styles: [':host { display: contents; }', 'mat-form-field { width: 100%; min-width: 0; }'],
})
export class CatCareFields {
  readonly text = inject(I18nService).text;
  readonly litterBrand = model.required<string>();
  readonly choice = computed(() => catLitterChoice(this.litterBrand()));
  readonly ownDetail = computed(() => catOwnLitterDetail(this.litterBrand()));
  private lastOwnDetail = '';

  changeChoice(choice: 'shared' | 'own' | ''): void {
    if (this.choice() === 'own') this.lastOwnDetail = this.ownDetail();
    if (choice === 'shared') this.litterBrand.set(CATWORLD_LITTER);
    else if (choice === 'own') this.changeOwnDetail(this.lastOwnDetail);
    else this.litterBrand.set('');
  }

  changeOwnDetail(detail: string): void {
    const trimmed = detail.trim();
    this.litterBrand.set(trimmed && trimmed !== CATWORLD_LITTER ? detail : OWN_LITTER);
  }
}
