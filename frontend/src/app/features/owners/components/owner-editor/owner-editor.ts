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
import { Owner, UpdateOwnerRequest } from '../../models/owner.model';
import { OwnerApiService } from '../../services/owner-api.service';

@Component({
  selector: 'app-owner-editor',
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
  templateUrl: '../../pages/owner-edit-page/owner-edit-page.html',
  styleUrl: '../../pages/owner-edit-page/owner-edit-page.scss',
})
export class OwnerEditor {
  private readonly api = inject(OwnerApiService);
  private readonly i18n = inject(I18nService);
  readonly entityId = input.required<string>();
  readonly entity = input<Owner | null>(null);
  readonly routed = input(false);
  readonly saved = output<Owner>();
  readonly cancelled = output<void>();
  readonly text = this.i18n.text;
  readonly fullName = signal('');
  readonly address = signal('');
  readonly primaryPhone = signal('');
  readonly secondaryPhone = signal('');
  readonly secondaryPhoneName = signal('');
  readonly instagram = signal('');
  readonly facebook = signal('');
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly error = createLanguageResetError(this.i18n.language);
  readonly ownerLoaded = signal(false);
  readonly fullNameError = createLanguageResetError(this.i18n.language);
  readonly primaryPhoneError = createLanguageResetError(this.i18n.language);
  constructor() {
    effect(() => {
      const entity = this.entity();
      entity ? this.setValues(entity) : this.loadOwner();
    });
  }
  loadOwner(): void {
    this.error.set(null);
    this.ownerLoaded.set(false);
    if (!this.entityId()) {
      this.error.set(this.text().owners.edit.errors.ownerIdMissing);
      return;
    }
    this.loading.set(true);
    this.api.getOwnerById(this.entityId()).subscribe({
      next: (o) => {
        this.setValues(o);
        this.loading.set(false);
      },
      error: (e) => {
        this.error.set(this.apiMessage(e, this.text().owners.edit.errors.loadFailed));
        this.loading.set(false);
      },
    });
  }
  submit(): void {
    this.error.set(null);
    this.fullNameError.set(null);
    this.primaryPhoneError.set(null);
    if (!this.entityId()) {
      this.error.set(this.text().owners.edit.errors.ownerIdMissing);
      return;
    }
    if (!this.fullName().trim()) {
      this.fullNameError.set(this.text().owners.edit.errors.fullNameRequired);
      return;
    }
    if (!this.primaryPhone().trim()) {
      this.primaryPhoneError.set(this.text().owners.edit.errors.primaryPhoneRequired);
      return;
    }
    const request: UpdateOwnerRequest = {
      fullName: this.fullName().trim(),
      address: this.optional(this.address()),
      primaryPhone: this.primaryPhone().trim(),
      secondaryPhone: this.optional(this.secondaryPhone()),
      secondaryPhoneName: this.optional(this.secondaryPhoneName()),
      instagram: this.optional(this.instagram()),
      facebook: this.optional(this.facebook()),
    };
    this.submitting.set(true);
    this.api.updateOwner(this.entityId(), request).subscribe({
      next: (o) => {
        this.submitting.set(false);
        this.saved.emit(o);
      },
      error: (e) => {
        this.error.set(this.apiMessage(e, this.text().owners.edit.errors.updateFailed));
        this.submitting.set(false);
      },
    });
  }
  private setValues(o: Owner): void {
    this.fullName.set(o.fullName);
    this.address.set(o.address ?? '');
    this.primaryPhone.set(o.primaryPhone);
    this.secondaryPhone.set(o.secondaryPhone ?? '');
    this.secondaryPhoneName.set(o.secondaryPhoneName ?? '');
    this.instagram.set(o.instagram ?? '');
    this.facebook.set(o.facebook ?? '');
    this.ownerLoaded.set(true);
  }
  private optional(v: string): string | null {
    return v.trim() || null;
  }
  private apiMessage(e: unknown, fallback: string): string {
    if (!(e instanceof HttpErrorResponse)) return fallback;
    const b: unknown = e.error;
    if (this.isValidationMap(b)) {
      const messages = Object.keys(b).flatMap((field) =>
        field === 'fullName'
          ? [this.text().owners.edit.errors.fullNameRequired]
          : field === 'primaryPhone'
            ? [this.text().owners.edit.errors.primaryPhoneRequired]
            : [],
      );
      return [...new Set(messages)].join('. ') || fallback;
    }
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
