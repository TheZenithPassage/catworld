import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatIcon } from '@angular/material/icon';
import { MatInput } from '@angular/material/input';
import { MatPaginator, MatPaginatorIntl, PageEvent } from '@angular/material/paginator';
import { Subscription } from 'rxjs';

import { I18nService } from '../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../core/i18n/language-reset-error';
import {
  ENTITY_LOOKUP_PAGE_SIZE,
  EntityLookupAdapter,
  EntityLookupInitialSelection,
  EntityLookupState,
} from './entity-lookup.models';
import { lookupPaginatorIntl } from './lookup-paginator-intl';

@Component({
  selector: 'app-remote-entity-selector',
  imports: [
    MatButton,
    MatFormField,
    MatIcon,
    MatIconButton,
    MatInput,
    MatLabel,
    MatPaginator,
    MatSuffix,
  ],
  providers: [{ provide: MatPaginatorIntl, useFactory: lookupPaginatorIntl }],
  templateUrl: './remote-entity-selector.html',
  styleUrl: './remote-entity-selector.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'remote-entity-selector' },
})
export class RemoteEntitySelector<T> {
  readonly adapter = input.required<EntityLookupAdapter<T>>();
  readonly label = input.required<string>();
  readonly required = input(false);
  readonly valueChange = output<T | null>();
  readonly selectedIdChange = output<string | null>();
  readonly stateChange = output<EntityLookupState<T>>();
  readonly validityChange = output<boolean>();

  readonly text = inject(I18nService).text;
  readonly query = signal('');
  readonly value = signal<T | null>(null);
  readonly selectedId = signal<string | null>(null);
  readonly trustedLabel = signal<string | null>(null);
  readonly items = signal<T[]>([]);
  readonly page = signal(0);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly searched = signal(false);
  readonly submitted = signal(false);
  readonly error = createLanguageResetError(inject(I18nService).language);
  readonly valid = computed(
    () => this.selectedId() !== null || (!this.required() && this.query().length === 0),
  );
  readonly selectedLabel = computed(() => {
    const value = this.value();
    return value === null ? (this.trustedLabel() ?? '') : this.adapter().present(value).selected;
  });
  readonly validationMessage = computed(() =>
    this.required() && this.query().length === 0
      ? this.text().entityLookup.required
      : this.text().entityLookup.unresolved,
  );

  private generation = 0;
  private interactionGeneration = 0;
  private debounceHandle: ReturnType<typeof setTimeout> | null = null;
  private request: Subscription | null = null;
  private retryAction: (() => void) | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.invalidateRequests());
  }

  inputChanged(event: Event): void {
    this.interactionGeneration++;
    this.query.set((event.target as HTMLInputElement).value);
    this.value.set(null);
    this.selectedId.set(null);
    this.trustedLabel.set(null);
    this.valueChange.emit(null);
    this.selectedIdChange.emit(null);
    this.invalidateRequests();
    this.clearResultState();
    this.emitState();
    const requestQuery = this.query().trim();
    if (requestQuery.length === 0) return;
    const generation = this.generation;
    this.debounceHandle = setTimeout(() => {
      if (generation === this.generation) this.load(requestQuery, 0);
    }, 300);
  }

  select(value: T): void {
    this.interactionGeneration++;
    this.invalidateRequests();
    this.value.set(value);
    const presentation = this.adapter().present(value);
    this.selectedId.set(this.adapter().id(value));
    this.trustedLabel.set(null);
    this.query.set(presentation.selected);
    this.submitted.set(false);
    this.clearResultState();
    this.valueChange.emit(value);
    this.selectedIdChange.emit(this.selectedId());
    this.emitState();
  }

  clear(): void {
    this.interactionGeneration++;
    this.invalidateRequests();
    this.query.set('');
    this.value.set(null);
    this.selectedId.set(null);
    this.trustedLabel.set(null);
    this.submitted.set(false);
    this.clearResultState();
    this.valueChange.emit(null);
    this.selectedIdChange.emit(null);
    this.emitState();
  }

  reset(): void {
    this.submitted.set(false);
    this.clear();
  }

  trustInitialValue(value: EntityLookupInitialSelection | null): void {
    if (this.interactionGeneration !== 0) return;
    queueMicrotask(() => {
      if (this.interactionGeneration !== 0) return;
      this.invalidateRequests();
      this.value.set(null);
      this.selectedId.set(value?.id ?? null);
      this.trustedLabel.set(value?.label ?? null);
      this.query.set(value?.label ?? '');
      this.submitted.set(false);
      this.clearResultState();
      this.selectedIdChange.emit(this.selectedId());
      this.emitState();
    });
  }

  resolveKnownId(id: string): void {
    const resolve = this.adapter().resolve;
    if (!resolve) throw new Error('This lookup adapter does not support known-ID resolution.');
    const interaction = this.interactionGeneration;
    this.invalidateRequests();
    const generation = this.generation;
    this.loading.set(true);
    this.error.set(null);
    this.retryAction = () => this.resolveKnownId(id);
    this.request = resolve.call(this.adapter(), id).subscribe({
      next: (value) => {
        if (generation !== this.generation || interaction !== this.interactionGeneration) return;
        this.loading.set(false);
        this.value.set(value);
        this.selectedId.set(this.adapter().id(value));
        this.trustedLabel.set(null);
        this.query.set(this.adapter().present(value).selected);
        this.clearResultState();
        this.submitted.set(false);
        this.valueChange.emit(value);
        this.selectedIdChange.emit(this.selectedId());
        this.emitState();
      },
      error: () => {
        if (generation !== this.generation || interaction !== this.interactionGeneration) return;
        this.loading.set(false);
        this.error.set(this.text().entityLookup.loadFailed);
      },
    });
  }

  markSubmitted(): boolean {
    this.submitted.set(true);
    this.emitValidity();
    return this.valid();
  }

  pageChanged(event: PageEvent): void {
    const requestQuery = this.query().trim();
    if (!requestQuery) return;
    this.invalidateRequests();
    this.items.set([]);
    this.searched.set(false);
    this.load(requestQuery, event.pageIndex, true);
  }

  retry(): void {
    this.retryAction?.();
  }

  private load(query: string, page: number, preservePaginator = false): void {
    this.invalidateRequests();
    const generation = this.generation;
    this.page.set(page);
    this.items.set([]);
    if (!preservePaginator) this.total.set(0);
    this.loading.set(true);
    this.searched.set(false);
    this.error.set(null);
    this.retryAction = () => this.load(query, page, preservePaginator);
    this.request = this.adapter()
      .search(query, page)
      .subscribe({
        next: (result) => {
          if (generation !== this.generation) return;
          const authoritativePageSize =
            result.pageSize > 0 ? result.pageSize : ENTITY_LOOKUP_PAGE_SIZE;
          const pageCount = Math.ceil(result.totalElements / authoritativePageSize);
          if (page > 0 && page >= pageCount) {
            this.load(query, Math.max(0, pageCount - 1), true);
            return;
          }
          this.loading.set(false);
          this.searched.set(true);
          this.page.set(Math.max(0, result.page));
          this.items.set(result.items.slice(0, ENTITY_LOOKUP_PAGE_SIZE));
          this.total.set(Math.max(0, result.totalElements));
        },
        error: () => {
          if (generation !== this.generation) return;
          this.loading.set(false);
          this.searched.set(false);
          this.error.set(this.text().entityLookup.loadFailed);
        },
      });
  }

  private clearResultState(): void {
    this.items.set([]);
    this.page.set(0);
    this.total.set(0);
    this.loading.set(false);
    this.searched.set(false);
    this.error.set(null);
    this.retryAction = null;
  }

  private invalidateRequests(): void {
    this.generation++;
    if (this.debounceHandle !== null) clearTimeout(this.debounceHandle);
    this.debounceHandle = null;
    this.request?.unsubscribe();
    this.request = null;
  }

  private emitState(): void {
    this.stateChange.emit({
      value: this.value(),
      selectedId: this.selectedId(),
      rawContentPresent: this.query().length > 0,
    });
    this.emitValidity();
  }

  private emitValidity(): void {
    this.validityChange.emit(this.valid());
  }
}
