import { HttpErrorResponse } from '@angular/common/http';
import { Component, effect, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { RouterLink } from '@angular/router';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { TrimRequiredDirective } from '../../../../shared/forms/trim-required.directive';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { UpdateVetRequest, Vet } from '../../models/vet.model';
import { VetApiService } from '../../services/vet-api.service';

@Component({
  selector: 'app-vet-editor',
  imports: [
    FormsModule,
    RouterLink,
    MatButton,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    TrimRequiredDirective,
    UiStateComponent,
  ],
  templateUrl: '../../pages/vet-edit-page/vet-edit-page.html',
  styleUrl: '../../pages/vet-edit-page/vet-edit-page.scss',
})
export class VetEditor {
  private readonly api = inject(VetApiService);
  private readonly i18n = inject(I18nService);
  readonly entityId = input.required<string>();
  readonly entity = input<Vet | null>(null);
  readonly routed = input(false);
  readonly saved = output<Vet>();
  readonly cancelled = output<void>();
  readonly text = this.i18n.text;
  readonly name = signal('');
  readonly address = signal('');
  readonly phoneNumber = signal('');
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly error = createLanguageResetError(this.i18n.language);
  readonly vetLoaded = signal(false);
  readonly nameError = createLanguageResetError(this.i18n.language);
  constructor() {
    effect(() => {
      const entity = this.entity();
      entity ? this.setValues(entity) : this.loadVet();
    });
  }
  loadVet(): void {
    this.error.set(null);
    this.vetLoaded.set(false);
    if (!this.entityId()) {
      this.error.set(this.text().vets.edit.errors.vetIdMissing);
      return;
    }
    this.loading.set(true);
    this.api.getVetById(this.entityId()).subscribe({
      next: (v) => {
        this.setValues(v);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(this.apiMessage(e, this.text().vets.edit.errors.loadFailed));
        this.loading.set(false);
      },
    });
  }
  submit(): void {
    this.error.set(null);
    this.nameError.set(null);
    if (!this.entityId()) {
      this.error.set(this.text().vets.edit.errors.vetIdMissing);
      return;
    }
    if (!this.name().trim()) {
      this.nameError.set(this.text().vets.edit.errors.nameRequired);
      return;
    }
    const request: UpdateVetRequest = {
      name: this.name().trim(),
      address: this.optional(this.address()),
      phoneNumber: this.optional(this.phoneNumber()),
    };
    this.submitting.set(true);
    this.api.updateVet(this.entityId(), request).subscribe({
      next: (v) => {
        this.submitting.set(false);
        this.saved.emit(v);
      },
      error: (e) => {
        this.error.set(this.apiMessage(e, this.text().vets.edit.errors.updateFailed));
        this.submitting.set(false);
      },
    });
  }
  private setValues(v: Vet): void {
    this.name.set(v.name);
    this.address.set(v.address ?? '');
    this.phoneNumber.set(v.phoneNumber ?? '');
    this.vetLoaded.set(true);
  }
  private optional(v: string): string | null {
    return v.trim() || null;
  }
  private apiMessage(e: unknown, fallback: string): string {
    if (!(e instanceof HttpErrorResponse)) return fallback;
    const b: unknown = e.error;
    if (this.isValidationMap(b) && Object.hasOwn(b, 'name'))
      return this.text().vets.edit.errors.nameRequired;
    return fallback;
  }
  private isValidationMap(value: unknown): value is Record<string, string> {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      Object.values(value).every((message) => typeof message === 'string')
    );
  }
}
