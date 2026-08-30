import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { RouterLink } from '@angular/router';

import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DatesSetArg, EventContentArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import esLocale from '@fullcalendar/core/locales/es';
import enGbLocale from '@fullcalendar/core/locales/en-gb';

import { Stay } from '../../../stays/models/stay.model';
import { StayApiService } from '../../../stays/services/stay-api.service';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import { StayStatusVisibilityPreferencesService } from '../../../stays/services/stay-status-visibility-preferences.service';
import { getStayColorAssignments } from './stay-calendar-color-assignments';
import { compareStayCalendarEvents, toStayCalendarEvents } from './stay-calendar-events';
import { StaySearchFiltersComponent } from '../../../stays/components/stay-search-filters/stay-search-filters';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import {
  getDefaultStaySearchFilters,
  isStayVisibleBySearchFilters,
  StaySearchFilters,
} from '../../../stays/utils/stay-search-filter.util';
import {
  isStayVisibleByStatus,
  STAY_STATUS_FILTER_OPTIONS,
  StayStatus,
  StayStatusVisibility,
} from '../../../stays/utils/stay-status.util';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import {
  CALENDAR_DISPLAY_MODES,
  CalendarDisplayMode,
  DEFAULT_CALENDAR_DISPLAY_MODE,
  isCalendarDisplayMode,
} from './calendar-display-mode';
import { CalendarDailyAggregate, getCalendarDailyAggregates } from './calendar-daily-aggregate';

interface CalendarLocalPreferences {
  displayMode: CalendarDisplayMode;
  visibleMonth: string | null;
}

@Component({
  selector: 'app-calendar-page',
  imports: [
    FullCalendarModule,
    MatButton,
    MatCheckbox,
    MatRadioModule,
    RouterLink,
    StaySearchFiltersComponent,
    UiStateComponent,
  ],
  templateUrl: './calendar-page.html',
  styleUrl: './calendar-page.scss',
})
export class CalendarPage {
  private readonly stayApiService = inject(StayApiService);
  private readonly entityDetailDialog = inject(EntityDetailDialogService);
  private readonly i18nService = inject(I18nService);
  private readonly stayStatusVisibilityPreferencesService = inject(
    StayStatusVisibilityPreferencesService,
  );

  private readonly calendarPreferencesStorageKey = 'catworld.calendar.preferences';
  private readonly storedCalendarPreferences = this.readStoredCalendarPreferences();

  readonly text = this.i18nService.text;
  readonly language = this.i18nService.language;

  readonly stays = signal<Stay[]>([]);
  readonly loading = signal(false);
  readonly error = createLanguageResetError(this.i18nService.language);

  readonly statusFilterOptions = STAY_STATUS_FILTER_OPTIONS;
  readonly statusVisibility = signal<StayStatusVisibility>(
    this.stayStatusVisibilityPreferencesService.read(),
  );

  readonly displayModeOptions = CALENDAR_DISPLAY_MODES;

  readonly displayMode = signal<CalendarDisplayMode>(this.storedCalendarPreferences.displayMode);

  readonly visibleMonth = signal<string | null>(this.storedCalendarPreferences.visibleMonth);
  readonly searchFilters = signal<StaySearchFilters>(getDefaultStaySearchFilters());
  readonly filteredStays = computed(() =>
    this.stays().filter(
      (stay) =>
        isStayVisibleByStatus(stay, this.statusVisibility()) &&
        isStayVisibleBySearchFilters(stay, this.searchFilters()),
    ),
  );
  readonly dailyAggregates = computed(() => getCalendarDailyAggregates(this.filteredStays()));

  readonly calendarOptions = computed<CalendarOptions>(() => ({
    plugins: [dayGridPlugin],
    initialView: 'dayGridMonth',
    initialDate: this.storedCalendarPreferences.visibleMonth ?? undefined,
    locale: this.language() === 'es' ? esLocale : enGbLocale,
    firstDay: 1,
    height: 'auto',
    displayEventTime: false,
    displayEventEnd: false,
    dayMaxEvents: true,
    eventOrder: compareStayCalendarEvents,
    eventOrderStrict: true,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: '',
    },
    datesSet: (dateInfo: DatesSetArg) => {
      this.visibleMonth.set(this.toDateValue(dateInfo.view.currentStart));
    },
    eventClick: ({ event }) => {
      if (event.extendedProps['eventKind'] === 'daily-count') {
        const aggregate = event.extendedProps['dailyAggregate'];

        if (this.isCalendarDailyAggregate(aggregate)) {
          this.activateDailyCount(aggregate);
        }

        return;
      }

      const stayId = event.extendedProps['stayId'] ?? event.id;

      this.entityDetailDialog
        .open({ entityType: 'stay', entityId: stayId })
        .subscribe((updated) => {
          if ('entityType' in updated) {
            this.loadStays();
            return;
          }
          this.stays.update((items) =>
            items.map((item) => (item.stayId === updated.stayId ? updated : item)),
          );
        });
    },
    eventDidMount: ({ el, event }) => {
      if (event.extendedProps['eventKind'] === 'daily-count') {
        el.style.cursor = 'pointer';
        return;
      }

      const compactMarkerLabel = event.extendedProps['compactMarkerLabel'];
      const openStayInList = this.text().calendar.openStayInList;

      el.title =
        typeof compactMarkerLabel === 'string' && compactMarkerLabel
          ? `${compactMarkerLabel}. ${openStayInList}.`
          : openStayInList;

      el.style.cursor = 'pointer';
    },
    eventContent: (eventInfo: EventContentArg) => {
      if (eventInfo.event.extendedProps['eventKind'] !== 'daily-count') {
        return true;
      }

      const accessibleName = document.createElement('span');
      accessibleName.className = 'daily-count-event__accessible';
      accessibleName.textContent = String(
        eventInfo.event.extendedProps['dailyCountAccessibleName'] ?? '',
      );

      const fullLabel = document.createElement('span');
      fullLabel.className = 'daily-count-event__full';
      fullLabel.setAttribute('aria-hidden', 'true');
      fullLabel.textContent = eventInfo.event.title;

      const numeral = document.createElement('span');
      numeral.className = 'daily-count-event__number';
      numeral.setAttribute('aria-hidden', 'true');
      numeral.textContent = String(eventInfo.event.extendedProps['dailyCountNumeral'] ?? '');

      return { domNodes: [accessibleName, fullLabel, numeral] };
    },
  }));

  readonly calendarEvents = computed(() => {
    const colorAssignments = getStayColorAssignments(this.stays());
    return toStayCalendarEvents({
      visibleStays: this.filteredStays(),
      dailyAggregates: this.dailyAggregates(),
      colorAssignments,
      displayMode: this.displayMode(),
      compactMarkerLabels: this.text().calendar.compactMarkerLabels,
      dailyCountLabels: this.text().calendar.dailyCounts,
    });
  });

  activateDailyCount(_aggregate: CalendarDailyAggregate): void {
    // S3 owns the daily-summary dialog opened from this explicit count-event seam.
  }

  constructor() {
    effect(() => {
      this.storeCalendarPreferences({
        displayMode: this.displayMode(),
        visibleMonth: this.visibleMonth(),
      });

      this.stayStatusVisibilityPreferencesService.store(this.statusVisibility());
    });

    this.loadStays();
  }

  loadStays(): void {
    this.loading.set(true);
    this.error.set(null);

    this.stayApiService.getStays().subscribe({
      next: (stays) => {
        this.stays.set(stays);
        this.loading.set(false);
      },
      error: () => {
        this.error.set(this.text().calendar.errorLoading);
        this.loading.set(false);
      },
    });
  }

  isStatusVisible(status: StayStatus): boolean {
    return this.statusVisibility()[status];
  }

  setStatusVisibility(status: StayStatus, checked: boolean): void {
    this.statusVisibility.update((currentVisibility) => ({
      ...currentVisibility,
      [status]: checked,
    }));
  }

  toggleStatusFromPill(event: MouseEvent, status: StayStatus): void {
    if (event.target !== event.currentTarget) {
      return;
    }

    this.setStatusVisibility(status, !this.isStatusVisible(status));
  }

  setSearchFilters(filters: StaySearchFilters): void {
    this.searchFilters.set(filters);
  }

  setDisplayMode(displayMode: CalendarDisplayMode): void {
    this.displayMode.set(displayMode);
  }

  activateDisplayOption(event: MouseEvent, displayMode: CalendarDisplayMode): void {
    if (event.target !== event.currentTarget) return;
    this.setDisplayMode(displayMode);
  }

  private readStoredCalendarPreferences(): CalendarLocalPreferences {
    const defaultPreferences: CalendarLocalPreferences = {
      displayMode: DEFAULT_CALENDAR_DISPLAY_MODE,
      visibleMonth: null,
    };

    try {
      const storedValue = localStorage.getItem(this.calendarPreferencesStorageKey);

      if (!storedValue) {
        return defaultPreferences;
      }

      const parsedValue: unknown = JSON.parse(storedValue);

      if (!this.isObjectRecord(parsedValue)) {
        return defaultPreferences;
      }

      return {
        displayMode: isCalendarDisplayMode(parsedValue['displayMode'])
          ? parsedValue['displayMode']
          : defaultPreferences.displayMode,
        visibleMonth: this.isDateValue(parsedValue['visibleMonth'])
          ? parsedValue['visibleMonth']
          : defaultPreferences.visibleMonth,
      };
    } catch {
      return defaultPreferences;
    }
  }

  private storeCalendarPreferences(preferences: CalendarLocalPreferences): void {
    try {
      localStorage.setItem(this.calendarPreferencesStorageKey, JSON.stringify(preferences));
    } catch {
      return;
    }
  }

  private isDateValue(value: unknown): value is string {
    if (typeof value !== 'string') {
      return false;
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }

    return !Number.isNaN(new Date(`${value}T00:00:00`).getTime());
  }

  private isObjectRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }

  private isCalendarDailyAggregate(value: unknown): value is CalendarDailyAggregate {
    return (
      this.isObjectRecord(value) &&
      typeof value['date'] === 'string' &&
      typeof value['count'] === 'number' &&
      Array.isArray(value['participants'])
    );
  }

  private toDateValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
