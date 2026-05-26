import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Cat } from '../../../cats/models/cat.model';
import { CatApiService } from '../../../cats/services/cat-api.service';
import { Owner } from '../../../owners/models/owner.model';
import { OwnerApiService } from '../../../owners/services/owner-api.service';
import { CreateStayRequest } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';

@Component({
  selector: 'app-stay-create-page',
  imports: [FormsModule],
  templateUrl: './stay-create-page.html',
  styleUrl: './stay-create-page.scss'
})
export class StayCreatePage {
  private readonly ownerApiService = inject(OwnerApiService);
  private readonly catApiService = inject(CatApiService);
  private readonly stayApiService = inject(StayApiService);
  private readonly router = inject(Router);

  readonly owners = signal<Owner[]>([]);
  readonly cats = signal<Cat[]>([]);

  readonly selectedOwnerId = signal('');
  readonly selectedCatIds = signal<string[]>([]);

  readonly startAt = signal('');
  readonly endAt = signal('');
  readonly notes = signal('');

  readonly loadingData = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly filteredCats = computed(() =>
    this.cats().filter((cat) => cat.ownerId === this.selectedOwnerId())
  );

  constructor() {
    this.loadData();
  }

  loadData(): void {
    this.loadingData.set(true);
    this.error.set(null);

    forkJoin({
      owners: this.ownerApiService.getOwners(),
      cats: this.catApiService.getCats()
    }).subscribe({
      next: ({ owners, cats }) => {
        this.owners.set(owners);
        this.cats.set(cats);
        this.loadingData.set(false);
      },
      error: () => {
        this.error.set('Error loading form data');
        this.loadingData.set(false);
      }
    });
  }

  onOwnerChange(ownerId: string): void {
    this.selectedOwnerId.set(ownerId);
    this.selectedCatIds.set([]);
  }

  onCatToggle(catId: string, checked: boolean): void {
    if (checked) {
      this.selectedCatIds.update((catIds) => [...catIds, catId]);
      return;
    }

    this.selectedCatIds.update((catIds) =>
      catIds.filter((currentCatId) => currentCatId !== catId)
    );
  }

  isCatSelected(catId: string): boolean {
    return this.selectedCatIds().includes(catId);
  }

  submit(): void {
    this.error.set(null);

    if (this.selectedCatIds().length === 0) {
      this.error.set('Select at least one cat');
      return;
    }

    if (!this.startAt() || !this.endAt()) {
      this.error.set('Start and end date are required');
      return;
    }

    if (new Date(this.endAt()) <= new Date(this.startAt())) {
      this.error.set('End date must be after start date');
      return;
    }

    const request: CreateStayRequest = {
      catIds: this.selectedCatIds(),
      startAt: this.startAt(),
      endAt: this.endAt(),
      notes: this.notes().trim() || null
    };

    this.submitting.set(true);

    this.stayApiService.createStay(request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/stays']);
      },
      error: () => {
        this.error.set('Error creating stay');
        this.submitting.set(false);
      }
    });
  }
}