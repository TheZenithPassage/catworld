import { Component, computed, DestroyRef, inject, model, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatAutocomplete, MatAutocompleteTrigger, MatOption } from '@angular/material/autocomplete';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { CATWORLD_LITTER, FoodBrandOption } from '../../models/cat.model';
import { CatApiService } from '../../services/cat-api.service';

@Component({
  selector: 'app-cat-care-fields',
  imports: [
    FormsModule,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatOption,
    MatCheckbox,
    MatFormField,
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
      .food-brand {
        min-width: 0;
      }
    `,
  ],
})
export class CatCareFields {
  private readonly api = inject(CatApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly auth = inject(AuthSessionService);
  private readonly catalog = signal<FoodBrandOption[] | null>(null);
  private loadingCatalog = false;
  private readonly foodBrandSearch = computed(() => this.brandKey(this.foodBrand()));

  readonly text = inject(I18nService).text;
  readonly sharedLitter = CATWORLD_LITTER;
  readonly foodBrand = model.required<string>();
  readonly foodBrandId = model.required<string | null>();
  readonly approveFoodBrand = model.required<boolean>();
  readonly foodDetail = model.required<string>();
  readonly litterBrand = model.required<string>();
  readonly foodOptions = computed(() =>
    (this.catalog() ?? []).filter(({ name }) =>
      this.brandKey(name).includes(this.foodBrandSearch()),
    ),
  );
  readonly canApproveFoodBrand = computed(() => {
    const key = this.foodBrandSearch();
    return (
      this.auth.hasRole('ADMIN') &&
      !!key &&
      !this.foodBrandId() &&
      this.catalog()?.every(({ name }) => this.brandKey(name) !== key) === true
    );
  });

  loadFoodBrands(): void {
    if (this.catalog() !== null || this.loadingCatalog) return;
    this.loadingCatalog = true;
    this.api
      .getFoodBrands()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (catalog) => {
          this.catalog.set(catalog);
          this.loadingCatalog = false;
        },
        error: () => {
          this.loadingCatalog = false;
        },
      });
  }

  changeFoodBrand(name: string): void {
    this.foodBrand.set(name);
    this.foodBrandId.set(null);
    this.approveFoodBrand.set(false);
  }

  selectFoodBrand(name: string): void {
    const option = this.catalog()?.find((brand) => brand.name === name);
    if (option) this.foodBrandId.set(option.id);
  }

  readonly displayLitter = (value: string): string =>
    value === CATWORLD_LITTER ? this.text().cats.form.sharedLitter : value;

  private brandKey(value: string): string {
    return value.trim().replace(/\s+/g, ' ').toLowerCase();
  }
}
