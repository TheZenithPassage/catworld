import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';

import { Owner } from '../../../owners/models/owner.model';
import { OwnerApiService } from '../../../owners/services/owner-api.service';
import { CreateCatRequest, Sex } from '../../models/cat.model';
import { CatApiService } from '../../services/cat-api.service';
import { Vet } from '../../../vets/models/vet.model';
import { VetApiService } from '../../../vets/services/vet-api.service';
import { I18nService } from '../../../../core/i18n/i18n.service';

@Component({
  selector: 'app-cat-create-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './cat-create-page.html',
  styleUrl: './cat-create-page.scss',
})
export class CatCreatePage {
  private readonly catApiService = inject(CatApiService);
  private readonly ownerApiService = inject(OwnerApiService);
  private readonly vetApiService = inject(VetApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18nService = inject(I18nService);

  readonly text = this.i18nService.text;

  readonly owners = signal<Owner[]>([]);
  readonly vets = signal<Vet[]>([]);

  readonly name = signal('');
  readonly birthDate = signal('');
  readonly sex = signal<Sex | ''>('');
  readonly ownerId = signal('');
  readonly vetId = signal('');

  readonly breed = signal('');
  readonly coat = signal('');
  readonly color = signal('');
  readonly foodBrand = signal('');
  readonly litterBrand = signal('');
  readonly personality = signal('');
  readonly lastInternalDewormerName = signal('');
  readonly lastInternalDewormingDate = signal('');
  readonly lastExternalDewormerName = signal('');
  readonly lastExternalDewormingDate = signal('');
  readonly lastTripleFelineDate = signal('');
  readonly lastRabiesDate = signal('');

  readonly loadingData = signal(false);
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  constructor() {
    this.loadData();
  }

  loadData(): void {
    this.loadingData.set(true);
    this.error.set(null);

    forkJoin({
      owners: this.ownerApiService.getOwners(),
      vets: this.vetApiService.getVets(),
    }).subscribe({
      next: ({ owners, vets }) => {
        this.owners.set(owners);
        this.vets.set(vets);
        this.setInitialOwnerFromQueryParams();
        this.setInitialVetFromQueryParams();
        this.loadingData.set(false);
      },
      error: () => {
        this.error.set(this.text().cats.create.errors.loadFormDataFailed);
        this.loadingData.set(false);
      },
    });
  }

  submit(): void {
    this.error.set(null);

    if (!this.name().trim()) {
      this.error.set(this.text().cats.create.errors.nameRequired);
      return;
    }

    if (!this.birthDate()) {
      this.error.set(this.text().cats.create.errors.birthDateRequired);
      return;
    }

    if (!this.sex()) {
      this.error.set(this.text().cats.create.errors.sexRequired);
      return;
    }

    if (!this.ownerId()) {
      this.error.set(this.text().cats.create.errors.ownerRequired);
      return;
    }

    const request: CreateCatRequest = {
      name: this.name().trim(),
      birthDate: this.birthDate(),
      sex: this.sex() as Sex,
      breed: this.toNullableString(this.breed()),
      coat: this.toNullableString(this.coat()),
      color: this.toNullableString(this.color()),
      foodBrand: this.toNullableString(this.foodBrand()),
      litterBrand: this.toNullableString(this.litterBrand()),
      personality: this.toNullableString(this.personality()),
      lastInternalDewormerName: this.toNullableString(this.lastInternalDewormerName()),
      lastInternalDewormingDate: this.toNullableString(this.lastInternalDewormingDate()),
      lastExternalDewormerName: this.toNullableString(this.lastExternalDewormerName()),
      lastExternalDewormingDate: this.toNullableString(this.lastExternalDewormingDate()),
      lastTripleFelineDate: this.toNullableString(this.lastTripleFelineDate()),
      lastRabiesDate: this.toNullableString(this.lastRabiesDate()),
      ownerId: this.ownerId(),
      vetId: this.toNullableString(this.vetId()),
    };

    this.submitting.set(true);

    this.catApiService.createCat(request).subscribe({
      next: (cat) => {
        this.submitting.set(false);
        this.navigateAfterSuccess(cat.id, cat.ownerId);
      },
      error: (error: unknown) => {
        this.error.set(this.getApiErrorMessage(error, this.text().cats.create.errors.createFailed));
        this.submitting.set(false);
      },
    });
  }

  getCreateVetQueryParams(): Record<string, string> {
    const queryParams: Record<string, string> = {
      returnTo: '/cats/new',
    };

    const currentOwnerId = this.ownerId() || this.route.snapshot.queryParamMap.get('ownerId');
    const currentReturnTo = this.route.snapshot.queryParamMap.get('returnTo');

    if (currentOwnerId) {
      queryParams['ownerId'] = currentOwnerId;
    }

    if (currentReturnTo === '/stays/new') {
      queryParams['catReturnTo'] = currentReturnTo;
    }

    return queryParams;
  }

  getCreateOwnerQueryParams(): Record<string, string> {
    const queryParams: Record<string, string> = {
      returnTo: '/cats/new',
    };

    const currentVetId = this.vetId() || this.route.snapshot.queryParamMap.get('vetId');
    const currentReturnTo = this.route.snapshot.queryParamMap.get('returnTo');

    if (currentVetId) {
      queryParams['vetId'] = currentVetId;
    }

    if (currentReturnTo === '/stays/new') {
      queryParams['catReturnTo'] = currentReturnTo;
    }

    return queryParams;
  }

  private toNullableString(value: string): string | null {
    const trimmedValue = value.trim();

    return trimmedValue || null;
  }

  private navigateAfterSuccess(catId: string, ownerId: string): void {
    const returnTo = this.route.snapshot.queryParamMap.get('returnTo');

    if (returnTo === '/stays/new') {
      this.router.navigate(['/stays/new'], {
        queryParams: { ownerId, catId },
      });
      return;
    }

    this.router.navigate(['/cats']);
  }

  private setInitialOwnerFromQueryParams(): void {
    const queryOwnerId = this.route.snapshot.queryParamMap.get('ownerId');

    if (!queryOwnerId) {
      return;
    }

    const ownerExists = this.owners().some((owner) => owner.id === queryOwnerId);

    if (ownerExists) {
      this.ownerId.set(queryOwnerId);
    }
  }

  private setInitialVetFromQueryParams(): void {
    const queryVetId = this.route.snapshot.queryParamMap.get('vetId');

    if (!queryVetId) {
      return;
    }

    const vetExists = this.vets().some((vet) => vet.id === queryVetId);

    if (vetExists) {
      this.vetId.set(queryVetId);
    }
  }

  private getApiErrorMessage(error: unknown, fallbackMessage: string): string {
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
}
