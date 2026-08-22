import { Component, inject, input, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { formatLocalDate } from '../../../../shared/date/local-date-format';
import { Cat } from '../../models/cat.model';
import { CatApiService } from '../../services/cat-api.service';
import { CatEditor } from '../cat-editor/cat-editor';
@Component({
  selector: 'app-cat-detail',
  imports: [MatButton, UiStateComponent, CatEditor],
  templateUrl: './cat-detail.html',
  styleUrl: '../../../../shared/entity-detail/entity-detail-presenter.scss',
})
export class CatDetail {
  private readonly api = inject(CatApiService);
  private readonly i18n = inject(I18nService);
  readonly entityId = input.required<string>();
  readonly text = this.i18n.text;
  readonly dateLocale = this.i18n.dateLocale;
  readonly cat = signal<Cat | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly editing = signal(false);
  constructor() {
    queueMicrotask(() => this.load());
  }
  load(): void {
    this.loading.set(true);
    this.error.set(false);
    this.api.getCatById(this.entityId()).subscribe({
      next: (c) => {
        this.cat.set(c);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(true);
        this.loading.set(false);
      },
    });
  }
  saved(c: Cat): void {
    this.cat.set(c);
    this.editing.set(false);
  }
  value(v: string | null): string {
    return v || this.text().cats.emptyValue;
  }
  date(v: string | null): string {
    return v ? formatLocalDate(v, this.dateLocale()) : this.text().cats.emptyValue;
  }
}
