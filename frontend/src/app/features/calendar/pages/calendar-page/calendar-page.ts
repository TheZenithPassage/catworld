import { Component, computed, effect, inject, signal } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatRadioModule } from '@angular/material/radio';
import { RouterLink } from '@angular/router';

import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DatesSetArg } from '@fullcalendar/core';
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
  hasActiveStayEntityFilter,
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
  DEFAULT_UNFILTERED_CALENDAR_DISPLAY_MODE,
  isCalendarDisplayMode,
  toCalendarDisplaySettings,
  toUnfilteredCalendarDisplayModeFromLegacySettings,
} from './calendar-display-mode';

interface CalendarLocalPreferences {
  unfilteredDisplayMode: CalendarDisplayMode;
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

  readonly unfilteredDisplayMode = signal<CalendarDisplayMode>(
    this.storedCalendarPreferences.unfilteredDisplayMode,
  );

  readonly filteredDailyLabelsEnabled = signal(false);

  readonly visibleMonth = signal<string | null>(this.storedCalendarPreferences.visibleMonth);
  readonly searchFilters = signal<StaySearchFilters>(getDefaultStaySearchFilters());
  readonly hasEntityFilter = computed(() => hasActiveStayEntityFilter(this.searchFilters()));

  readonly calendarDisplaySettings = computed(() => {
    if (this.hasEntityFilter()) {
      return {
        dailyLabelsEnabled: this.filteredDailyLabelsEnabled(),
        compactModeEnabled: false,
      };
    }

    return toCalendarDisplaySettings(this.unfilteredDisplayMode());
  });
  readonly filteredStays = computed(() =>
    this.stays().filter(
      (stay) =>
        isStayVisibleByStatus(stay, this.statusVisibility()) &&
        isStayVisibleBySearchFilters(stay, this.searchFilters()),
    ),
  );

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
      const stayId = event.extendedProps['stayId'] ?? event.id;

      this.entityDetailDialog.open({ entityType: 'stay', entityId: stayId }).subscribe(() => {
        this.stayApiService.getStayById(stayId).subscribe({
          next: (updated) =>
            this.stays.update((items) =>
              items.map((item) => (item.stayId === stayId ? updated : item)),
            ),
        });
      });
    },
    eventDidMount: ({ el, event }) => {
      const compactMarkerLabel = event.extendedProps['compactMarkerLabel'];
      const openStayInList = this.text().calendar.openStayInList;

      el.title =
        typeof compactMarkerLabel === 'string' && compactMarkerLabel
          ? `${compactMarkerLabel}. ${openStayInList}.`
          : openStayInList;

      el.style.cursor = 'pointer';
    },
  }));

  readonly calendarEvents = computed(() => {
    const colorAssignments = getStayColorAssignments(this.stays());
    const displaySettings = this.calendarDisplaySettings();

    return toStayCalendarEvents({
      visibleStays: this.filteredStays(),
      colorAssignments,
      dailyLabelsEnabled: displaySettings.dailyLabelsEnabled,
      compactModeEnabled: displaySettings.compactModeEnabled,
      compactMarkerLabels: this.text().calendar.compactMarkerLabels,
    });
  });

  constructor() {
    effect(() => {
      this.storeCalendarPreferences({
        unfilteredDisplayMode: this.unfilteredDisplayMode(),
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
    const hadEntityFilter = this.hasEntityFilter();
    const willHaveEntityFilter = hasActiveStayEntityFilter(filters);

    this.searchFilters.set(filters);

    if (!hadEntityFilter && willHaveEntityFilter) {
      this.filteredDailyLabelsEnabled.set(false);
    }
  }

  setUnfilteredDisplayMode(displayMode: CalendarDisplayMode): void {
    this.unfilteredDisplayMode.set(displayMode);
  }

  setFilteredDailyLabelsEnabled(checked: boolean): void {
    this.filteredDailyLabelsEnabled.set(checked);
  }

  private readStoredCalendarPreferences(): CalendarLocalPreferences {
    const defaultPreferences: CalendarLocalPreferences = {
      unfilteredDisplayMode: DEFAULT_UNFILTERED_CALENDAR_DISPLAY_MODE,
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
        unfilteredDisplayMode: this.readStoredUnfilteredDisplayMode(parsedValue),
        visibleMonth: this.isDateValue(parsedValue['visibleMonth'])
          ? parsedValue['visibleMonth']
          : defaultPreferences.visibleMonth,
      };
    } catch {
      return defaultPreferences;
    }
  }

  private readStoredUnfilteredDisplayMode(value: Record<string, unknown>): CalendarDisplayMode {
    if (isCalendarDisplayMode(value['unfilteredDisplayMode'])) {
      return value['unfilteredDisplayMode'];
    }

    return toUnfilteredCalendarDisplayModeFromLegacySettings(
      value['dailyLabelsEnabled'],
      value['compactModeEnabled'],
    );
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

  private toDateValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
