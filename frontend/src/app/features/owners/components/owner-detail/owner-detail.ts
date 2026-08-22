import { Component, inject, input, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { Owner } from '../../models/owner.model';
import { OwnerApiService } from '../../services/owner-api.service';
import { OwnerEditor } from '../owner-editor/owner-editor';
@Component({
  selector: 'app-owner-detail',
  imports: [MatButton, UiStateComponent, OwnerEditor],
  template: `@if (loading()) {
      <app-ui-state kind="loading" [message]="text().owners.detail.loading" />
    } @else if (error()) {
      <app-ui-state
        kind="error"
        [message]="text().owners.detail.loadFailed"
        [actionLabel]="text().owners.detail.retry"
        (actionTriggered)="load()"
      />
    } @else if (owner(); as owner) {
      @if (editing()) {
        <app-owner-editor
          [entityId]="entityId()"
          [entity]="owner"
          (saved)="saved($event)"
          (cancelled)="editing.set(false)"
        />
      } @else {
        <dl>
          <dt>{{ text().owners.form.fullName }}</dt>
          <dd>{{ owner.fullName }}</dd>
          <dt>{{ text().owners.form.primaryPhone }}</dt>
          <dd>{{ owner.primaryPhone }}</dd>
          <dt>{{ text().owners.form.address }}</dt>
          <dd>{{ value(owner.address) }}</dd>
          <dt>{{ text().owners.form.secondaryPhone }}</dt>
          <dd>{{ value(owner.secondaryPhone) }}</dd>
          <dt>{{ text().owners.form.secondaryPhoneName }}</dt>
          <dd>{{ value(owner.secondaryPhoneName) }}</dd>
          <dt>{{ text().owners.form.instagram }}</dt>
          <dd>{{ value(owner.instagram) }}</dd>
          <dt>{{ text().owners.form.facebook }}</dt>
          <dd>{{ value(owner.facebook) }}</dd>
        </dl>
        <button mat-flat-button type="button" (click)="editing.set(true)">
          {{ text().owners.detail.edit }}
        </button>
      }
    }`,
  styleUrl: '../../../../shared/entity-detail/entity-detail-presenter.scss',
})
export class OwnerDetail {
  private readonly api = inject(OwnerApiService);
  private readonly i18n = inject(I18nService);
  readonly entityId = input.required<string>();
  readonly text = this.i18n.text;
  readonly owner = signal<Owner | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly editing = signal(false);
  constructor() {
    queueMicrotask(() => this.load());
  }
  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api.getOwnerById(this.entityId()).subscribe({
      next: (o) => {
        this.owner.set(o);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
  saved(o: Owner): void {
    this.owner.set(o);
    this.editing.set(false);
  }
  value(v: string | null): string {
    return v || this.text().owners.emptyValue;
  }
}
