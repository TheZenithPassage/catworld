import { Component, inject, input, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { Vet } from '../../models/vet.model';
import { VetApiService } from '../../services/vet-api.service';
import { VetEditor } from '../vet-editor/vet-editor';
@Component({
  selector: 'app-vet-detail',
  imports: [MatButton, UiStateComponent, VetEditor],
  template: `@if (loading()) {
      <app-ui-state kind="loading" [message]="text().vets.detail.loading" />
    } @else if (error()) {
      <app-ui-state
        kind="error"
        [message]="text().vets.detail.loadFailed"
        [actionLabel]="text().vets.detail.retry"
        (actionTriggered)="load()"
      />
    } @else if (vet(); as vet) {
      @if (editing()) {
        <app-vet-editor
          [entityId]="entityId()"
          [entity]="vet"
          (saved)="saved($event)"
          (cancelled)="editing.set(false)"
        />
      } @else {
        <dl>
          <dt>{{ text().vets.form.name }}</dt>
          <dd>{{ vet.name }}</dd>
          <dt>{{ text().vets.form.phoneNumber }}</dt>
          <dd>{{ value(vet.phoneNumber) }}</dd>
          <dt>{{ text().vets.form.address }}</dt>
          <dd>{{ value(vet.address) }}</dd>
        </dl>
        <button mat-flat-button type="button" (click)="editing.set(true)">
          {{ text().vets.detail.edit }}
        </button>
      }
    }`,
  styleUrl: '../../../../shared/entity-detail/entity-detail-presenter.scss',
})
export class VetDetail {
  private readonly api = inject(VetApiService);
  private readonly i18n = inject(I18nService);
  readonly entityId = input.required<string>();
  readonly text = this.i18n.text;
  readonly vet = signal<Vet | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly editing = signal(false);
  constructor() {
    queueMicrotask(() => this.load());
  }
  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api.getVetById(this.entityId()).subscribe({
      next: (v) => {
        this.vet.set(v);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
  saved(v: Vet): void {
    this.vet.set(v);
    this.editing.set(false);
  }
  value(v: string | null): string {
    return v || this.text().vets.emptyValue;
  }
}
