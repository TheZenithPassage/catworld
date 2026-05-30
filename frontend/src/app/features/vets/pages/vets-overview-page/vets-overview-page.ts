import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Vet } from '../../models/vet.model';
import { VetApiService } from '../../services/vet-api.service';

@Component({
  selector: 'app-vets-overview-page',
  imports: [RouterLink],
  templateUrl: './vets-overview-page.html',
  styleUrl: './vets-overview-page.scss'
})
export class VetsOverviewPage {
  private readonly vetApiService = inject(VetApiService);

  readonly vets = signal<Vet[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.loadVets();
  }

  loadVets(): void {
    this.loading.set(true);
    this.error.set(null);

    this.vetApiService.getVets().subscribe({
      next: (vets) => {
        this.vets.set(vets);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error loading vets');
        this.loading.set(false);
      }
    });
  }

  formatOptionalValue(value: string | null): string {
    return value || '-';
  }
}