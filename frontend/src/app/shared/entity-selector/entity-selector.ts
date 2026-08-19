import { AfterViewInit, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatIconButton } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import {
  MatAutocomplete,
  MatAutocompleteSelectedEvent,
  MatAutocompleteTrigger,
  MatOption,
} from '@angular/material/autocomplete';
import { MatError, MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';

import { matchesSearchText } from '../../core/search/search-text.util';

export interface EntitySelectorOption {
  readonly id: string;
  readonly label: string;
}

@Component({
  selector: 'app-entity-selector',
  imports: [
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatError,
    MatFormField,
    MatIconButton,
    MatInput,
    MatLabel,
    MatOption,
    MatSuffix,
  ],
  templateUrl: './entity-selector.html',
  styleUrl: './entity-selector.scss',
})
export class EntitySelectorComponent implements AfterViewInit {
  private static nextErrorId = 0;
  private currentOptions: readonly EntitySelectorOption[] = [];
  private selectedId: string | null = null;

  @Input({ required: true }) label!: string;
  @Input() noResultsText = 'No results';
  @Input() clearLabel = 'Clear selection';
  @Input() clearable = false;
  @Input() disabled = false;
  @Input() required = false;

  @ViewChild(MatInput) private inputControl?: MatInput;

  private currentErrorText: string | null = null;

  @Input()
  set errorText(errorText: string | null) {
    this.currentErrorText = errorText;
    this.inputControl?.updateErrorState();
  }

  get errorText(): string | null {
    return this.currentErrorText;
  }

  readonly errorId = `entity-selector-error-${EntitySelectorComponent.nextErrorId++}`;
  readonly errorStateMatcher: ErrorStateMatcher = {
    isErrorState: () => this.errorText !== null,
  };

  ngAfterViewInit(): void {
    this.inputControl?.updateErrorState();
  }

  @Input()
  set options(options: readonly EntitySelectorOption[]) {
    this.currentOptions = options;
    this.reconcileSelection();
  }

  get options(): readonly EntitySelectorOption[] {
    return this.currentOptions;
  }

  @Input()
  set value(value: string | null) {
    if (value === this.selectedId) {
      return;
    }

    this.selectedId = value;
    if (value === null) {
      this.searchText = '';
      return;
    }
    this.reconcileSelection();
  }

  get value(): string | null {
    return this.selectedId;
  }

  @Output() readonly valueChange = new EventEmitter<string | null>();

  searchText = '';

  get filteredOptions(): readonly EntitySelectorOption[] {
    return this.currentOptions.filter((option) =>
      matchesSearchText([option.label], this.searchText),
    );
  }

  get hasSelection(): boolean {
    return this.selectedId !== null;
  }

  readonly displayOption = (id: string): string =>
    this.currentOptions.find((option) => option.id === id)?.label ?? '';

  onSearchTextChange(searchText: string): void {
    this.searchText = searchText;
    const selected = this.selectedOption();

    if (this.selectedId !== null && selected?.label !== searchText) {
      this.updateSelection(null);
    }
  }

  selectOption(event: MatAutocompleteSelectedEvent): void {
    const option = this.currentOptions.find((candidate) => candidate.id === event.option.value);

    if (!option || this.disabled) {
      return;
    }

    this.searchText = option.label;
    this.updateSelection(option.id);
  }

  clearSelection(): void {
    if (this.disabled) {
      return;
    }

    this.searchText = '';
    this.updateSelection(null);
  }

  private selectedOption(): EntitySelectorOption | undefined {
    return this.currentOptions.find((option) => option.id === this.selectedId);
  }

  private reconcileSelection(): void {
    if (this.selectedId === null) {
      return;
    }

    const selected = this.selectedOption();
    if (selected) {
      this.searchText = selected.label;
      return;
    }

    this.searchText = '';
    this.updateSelection(null);
  }

  private updateSelection(value: string | null): void {
    if (this.selectedId === value) {
      return;
    }

    this.selectedId = value;
    this.valueChange.emit(value);
  }
}
