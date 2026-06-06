import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, EventInput } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';

import { Stay } from '../../../stays/models/stay.model';
import { StayApiService } from '../../../stays/services/stay-api.service';
import {
  getStayStatus,
  getStayStatusLabel,
  StayStatus
} from '../../../stays/utils/stay-status.util';

@Component({
  selector: 'app-calendar-page',
  imports: [FullCalendarModule, RouterLink],
  templateUrl: './calendar-page.html',
  styleUrl: './calendar-page.scss'
})
export class CalendarPage {
  private readonly stayApiService = inject(StayApiService);

  readonly stays = signal<Stay[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly calendarOptions: CalendarOptions = {
    plugins: [dayGridPlugin],
    initialView: 'dayGridMonth',
    firstDay: 1,
    height: 'auto',
    displayEventEnd: true,
    dayMaxEvents: true,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: ''
    },
    eventTimeFormat: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }
  };

  readonly calendarEvents = computed<EventInput[]>(() =>
    this.stays().map((stay) => this.toCalendarEvent(stay))
  );

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

  private toCalendarEvent(stay: Stay): EventInput {
    const status = getStayStatus(stay);

    return {
      id: stay.stayId,
      title: this.getEventTitle(stay, status),
      start: stay.startAt,
      end: stay.endAt,
      allDay: false,
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

  private getEventTitle(stay: Stay, status: StayStatus): string {
    return `${getStayStatusLabel(status)} · ${this.getCatNames(stay)} · ${stay.ownerName}`;
  }

  private getCatNames(stay: Stay): string {
    return stay.cats.map((cat) => cat.name).join(', ');
  }
}