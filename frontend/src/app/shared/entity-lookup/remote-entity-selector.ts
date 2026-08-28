import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  output,
  Renderer2,
  signal,
  viewChild,
} from '@angular/core';
import {
  MatAutocomplete,
  MatAutocompleteActivatedEvent,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatFormField, MatHint, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatOption } from '@angular/material/core';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';

import { I18nService } from '../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../core/i18n/language-reset-error';
import {
  EntityLookupAdapter,
  EntityLookupInitialSelection,
  EntityLookupState,
} from './entity-lookup.models';

const SEARCH_DEBOUNCE_MS = 300;
const PANEL_SCROLL_THRESHOLD_PX = 32;

@Component({
  selector: 'app-remote-entity-selector',
  imports: [
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatButton,
    MatFormField,
    MatHint,
    MatIconButton,
    MatInput,
    MatLabel,
    MatOption,
    MatProgressSpinner,
    MatSuffix,
  ],
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
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly searched = signal(false);
  readonly submitted = signal(false);
  readonly error = createLanguageResetError(inject(I18nService).language);
  readonly valid = computed(
    () => this.selectedId() !== null || (!this.required() && this.query().length === 0),
  );
  readonly validationMessage = computed(() =>
    this.required() && this.query().length === 0
      ? this.text().entityLookup.required
      : this.text().entityLookup.unresolved,
  );
  readonly noResults = computed(
    () =>
      this.error() === null &&
      !this.loading() &&
      this.searched() &&
      this.items().length === 0 &&
      this.query().trim().length > 0,
  );
  readonly invalidFeedback = computed(
    () =>
      this.error() === null &&
      !this.loading() &&
      (this.noResults() || (this.submitted() && !this.valid())),
  );
  readonly invalidMessage = computed(() =>
    this.noResults() ? this.text().entityLookup.noResults : this.validationMessage(),
  );
  readonly progressLabel = computed(() =>
    this.text().entityLookup.progress(Math.min(this.items().length, this.total()), this.total()),
  );
  readonly hasMore = computed(() => !this.pagingExhausted() && this.items().length < this.total());

  readonly displayValue = (value: T | string | null): string => {
    if (value === null) return '';
    return typeof value === 'string' ? value : this.adapter().present(value).selected;
  };

  private readonly autocomplete = viewChild.required<MatAutocomplete>('autocomplete');
  private readonly lookupInput = viewChild.required<ElementRef<HTMLInputElement>>('lookupInput');
  private readonly renderer = inject(Renderer2);
  private readonly activeQuery = signal('');
  private readonly nextPage = signal(0);
  private readonly pagingExhausted = signal(false);
  private generation = 0;
  private interactionGeneration = 0;
  private debounceHandle: ReturnType<typeof setTimeout> | null = null;
  private panelOpenHandle: ReturnType<typeof setTimeout> | null = null;
  private panelCheckHandle: ReturnType<typeof setTimeout> | null = null;
  private panelScrollCleanup: (() => void) | null = null;
  private request: Subscription | null = null;
  private retryAction: (() => void) | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      this.invalidateRequests();
      this.clearPanelOpen();
      this.detachPanelScroll();
    });
  }

  inputChanged(event: Event): void {
    this.interactionGeneration++;
    this.submitted.set(false);
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
      if (generation === this.generation) this.loadPage(requestQuery, 0, false);
    }, SEARCH_DEBOUNCE_MS);
  }

  optionSelected(event: MatAutocompleteSelectedEvent): void {
    const input = this.lookupInput().nativeElement;
    this.select(event.option.value as T);
    queueMicrotask(() => {
      input.blur();
      input.setSelectionRange(0, 0);
      input.scrollLeft = 0;
    });
  }

  optionActivated(event: MatAutocompleteActivatedEvent): void {
    if (event.option === null || event.option !== this.autocomplete().options.last) return;
    this.loadNextPage();
  }

  panelOpened(): void {
    this.detachPanelScroll();
    this.clearPanelOpen();
    this.panelOpenHandle = setTimeout(() => {
      this.panelOpenHandle = null;
      const autocomplete = this.autocomplete();
      const panel = autocomplete.panel?.nativeElement as HTMLElement | undefined;
      if (!autocomplete.isOpen || !panel) return;
      this.panelScrollCleanup = this.renderer.listen(panel, 'scroll', () =>
        this.loadNextPageNearPanelEnd(panel),
      );
      this.schedulePanelFillCheck();
    });
  }

  panelClosed(): void {
    this.detachPanelScroll();
    this.clearPanelOpen();
    this.clearPanelFillCheck();
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
      this.clearResultState();
      this.value.set(null);
      this.selectedId.set(value?.id ?? null);
      this.trustedLabel.set(value?.label ?? null);
      this.query.set(value?.label ?? '');
      this.submitted.set(false);
      this.selectedIdChange.emit(this.selectedId());
      this.emitState();
    });
  }

  resolveKnownId(id: string): void {
    const resolve = this.adapter().resolve;
    if (!resolve) throw new Error('This lookup adapter does not support known-ID resolution.');
    const interaction = this.interactionGeneration;
    this.invalidateRequests();
    this.clearResultState();
    const generation = this.generation;
    this.loading.set(true);
    this.error.set(null);
    this.retryAction = () => this.resolveKnownId(id);
    this.request = resolve.call(this.adapter(), id).subscribe({
      next: (value) => {
        if (generation !== this.generation || interaction !== this.interactionGeneration) return;
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

  retry(): void {
    this.retryAction?.();
  }

  private loadNextPage(): void {
    const query = this.activeQuery();
    if (!query || this.loading() || this.error() !== null || !this.hasMore()) return;
    this.loadPage(query, this.nextPage(), true);
  }

  private loadNextPageNearPanelEnd(panel: HTMLElement): void {
    const remaining = panel.scrollHeight - panel.scrollTop - panel.clientHeight;
    if (remaining <= PANEL_SCROLL_THRESHOLD_PX) this.loadNextPage();
  }

  private loadPage(query: string, page: number, append: boolean): void {
    this.invalidateRequests();
    const generation = this.generation;
    this.activeQuery.set(query);
    if (!append) {
      this.items.set([]);
      this.total.set(0);
      this.nextPage.set(0);
      this.pagingExhausted.set(false);
      this.searched.set(false);
    }
    this.loading.set(true);
    this.error.set(null);
    this.retryAction = () => this.loadPage(query, page, append);
    this.request = this.adapter()
      .search(query, page)
      .subscribe({
        next: (result) => {
          if (generation !== this.generation) return;
          const nextItems = append ? [...this.items(), ...result.items] : result.items;
          const total = Math.max(0, result.totalElements);
          this.items.set(nextItems);
          this.total.set(total);
          this.nextPage.set(Math.max(0, result.page) + 1);
          this.pagingExhausted.set(result.items.length === 0 || nextItems.length >= total);
          this.loading.set(false);
          this.searched.set(true);
          this.schedulePanelFillCheck();
        },
        error: () => {
          if (generation !== this.generation) return;
          this.loading.set(false);
          this.error.set(this.text().entityLookup.loadFailed);
        },
      });
  }

  private schedulePanelFillCheck(): void {
    this.clearPanelFillCheck();
    this.panelCheckHandle = setTimeout(() => {
      this.panelCheckHandle = null;
      const autocomplete = this.autocomplete();
      const panel = autocomplete.panel?.nativeElement as HTMLElement | undefined;
      if (!autocomplete.isOpen || !panel || !this.hasMore()) return;
      if (panel.clientHeight > 0 && panel.scrollHeight <= panel.clientHeight) {
        this.loadNextPage();
      }
    });
  }

  private clearResultState(): void {
    this.items.set([]);
    this.activeQuery.set('');
    this.nextPage.set(0);
    this.total.set(0);
    this.pagingExhausted.set(false);
    this.loading.set(false);
    this.searched.set(false);
    this.error.set(null);
    this.retryAction = null;
  }

  private invalidateRequests(): void {
    this.generation++;
    if (this.debounceHandle !== null) clearTimeout(this.debounceHandle);
    this.debounceHandle = null;
    this.clearPanelFillCheck();
    this.request?.unsubscribe();
    this.request = null;
  }

  private clearPanelFillCheck(): void {
    if (this.panelCheckHandle !== null) clearTimeout(this.panelCheckHandle);
    this.panelCheckHandle = null;
  }

  private clearPanelOpen(): void {
    if (this.panelOpenHandle !== null) clearTimeout(this.panelOpenHandle);
    this.panelOpenHandle = null;
  }

  private detachPanelScroll(): void {
    this.panelScrollCleanup?.();
    this.panelScrollCleanup = null;
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
