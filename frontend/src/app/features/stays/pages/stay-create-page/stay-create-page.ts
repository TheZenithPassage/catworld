import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Cat } from '../../../cats/models/cat.model';
import { CatApiService } from '../../../cats/services/cat-api.service';
import { Owner } from '../../../owners/models/owner.model';
import { OwnerApiService } from '../../../owners/services/owner-api.service';
import { CreateStayRequest } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { HttpErrorResponse } from '@angular/common/http';
import { I18nService } from '../../../../core/i18n/i18n.service';

@Component({
  selector: 'app-stay-create-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './stay-create-page.html',
  styleUrl: './stay-create-page.scss',
})
export class StayCreatePage {
  private readonly ownerApiService = inject(OwnerApiService);
  private readonly catApiService = inject(CatApiService);
  private readonly stayApiService = inject(StayApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18nService = inject(I18nService);

  readonly text = this.i18nService.text;

  readonly owners = signal<Owner[]>([]);
  readonly cats = signal<Cat[]>([]);

  readonly selectedOwnerId = signal('');
  readonly selectedCatIds = signal<string[]>([]);

  readonly startAt = signal(this.getDefaultDateTimeLocalValue(0));
  readonly endAt = signal(this.getDefaultDateTimeLocalValue(7));
  readonly notes = signal('');

  readonly loadingData = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  readonly filteredCats = computed(() =>
    this.cats().filter((cat) => cat.ownerId === this.selectedOwnerId()),
  );

  constructor() {
    this.loadData();
  }

  loadData(): void {
    this.loadingData.set(true);
    this.error.set(null);

    forkJoin({
      owners: this.ownerApiService.getOwners(),
      cats: this.catApiService.getCats(),
    }).subscribe({
      next: ({ owners, cats }) => {
        this.owners.set(owners);
        this.cats.set(cats);
        this.setInitialSelectionFromQueryParams();
        this.loadingData.set(false);
      },
      error: () => {
        this.error.set(this.text().stays.create.errors.loadFormDataFailed);
        this.loadingData.set(false);
      },
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

    this.selectedCatIds.update((catIds) => catIds.filter((currentCatId) => currentCatId !== catId));
  }

  isCatSelected(catId: string): boolean {
    return this.selectedCatIds().includes(catId);
  }

  submit(): void {
    this.error.set(null);

    if (this.selectedCatIds().length === 0) {
      this.error.set(this.text().stays.create.errors.selectAtLeastOneCat);
      return;
    }

    if (!this.startAt() || !this.endAt()) {
      this.error.set(this.text().stays.create.errors.datesRequired);
      return;
    }

    if (new Date(this.endAt()) <= new Date(this.startAt())) {
      this.error.set(this.text().stays.create.errors.endAfterStart);
      return;
    }

    const request: CreateStayRequest = {
      catIds: this.selectedCatIds(),
      startAt: this.startAt(),
      endAt: this.endAt(),
      notes: this.notes().trim() || null,
    };

    this.submitting.set(true);

    this.stayApiService.createStay(request).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/stays']);
      },
      error: (error: unknown) => {
        this.error.set(this.getCreateStayErrorMessage(error));
        this.submitting.set(false);
      },
    });
  }

  private setInitialSelectionFromQueryParams(): void {
    const queryOwnerId = this.route.snapshot.queryParamMap.get('ownerId');
    const queryCatId = this.route.snapshot.queryParamMap.get('catId');

    if (!queryOwnerId) {
      return;
    }

    const ownerExists = this.owners().some((owner) => owner.id === queryOwnerId);

    if (!ownerExists) {
      return;
    }

    this.selectedOwnerId.set(queryOwnerId);

    if (!queryCatId) {
      return;
    }

    const catExistsForOwner = this.cats().some(
      (cat) => cat.id === queryCatId && cat.ownerId === queryOwnerId,
    );

    if (catExistsForOwner) {
      this.selectedCatIds.set([queryCatId]);
    }
  }

  private getCreateStayErrorMessage(error: unknown): string {
    const fallbackMessage = this.text().stays.create.errors.createFailed;

    if (!(error instanceof HttpErrorResponse)) {
      return fallbackMessage;
    }

    const responseBody: unknown = error.error;

    if (!responseBody) {
      return fallbackMessage;
    }

    if (typeof responseBody === 'string') {
      return responseBody.trim() || fallbackMessage;
    }

    if (this.isValidationErrorMap(responseBody)) {
      const messages = Object.entries(responseBody).map(
        ([field, message]) => `${field}: ${message}`,
      );

      return messages.length > 0 ? messages.join('. ') : fallbackMessage;
    }

    return fallbackMessage;
  }

  private isValidationErrorMap(value: unknown): value is Record<string, string> {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      Object.values(value).every((message) => typeof message === 'string')
    );
  }

  private getDefaultDateTimeLocalValue(daysToAdd: number): string {
    const date = new Date();

    date.setDate(date.getDate() + daysToAdd);
    date.setHours(10, 0, 0, 0);

    return this.toDateTimeLocalValue(date);
  }

  private toDateTimeLocalValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }
}
