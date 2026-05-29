import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Owner } from '../../models/owner.model';
import { OwnerApiService } from '../../services/owner-api.service';

@Component({
  selector: 'app-owners-overview-page',
  imports: [RouterLink],
  templateUrl: './owners-overview-page.html',
  styleUrl: './owners-overview-page.scss'
})
export class OwnersOverviewPage {
  private readonly ownerApiService = inject(OwnerApiService);

  readonly owners = signal<Owner[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.loadOwners();
  }

  loadOwners(): void {
    this.loading.set(true);
    this.error.set(null);

    this.ownerApiService.getOwners().subscribe({
      next: (owners) => {
        this.owners.set(owners);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Error loading owners');
        this.loading.set(false);
      }
    });
  }

  formatOptionalValue(value: string | null): string {
    return value || '-';
  }

  getSecondaryPhone(owner: Owner): string {
    if (!owner.secondaryPhone) {
      return '-';
    }

    if (!owner.secondaryPhoneName) {
      return owner.secondaryPhone;
    }

    return `${owner.secondaryPhone} (${owner.secondaryPhoneName})`;
  }
}