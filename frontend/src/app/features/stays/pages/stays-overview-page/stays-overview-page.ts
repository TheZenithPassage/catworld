import { Component, inject, signal } from '@angular/core';

import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';

@Component({
  selector: 'app-stays-overview-page',
  imports: [],
  templateUrl: './stays-overview-page.html',
  styleUrl: './stays-overview-page.scss'
})
export class StaysOverviewPage {
  private readonly stayApiService = inject(StayApiService);

  readonly stays = signal<Stay[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.loadStays();
  }

  loadStays(): void {
    this.loading.set(true);
    this.error.set(null);

    this.stayApiService.getStays().subscribe({
      next: (stays) => {
        this.stays.set(stays);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudieron cargar las estancias.');
        this.loading.set(false);
      }
    });
  }

  getStayStatus(stay: Stay): string {
    if (stay.cancelledAt) {
      return 'Cancelada';
    }

    const now = new Date();
    const startAt = new Date(stay.startAt);
    const endAt = new Date(stay.endAt);

    if (endAt <= now) {
      return 'Finalizada';
    }

    if (startAt <= now && endAt > now) {
      return 'En curso';
    }

    return 'Próxima';
  }

  formatDate(value: string | null): string {
    if (!value) {
      return '-';
    }

    return new Intl.DateTimeFormat('es-ES', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(value));
  }

  getCatSummary(stay: Stay): string {
    return stay.catIds.length === 1 ? '1 gato' : `${stay.catIds.length} gatos`;
  }

  getCatIdsSummary(stay: Stay): string {
    return stay.catIds
      .map((catId) => catId.slice(0, 8))
      .join(', ');
  }

}