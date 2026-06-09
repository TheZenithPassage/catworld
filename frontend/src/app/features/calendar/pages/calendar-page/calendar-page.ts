import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';

import { Stay } from '../../../stays/models/stay.model';
import { StayApiService } from '../../../stays/services/stay-api.service';
import { getStayColorAssignments } from './stay-calendar-color-assignments';
import { compareStayCalendarEvents, toStayCalendarEvents } from './stay-calendar-events';
import { StaySearchFiltersComponent } from '../../../stays/components/stay-search-filters/stay-search-filters';
import {
  getDefaultStaySearchFilters,
  isStayVisibleBySearchFilters,
  StaySearchFilters
} from '../../../stays/utils/stay-search-filter.util';
import {
  isStayVisibleByStatus,
  getDefaultStayStatusVisibility,
  STAY_STATUS_FILTER_OPTIONS,
  StayStatus,
  StayStatusVisibility,
} from '../../../stays/utils/stay-status.util';

@Component({
  selector: 'app-calendar-page',
  imports: [FullCalendarModule, RouterLink, StaySearchFiltersComponent],
  templateUrl: './calendar-page.html',
  styleUrl: './calendar-page.scss',
})
export class CalendarPage {
  private readonly stayApiService = inject(StayApiService);
  private readonly router = inject(Router);

  readonly stays = signal<Stay[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly statusFilterOptions = STAY_STATUS_FILTER_OPTIONS;
  readonly statusVisibility = signal<StayStatusVisibility>(getDefaultStayStatusVisibility());
  readonly dailyLabelsEnabled = signal(true);
  readonly compactModeEnabled = signal(false);
  readonly searchFilters = signal<StaySearchFilters>(getDefaultStaySearchFilters());
  readonly filteredStays = computed(() =>
    this.stays().filter(
      (stay) =>
        isStayVisibleByStatus(stay, this.statusVisibility()) &&
        isStayVisibleBySearchFilters(stay, this.searchFilters())
    )
  );

  readonly calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin],
    initialView: 'dayGridMonth',
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
    eventClick: ({ event }) => {
      const stayId = event.extendedProps['stayId'] ?? event.id;

      void this.router.navigate(['/stays'], {
        queryParams: { selectedStayId: stayId },
      });
    },
    eventDidMount: ({ el, event }) => {
      const compactMarkerLabel = event.extendedProps['compactMarkerLabel'];

      el.title =
        typeof compactMarkerLabel === 'string'
          ? `${compactMarkerLabel}. Open stay in list.`
          : 'Open stay in list';

      el.style.cursor = 'pointer';
    },
  };

  readonly calendarEvents = computed(() => {
    const colorAssignments = getStayColorAssignments(this.stays());

    return toStayCalendarEvents({
      visibleStays: this.filteredStays(),
      colorAssignments,
      dailyLabelsEnabled: this.dailyLabelsEnabled(),
      compactModeEnabled: this.compactModeEnabled(),
    });
  });

  constructor() {
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
        this.error.set('Error loading calendar');
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

  setSearchFilters(filters: StaySearchFilters): void {
    this.searchFilters.set(filters);
  }
}
