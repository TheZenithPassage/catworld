import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';

import { Stay } from '../../../stays/models/stay.model';
import { StayApiService } from '../../../stays/services/stay-api.service';
import { STAY_COLOR_PALETTE, StayCalendarColor } from './stay-calendar-colors';
import {
  getStayStatus,
  isStayVisibleByStatus,
  getDefaultStayStatusVisibility,
  STAY_STATUS_FILTER_OPTIONS,
  StayStatus,
  StayStatusVisibility
} from '../../../stays/utils/stay-status.util';

@Component({
  selector: 'app-calendar-page',
  imports: [FullCalendarModule, RouterLink],
  templateUrl: './calendar-page.html',
  styleUrl: './calendar-page.scss'
})
export class CalendarPage {
  private readonly stayApiService = inject(StayApiService);
  private readonly router = inject(Router);

  readonly stays = signal<Stay[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly statusFilterOptions = STAY_STATUS_FILTER_OPTIONS;
  readonly statusVisibility = signal<StayStatusVisibility>(getDefaultStayStatusVisibility());

  readonly filteredStays = computed(() =>
    this.stays().filter((stay) => isStayVisibleByStatus(stay, this.statusVisibility()))
  );

  readonly calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin],
    initialView: 'dayGridMonth',
    firstDay: 1,
    height: 'auto',
    displayEventTime: false,
    displayEventEnd: false,
    dayMaxEvents: true,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: ''
    },
    eventClick: ({ event }) => {
      void this.router.navigate(['/stays'], {
        queryParams: { selectedStayId: event.id }
      });
    },
    eventDidMount: ({ el }) => {
      el.title = 'Open stay in list';
      el.style.cursor = 'pointer';
    }
  };

  readonly calendarEvents = computed<EventInput[]>(() => {
    const stays = this.stays();
    const colorAssignments = this.getColorAssignments(stays);

    return this.filteredStays().map((stay) =>
      this.toCalendarEvent(stay, colorAssignments.get(stay.stayId))
    );
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
      }
    });
  }

  isStatusVisible(status: StayStatus): boolean {
    return this.statusVisibility()[status];
  }

  setStatusVisibility(status: StayStatus, checked: boolean): void {
    this.statusVisibility.update((currentVisibility) => ({
      ...currentVisibility,
      [status]: checked
    }));
  }

  private toCalendarEvent(stay: Stay, color?: StayCalendarColor): EventInput {
    const status = getStayStatus(stay);
    const eventColor = this.getEventColor(status, color);

    return {
      id: stay.stayId,
      title: this.getEventTitle(stay),
      start: stay.startAt,
      end: stay.endAt,
      allDay: false,
      backgroundColor: eventColor.backgroundColor,
      borderColor: eventColor.borderColor,
      textColor: eventColor.textColor,
      classNames: [`stay-event--${status}`],
      extendedProps: {
        stayId: stay.stayId,
        ownerId: stay.ownerId,
        ownerName: stay.ownerName,
        catIds: stay.catIds,
        status
      }
    };
  }

  private getColorAssignments(stays: Stay[]): Map<string, StayCalendarColor> {
    const assignments = new Map<string, StayCalendarColor>();
    const usedColorIndexesByMonth = new Map<string, Set<number>>();

    this.getSortedStays(stays).forEach((stay) => {
      const monthKeys = this.getStayMonthKeys(stay);
      const preferredColorIndex = this.getPreferredColorIndex(stay.stayId);
      const colorIndex = this.getAvailableColorIndex(
        monthKeys,
        usedColorIndexesByMonth,
        preferredColorIndex
      );

      assignments.set(stay.stayId, STAY_COLOR_PALETTE[colorIndex]);

      monthKeys.forEach((monthKey) => {
        const usedColorIndexes = usedColorIndexesByMonth.get(monthKey) ?? new Set<number>();
        usedColorIndexes.add(colorIndex);
        usedColorIndexesByMonth.set(monthKey, usedColorIndexes);
      });
    });

    return assignments;
  }

  private getSortedStays(stays: Stay[]): Stay[] {
    return [...stays].sort((firstStay, secondStay) => {
      const createdAtComparison = firstStay.createdAt.localeCompare(secondStay.createdAt);

      if (createdAtComparison !== 0) {
        return createdAtComparison;
      }

      return firstStay.stayId.localeCompare(secondStay.stayId);
    });
  }

  private getAvailableColorIndex(
    monthKeys: string[],
    usedColorIndexesByMonth: Map<string, Set<number>>,
    preferredColorIndex: number
  ): number {
    for (let offset = 0; offset < STAY_COLOR_PALETTE.length; offset++) {
      const colorIndex = (preferredColorIndex + offset) % STAY_COLOR_PALETTE.length;

      const colorIsAvailable = monthKeys.every(
        (monthKey) => !usedColorIndexesByMonth.get(monthKey)?.has(colorIndex)
      );

      if (colorIsAvailable) {
        return colorIndex;
      }
    }

    return preferredColorIndex;
  }

  private getStayMonthKeys(stay: Stay): string[] {
    const startAt = new Date(stay.startAt);
    const endAt = new Date(stay.endAt);
    const monthKeys: string[] = [];

    const currentMonth = new Date(startAt.getFullYear(), startAt.getMonth(), 1);
    const lastMonth = new Date(endAt.getFullYear(), endAt.getMonth(), 1);

    while (currentMonth <= lastMonth) {
      monthKeys.push(this.getMonthKey(currentMonth));
      currentMonth.setMonth(currentMonth.getMonth() + 1);
    }

    return monthKeys;
  }

  private getPreferredColorIndex(stayId: string): number {
    let hash = 0;

    for (const character of stayId) {
      hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
    }

    return hash % STAY_COLOR_PALETTE.length;
  }

  private getMonthKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}`;
  }

  private getEventColor(
    status: StayStatus,
    color = STAY_COLOR_PALETTE[0]
  ): Pick<StayCalendarColor, 'backgroundColor' | 'borderColor' | 'textColor'> {
    if (status === 'checked-out' || status === 'cancelled') {
      return {
        backgroundColor: color.mutedBackgroundColor,
        borderColor: color.mutedBorderColor,
        textColor: color.mutedTextColor
      };
    }

    return {
      backgroundColor: color.backgroundColor,
      borderColor: color.borderColor,
      textColor: color.textColor
    };
  }

  private getEventTitle(stay: Stay): string {
    return this.getCatNames(stay);
  }

  private getCatNames(stay: Stay): string {
    return stay.cats.map((cat) => cat.name).join(', ');
  }
}