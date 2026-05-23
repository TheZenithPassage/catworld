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
        this.error.set('Error loading stays');
        this.loading.set(false);
      }
    });
  }

  getStayStatus(stay: Stay): string {
    if (stay.cancelledAt) {
      return 'Cancelled';
    }

    const now = new Date();
    const startAt = new Date(stay.startAt);
    const endAt = new Date(stay.endAt);

    if (endAt <= now) {
      return 'Checked-out';
    }

    if (startAt <= now && endAt > now) {
      return 'Checked-in';
    }

    return 'Reserved';
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
    return stay.cats.length === 1 ? '1 cat' : `${stay.cats.length} cats`;
  }

  getCatNames(stay: Stay): string {
    return stay.cats
      .map((cat) => cat.name)
      .join(', ');
  }

}