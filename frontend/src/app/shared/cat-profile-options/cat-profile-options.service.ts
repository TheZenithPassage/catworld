import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { API_BASE_URL } from '../../core/config/api.config';

export type CatProfileOptionFieldKey =
  | 'breed'
  | 'coat'
  | 'color'
  | 'foodBrand'
  | 'lastInternalDewormerName'
  | 'lastExternalDewormerName';

export interface CatProfileOption {
  id: string;
  name: string;
}

export type CatProfileOptions = Record<CatProfileOptionFieldKey, CatProfileOption[]>;

@Injectable({ providedIn: 'root' })
export class CatProfileOptionsService {
  private readonly http = inject(HttpClient);
  private readonly options = signal<CatProfileOptions | null>(null);
  private loading = false;

  readonly catalog = this.options.asReadonly();

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
