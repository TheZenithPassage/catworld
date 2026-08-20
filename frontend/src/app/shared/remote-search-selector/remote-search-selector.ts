import {
  Component,
  ElementRef,
  OnDestroy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import {
  MatAutocompleteModule,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
} from '@angular/material/autocomplete';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ObservableInput, Subscription, from } from 'rxjs';

import { I18nService } from '../../core/i18n/i18n.service';

export interface RemoteSearchPage<T> {
  readonly items: readonly T[];
  readonly hasNext: boolean;
}

export type RemoteSearchLookup<T> = (
  query: string,
  page: number,
) => ObservableInput<RemoteSearchPage<T>>;

interface ResolvedSelection<T> {
  readonly option: T;
  readonly id: string;
  readonly label: string;
}

type SelectionError = 'required' | 'unresolved' | null;

@Component({
  selector: 'app-remote-search-selector',
  imports: [MatAutocompleteModule, MatButton, MatFormField, MatInput, MatLabel],
  templateUrl: './remote-search-selector.html',
  styleUrl: './remote-search-selector.scss',
})
export class RemoteSearchSelectorComponent<T> implements OnDestroy {
  private readonly i18nService = inject(I18nService);
  private readonly searchInput = viewChild.required<ElementRef<HTMLInputElement>>('searchInput');
  private readonly autocompleteTrigger = viewChild.required(MatAutocompleteTrigger);

  readonly label = input.required<string>();
  readonly placeholder = input('');
  readonly required = input(false);
  readonly disabled = input(false);
  readonly lookup = input.required<RemoteSearchLookup<T>>();
  readonly optionId = input.required<(option: T) => string>();
  readonly optionLabel = input.required<(option: T) => string>();
  readonly initialOption = input<T | null>(null);

  readonly selectionChange = output<T | null>();

  readonly text = this.i18nService.text;
  readonly searchText = signal('');
  readonly page = signal(0);
  readonly results = signal<readonly T[]>([]);
  readonly hasNext = signal(false);
  readonly loading = signal(false);
  readonly searchCompleted = signal(false);
  readonly searchFailed = signal(false);
  readonly touched = signal(false);

  private readonly resolvedSelection = signal<ResolvedSelection<T> | null>(null);
  readonly selectedOption = computed(() => this.resolvedSelection()?.option ?? null);
  readonly selectedId = computed(() => this.resolvedSelection()?.id ?? null);
  readonly selectedLabel = computed(() => this.resolvedSelection()?.label ?? null);
  readonly hasSubmittedQuery = computed(() => this.submittedQuery().length >= 3);
  readonly isValid = computed(
    () =>
      this.resolvedSelection() !== null ||
      (!this.required() && this.searchText().trim().length === 0),
  );
  readonly selectionError = computed<SelectionError>(() => {
    if (this.isValid()) {
      return null;
    }

    return this.searchText().trim().length === 0 ? 'required' : 'unresolved';
  });
  readonly showSelectionError = computed(() => this.touched() && this.selectionError() !== null);
  readonly canClear = computed(
    () =>
      !this.required() &&
      !this.disabled() &&
      (this.resolvedSelection() !== null || this.hasSubmittedQuery()),
  );

  readonly displayOption = (option: T | null): string =>
    option === null ? '' : this.optionLabel()(option);

  private debounceHandle: ReturnType<typeof setTimeout> | null = null;
  private activeRequest: Subscription | null = null;
  private requestSequence = 0;

  constructor() {
    effect(() => {
      const initialOption = this.initialOption();
      const idFor = this.optionId();
      const labelFor = this.optionLabel();

      untracked(() => this.applyTrustedInitialOption(initialOption, idFor, labelFor));
    });
  }

  onSearchTextInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;

    this.invalidatePendingWork();
    this.searchText.set(value);
    this.page.set(0);
    this.results.set([]);
    this.hasNext.set(false);
    this.loading.set(false);
    this.searchCompleted.set(false);
    this.searchFailed.set(false);

    if (this.resolvedSelection() !== null) {
      this.resolvedSelection.set(null);
      this.selectionChange.emit(null);
    }

    const query = value;
    if (query.length < 3) {
      return;
    }

    const sequence = this.requestSequence;
    this.debounceHandle = setTimeout(() => this.runLookup(query, 0, sequence), 250);
  }

  onBlur(): void {
    this.touched.set(true);
  }

  selectFromAutocomplete(event: MatAutocompleteSelectedEvent): void {
    const option = event.option.value as T;
    const label = this.optionLabel()(option);

    this.invalidatePendingWork();
    this.resolvedSelection.set({ option, id: this.optionId()(option), label });
    this.searchText.set(label);
    this.page.set(0);
    this.results.set([]);
    this.hasNext.set(false);
    this.loading.set(false);
    this.searchCompleted.set(false);
    this.searchFailed.set(false);
    this.touched.set(true);
    this.selectionChange.emit(option);
  }

  clear(): void {
    if (this.required() || this.disabled()) {
      return;
    }

    this.invalidatePendingWork();
    this.resolvedSelection.set(null);
    this.searchText.set('');
    this.page.set(0);
    this.results.set([]);
    this.hasNext.set(false);
    this.loading.set(false);
    this.searchCompleted.set(false);
    this.searchFailed.set(false);
    this.touched.set(true);

    this.selectionChange.emit(null);

    this.focusInput();
  }

  previousPage(): void {
    if (this.disabled() || this.page() <= 0 || this.loading() || !this.hasSubmittedQuery()) {
      return;
    }

    this.loadPage(this.page() - 1);
  }

  nextPage(): void {
    if (this.disabled() || !this.hasNext() || this.loading() || !this.hasSubmittedQuery()) {
      return;
    }

    this.loadPage(this.page() + 1);
  }

  markAsTouched(): void {
    this.touched.set(true);
  }

  ngOnDestroy(): void {
    this.invalidatePendingWork();
  }

  private submittedQuery(): string {
    return this.searchText();
  }

  private loadPage(page: number): void {
    this.invalidatePendingWork();
    this.page.set(page);
    this.results.set([]);
    this.hasNext.set(false);
    this.searchCompleted.set(false);
    this.searchFailed.set(false);

    this.runLookup(this.submittedQuery(), page, this.requestSequence);
  }

  private runLookup(query: string, page: number, sequence: number): void {
    this.debounceHandle = null;

    if (!this.isCurrentRequest(query, page, sequence)) {
      return;
    }

    this.loading.set(true);
    let receivedPage = false;

    try {
      this.activeRequest = from(this.lookup()(query, page)).subscribe({
        next: (response) => {
          if (!this.isCurrentRequest(query, page, sequence)) {
            return;
          }

          receivedPage = true;
          this.results.set([...response.items]);
          this.hasNext.set(response.hasNext);
          this.loading.set(false);
          this.searchCompleted.set(true);
          this.searchFailed.set(false);
          this.openResultsPanel();
        },
        error: () => {
          if (!this.isCurrentRequest(query, page, sequence)) {
            return;
          }

          this.results.set([]);
          this.hasNext.set(false);
          this.loading.set(false);
          this.searchCompleted.set(true);
          this.searchFailed.set(true);
        },
        complete: () => {
          if (receivedPage || !this.isCurrentRequest(query, page, sequence)) {
            return;
          }

          this.results.set([]);
          this.hasNext.set(false);
          this.loading.set(false);
          this.searchCompleted.set(true);
          this.searchFailed.set(false);
        },
      });
    } catch {
      if (!this.isCurrentRequest(query, page, sequence)) {
        return;
      }

      this.results.set([]);
      this.hasNext.set(false);
      this.loading.set(false);
      this.searchCompleted.set(true);
      this.searchFailed.set(true);
    }
  }

  private isCurrentRequest(query: string, page: number, sequence: number): boolean {
    return (
      sequence === this.requestSequence &&
      query === this.submittedQuery() &&
      page === this.page() &&
      this.resolvedSelection() === null
    );
  }

  private invalidatePendingWork(): void {
    this.requestSequence += 1;

    if (this.debounceHandle !== null) {
      clearTimeout(this.debounceHandle);
      this.debounceHandle = null;
    }

    this.activeRequest?.unsubscribe();
    this.activeRequest = null;
  }

  private applyTrustedInitialOption(
    option: T | null,
    idFor: (option: T) => string,
    labelFor: (option: T) => string,
  ): void {
    if (
      option === null &&
      this.resolvedSelection() === null &&
      this.searchText().trim().length > 0
    ) {
      return;
    }

    this.invalidatePendingWork();
    this.results.set([]);
    this.hasNext.set(false);
    this.loading.set(false);
    this.searchCompleted.set(false);
    this.searchFailed.set(false);
    this.page.set(0);
    this.touched.set(false);

    if (option === null) {
      this.resolvedSelection.set(null);
      this.searchText.set('');
      return;
    }

    const label = labelFor(option);
    this.resolvedSelection.set({ option, id: idFor(option), label });
    this.searchText.set(label);
  }

  private focusInput(): void {
    queueMicrotask(() => this.searchInput().nativeElement.focus());
  }

  private openResultsPanel(): void {
    queueMicrotask(() => {
      if (
        this.results().length > 0 &&
        document.activeElement === this.searchInput().nativeElement
      ) {
        this.autocompleteTrigger().openPanel();
      }
    });
  }
}
