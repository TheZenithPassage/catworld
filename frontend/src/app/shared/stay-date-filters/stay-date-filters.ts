import {
  afterEveryRender,
  Component,
  ChangeDetectorRef,
  ElementRef,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule, NgModel } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormField, MatLabel, MatError } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatSelect, MatSelectTrigger } from '@angular/material/select';
import { MatOption } from '@angular/material/core';
import { I18nService } from '../../core/i18n/i18n.service';
import { NativeBadInputDirective } from '../forms/native-bad-input.directive';
import {
  DATE_MATCH_MODES,
  StayDateFilters,
  StayDateMatchMode,
  isStayDateRangeValid,
} from './stay-date-filter.model';

type Boundary = 'dateFrom' | 'dateTo';
type DateInputState = 'EMPTY' | 'EDITING' | 'VALID' | 'INVALID';

@Component({
  selector: 'app-stay-date-filters',
  imports: [
    FormsModule,
    MatFormField,
    MatLabel,
    MatError,
    MatInput,
    MatSelect,
    MatSelectTrigger,
    MatOption,
    NativeBadInputDirective,
  ],
  templateUrl: './stay-date-filters.html',
  styleUrl: './stay-date-filters.scss',
})
export class StayDateFiltersComponent {
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly i18n = inject(I18nService);
  readonly text = this.i18n.text;
  readonly filters = input<StayDateFilters>({ dateMatchMode: 'OVERLAPS' });
  readonly filtersChange = output<StayDateFilters>();
  readonly modes = DATE_MATCH_MODES;
  private readonly fromInput = viewChild<ElementRef<HTMLInputElement>>('fromInput');
  private readonly toInput = viewChild<ElementRef<HTMLInputElement>>('toInput');
  private readonly fromModel = viewChild<NgModel>('fromModel');
  private readonly toModel = viewChild<NgModel>('toModel');
  readonly submitted = signal(false);
  readonly dateStates = signal<Record<Boundary, DateInputState>>({
    dateFrom: 'EMPTY',
    dateTo: 'EMPTY',
  });
  readonly outOfRange = signal({ dateFrom: false, dateTo: false });
  constructor() {
    // Include model/route writes after NgModel has updated the native controls.
    afterEveryRender(() => this.syncNativeStates());
  }
  readonly reversed = computed(
    () =>
      this.dateStates().dateFrom === 'VALID' &&
      this.dateStates().dateTo === 'VALID' &&
      !isStayDateRangeValid(this.filters()),
  );
  readonly modeAvailable = computed(
    () =>
      !this.isUnusable('dateFrom') &&
      !this.isUnusable('dateTo') &&
      !this.reversed() &&
      (this.dateStates().dateFrom === 'VALID' || this.dateStates().dateTo === 'VALID'),
  );
  readonly fromMatcher: ErrorStateMatcher = {
    isErrorState: () => this.submitted() && this.isUnusable('dateFrom'),
  };
  readonly toMatcher: ErrorStateMatcher = {
    isErrorState: () => this.submitted() && (this.isUnusable('dateTo') || this.reversed()),
  };
  readonly explanations = computed(() => {
    if (!this.modeAvailable()) return null;
    const { dateFrom, dateTo } = this.filters();
    const format = (value: string) => {
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(0);
      date.setFullYear(year, month - 1, day);
      return new Intl.DateTimeFormat(this.i18n.dateLocale(), {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }).format(date);
    };
    const from = dateFrom ? format(dateFrom) : null;
    const to = dateTo ? format(dateTo) : null;
    const describe = (mode: StayDateMatchMode) => {
      const help = this.text().stays.filters.dateHelp[mode];
      if (dateFrom && dateFrom === dateTo) return help.sameDay(from!);
      return from && to ? help.both(from, to) : from ? help.from(from) : help.to(to!);
    };
    return {
      OVERLAPS: describe('OVERLAPS'),
      STAY_WITHIN_RANGE: describe('STAY_WITHIN_RANGE'),
      RANGE_WITHIN_STAY: describe('RANGE_WITHIN_STAY'),
    };
  });

  dateInput(field: Boundary, event: Event): void {
    const element = event.target as HTMLInputElement;
    const previousState = this.dateStates()[field];
    this.syncNativeStates();
    if (
      previousState === this.dateStates()[field] &&
      element.value === (this.filters()[field] ?? '')
    )
      return;
    const next = { ...this.dateDraft(), [field]: element.value };
    if (this.dateStates().dateFrom === 'EMPTY' && this.dateStates().dateTo === 'EMPTY')
      next.dateMatchMode = 'OVERLAPS';
    this.filtersChange.emit(next);
  }

  setMode(mode: StayDateMatchMode): void {
    this.filtersChange.emit({ ...this.dateDraft(), dateMatchMode: mode });
  }

  clear(): void {
    // Clear native partial edits even when their normalized model value is already empty.
    for (const input of [this.fromInput(), this.toInput()]) {
      if (input) input.nativeElement.value = '';
    }
    this.fromModel()?.control.reset('', { emitEvent: false });
    this.toModel()?.control.reset('', { emitEvent: false });
    this.submitted.set(false);
    this.syncNativeStates();
    this.changeDetector.markForCheck();
    this.filtersChange.emit({ dateFrom: '', dateTo: '', dateMatchMode: 'OVERLAPS' });
  }

  private dateDraft(): StayDateFilters {
    const { dateFrom, dateTo, dateMatchMode = 'OVERLAPS' } = this.filters();
    return { dateFrom, dateTo, dateMatchMode };
  }

  validate(): boolean {
    this.submitted.set(true);
    this.changeDetector.markForCheck();
    this.syncNativeStates();
    return !this.isUnusable('dateFrom') && !this.isUnusable('dateTo') && !this.reversed();
  }

  private isUnusable(field: Boundary): boolean {
    return this.dateStates()[field] === 'EDITING' || this.dateStates()[field] === 'INVALID';
  }

  private syncNativeStates(): void {
    for (const [field, ref] of [
      ['dateFrom', this.fromInput()],
      ['dateTo', this.toInput()],
    ] as const) {
      if (!ref) continue;
      const { value, validity } = ref.nativeElement;
      // badInput exposes raw, non-empty native segments even when value is ''.
      const state: DateInputState = value
        ? validity.valid
          ? 'VALID'
          : 'INVALID'
        : validity.badInput
          ? 'EDITING'
          : validity.valid
            ? 'EMPTY'
            : 'INVALID';
      const outside = Boolean(validity.rangeUnderflow || validity.rangeOverflow);
      if (this.dateStates()[field] !== state)
        this.dateStates.update((current) => ({ ...current, [field]: state }));
      if (this.outOfRange()[field] !== outside)
        this.outOfRange.update((current) => ({ ...current, [field]: outside }));
    }
  }
}
