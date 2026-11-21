import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';

export type CatProfileOptionFieldKey =
  | 'breed'
  | 'coat'
  | 'color'
  | 'foodBrand'
  | 'litterDetail'
  | 'lastInternalDewormerName'
  | 'lastExternalDewormerName';

export interface CatProfileOption {
  id: string;
  name: string;
}

export interface FoodVarietyOption extends CatProfileOption {
  brandId: string;
}

export type CatProfileOptions = Record<
  Exclude<CatProfileOptionFieldKey, 'litterDetail'>,
  CatProfileOption[]
> & {
  litterDetail?: CatProfileOption[];
};

@Injectable({ providedIn: 'root' })
export class CatProfileOptionsService {
  private readonly http = inject(HttpClient);
  private readonly options = signal<CatProfileOptions | null>(null);
  private loading = false;
  private readonly foodVarieties = signal<FoodVarietyOption[] | null>(null);
  private loadingVarieties = false;

  readonly catalog = this.options.asReadonly();
  readonly varieties = this.foodVarieties.asReadonly();

  loadVarieties(): void {
    if (this.loadingVarieties) return;
    this.loadingVarieties = true;
    this.http
      .get<FoodVarietyOption[]>(`${API_BASE_URL}/food-brands/varieties`)
      .pipe(finalize(() => (this.loadingVarieties = false)))
      .subscribe({
        next: (varieties) => this.foodVarieties.set(varieties),
        error: () => {
          // The form remains usable with local values when the catalog is unavailable.
        },
      });
  }

  publish(field: CatProfileOptionFieldKey | 'foodDetail', name: string, brandId?: string) {
    return this.http.post<CatProfileOption>(`${API_BASE_URL}/cat-profile-options`, {
      field,
      name,
      brandId,
    });
  }

  load(): void {
    if (this.loading) return;
    this.loading = true;

    this.http
      .get<CatProfileOptions>(`${API_BASE_URL}/cat-profile-options`)
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (options) => this.options.set(options),
        error: () => {
          // The form remains usable with local values when the catalog is unavailable.
        },
      });
  }
}
