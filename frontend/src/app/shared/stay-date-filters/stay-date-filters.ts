import {
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
import { FormsModule } from '@angular/forms';
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
  readonly submitted = signal(false);
  readonly unusable = signal({ dateFrom: false, dateTo: false });
  readonly reversed = computed(
    () =>
      !this.unusable().dateFrom && !this.unusable().dateTo && !isStayDateRangeValid(this.filters()),
  );
  readonly modeAvailable = computed(
    () =>
      !this.unusable().dateFrom &&
      !this.unusable().dateTo &&
      !this.reversed() &&
      Boolean(this.filters().dateFrom || this.filters().dateTo),
  );
  readonly fromMatcher: ErrorStateMatcher = {
    isErrorState: (control) =>
      this.submitted() && (this.unusable().dateFrom || Boolean(control?.hasError('badInput'))),
  };
  readonly toMatcher: ErrorStateMatcher = {
    isErrorState: (control) =>
      this.submitted() &&
      (this.unusable().dateTo || Boolean(control?.hasError('badInput')) || this.reversed()),
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
    this.unusable.update((state) => ({ ...state, [field]: !element.validity.valid }));
    const next = { ...this.dateDraft(), [field]: element.value };
    if (!next.dateFrom && !next.dateTo && !this.unusable().dateFrom && !this.unusable().dateTo)
      next.dateMatchMode = 'OVERLAPS';
    this.filtersChange.emit(next);
  }

  setMode(mode: StayDateMatchMode): void {
    this.filtersChange.emit({ ...this.dateDraft(), dateMatchMode: mode });
  }

  private dateDraft(): StayDateFilters {
    const { dateFrom, dateTo, dateMatchMode = 'OVERLAPS' } = this.filters();
    return { dateFrom, dateTo, dateMatchMode };
  }

  validate(): boolean {
    this.submitted.set(true);
    this.changeDetector.markForCheck();
    this.unusable.set({
      dateFrom: !(this.fromInput()?.nativeElement.validity.valid ?? true),
      dateTo: !(this.toInput()?.nativeElement.validity.valid ?? true),
    });
    return !this.unusable().dateFrom && !this.unusable().dateTo && !this.reversed();
  }
}
