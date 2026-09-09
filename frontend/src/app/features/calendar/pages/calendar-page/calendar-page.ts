import {
  afterEveryRender,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCheckbox } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatRadioModule } from '@angular/material/radio';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { Subscription } from 'rxjs';
import { RouterLink } from '@angular/router';

import { FullCalendarComponent, FullCalendarModule } from '@fullcalendar/angular';
import { CalendarOptions, DatesSetArg, EventContentArg } from '@fullcalendar/core';
import dayGridPlugin from '@fullcalendar/daygrid';
import esLocale from '@fullcalendar/core/locales/es';
import enGbLocale from '@fullcalendar/core/locales/en-gb';

import { Stay } from '../../../stays/models/stay.model';
import { StayApiService } from '../../../stays/services/stay-api.service';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import { StayStatusVisibilityPreferencesService } from '../../../stays/services/stay-status-visibility-preferences.service';
import { getStayColorAssignments } from './stay-calendar-color-assignments';
import {
  compareStayCalendarEvents,
  StayCalendarTransferIndicatorKind,
  toStayCalendarEvents,
} from './stay-calendar-events';
import { StaySearchFiltersComponent } from '../../../stays/components/stay-search-filters/stay-search-filters';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import {
  getDefaultStaySearchFilters,
  isStayDateRangeValid,
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
import { CalendarDailySummaryDialog } from './calendar-daily-summary-dialog';

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
    MatProgressSpinner,
    RouterLink,
    StaySearchFiltersComponent,
    UiStateComponent,
  ],
  templateUrl: './calendar-page.html',
  styleUrl: './calendar-page.scss',
})
export class CalendarPage implements OnDestroy {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  readonly loadingIndicator = viewChild<ElementRef<HTMLElement>>('loadingIndicator');
  private readonly calendar = viewChild(FullCalendarComponent);
  private toolbarResizeObserver?: ResizeObserver;
  private toolbarElements: HTMLElement[] = [];

  private readonly stayApiService = inject(StayApiService);
  private readonly entityDetailDialog = inject(EntityDetailDialogService);
  private readonly dialog = inject(MatDialog);
  private readonly i18nService = inject(I18nService);
  private readonly stayStatusVisibilityPreferencesService = inject(
    StayStatusVisibilityPreferencesService,
  );

  private readonly calendarPreferencesStorageKey = 'catworld.calendar.preferences';
  private readonly storedCalendarPreferences = this.readStoredCalendarPreferences();
  private stickyHeaderPositionListener: (() => void) | undefined;
  private stickyMonthElement: HTMLElement | undefined;
  private renderedEventLanguage: string | undefined;
  private readonly mountedStayEventAccessibility = new Map<
    HTMLElement,
    {
      title: string;
      compactMarkerLabel: string;
      transferIndicatorKind: StayCalendarTransferIndicatorKind | null;
    }
  >();

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
  readonly calendarStickyTop = signal(0);
  readonly compactMonthLabel = computed(() => {
    const visibleMonth = this.visibleMonth();

    if (!visibleMonth) {
      return '';
    }

    const [year, month] = visibleMonth.split('-').map(Number);
    const locale = this.i18nService.dateLocale();

    return new Intl.DateTimeFormat(locale, {
      month: 'short',
      year: 'numeric',
    })
      .format(new Date(year, month - 1, 1))
      .replaceAll('.', '')
      .toLocaleUpperCase(locale);
  });
  readonly searchFilters = signal<StaySearchFilters>(getDefaultStaySearchFilters());
  readonly draftSearchFilters = signal(this.searchFilters());
  readonly searchControls = viewChild(StaySearchFiltersComponent);
  private viewInterval: { dateFrom: string; dateTo: string } | null = null;
  private request?: Subscription;
  private requestId = 0;
  readonly filteredStays = computed(() =>
    this.stays().filter(
      (stay) =>
        isStayVisibleByStatus(stay, this.statusVisibility()) &&
        isStayVisibleBySearchFilters(stay, this.searchFilters()),
    ),
  );
  readonly dailyAggregates = computed(() =>
    getCalendarDailyAggregates(this.filteredStays(), this.i18nService.dateLocale()),
  );

  readonly calendarOptions = computed<CalendarOptions>(() => ({
    plugins: [dayGridPlugin],
    initialView: 'dayGridMonth',
    showNonCurrentDates: false,
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
      this.updateStickyMonthLabel();
      this.setViewInterval(dateInfo);
    },
    viewDidMount: ({ el }) => {
      const stickyHeader = el
        .closest('.fc')
        ?.querySelector<HTMLElement>(
          '.fc-scrollgrid-section-header.fc-scrollgrid-section-sticky > *',
        );

      if (stickyHeader) {
        this.mountStickyMonth(stickyHeader);
      }
    },
    viewWillUnmount: () => this.disconnectStickyMonth(),
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
        .subscribe(() => this.loadStays());
    },
    eventDidMount: ({ el, event }) => {
      if (event.extendedProps['eventKind'] === 'daily-count') {
        el.setAttribute('role', 'button');
        el.tabIndex = 0;
        el.style.cursor = 'pointer';
        return;
      }

      const details = {
        title: event.title,
        compactMarkerLabel:
          typeof event.extendedProps['compactMarkerLabel'] === 'string'
            ? event.extendedProps['compactMarkerLabel']
            : '',
        transferIndicatorKind: this.getTransferIndicatorKind(event.extendedProps),
      };
      this.mountedStayEventAccessibility.set(el, details);
      this.applyStayEventAccessibleLabel(el, details);

      el.style.cursor = 'pointer';
    },
    eventWillUnmount: ({ el }) => this.mountedStayEventAccessibility.delete(el),
    eventContent: (eventInfo: EventContentArg) => {
      if (eventInfo.event.extendedProps['eventKind'] !== 'daily-count') {
        const transferIndicator = eventInfo.event.extendedProps['transferIndicator'];

        if (typeof transferIndicator !== 'string' || !transferIndicator) {
          return true;
        }

        const indicator = document.createElement('span');
        indicator.className = 'stay-event__transfer-indicator';
        indicator.setAttribute('aria-hidden', 'true');
        indicator.textContent = '🚗';

        const label = document.createElement('span');
        label.className = 'fc-event-title';
        label.textContent = eventInfo.event.title;

        return { domNodes: [indicator, label] };
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
      transferIndicatorLabels: this.text().calendar.transferIndicators,
      dailyCountLabels: this.text().calendar.dailyCounts,
    });
  });

  activateDailyCount(aggregate: CalendarDailyAggregate): void {
    this.dialog.open(CalendarDailySummaryDialog, {
      data: aggregate,
      width: 'min(40rem, calc(100vw - 2rem))',
      maxWidth: 'calc(100vw - 2rem)',
      maxHeight: 'calc(100dvh - 2rem)',
      autoFocus: 'dialog',
    });
  }

  constructor() {
    afterEveryRender(() => {
      const indicator = this.loadingIndicator()?.nativeElement;
      const today = this.host.nativeElement.querySelector('.fc-today-button');
      // FullCalendar owns the toolbar and may recreate it when the locale changes.
      if (indicator && today && today.nextElementSibling !== indicator) {
        today.after(indicator);
      }
      const language = this.language();
      if (this.renderedEventLanguage !== language) {
        this.renderedEventLanguage = language;
        this.mountedStayEventAccessibility.forEach((details, element) =>
          this.applyStayEventAccessibleLabel(element, details),
        );
      }
      this.updateToolbarLayout();
    });
    effect(() => {
      this.storeCalendarPreferences({
        displayMode: this.displayMode(),
        visibleMonth: this.visibleMonth(),
      });

      this.stayStatusVisibilityPreferencesService.store(this.statusVisibility());
    });
  }

  ngOnDestroy(): void {
    this.toolbarResizeObserver?.disconnect();
    this.requestId++;
    this.request?.unsubscribe();
    this.disconnectStickyMonth();
    this.mountedStayEventAccessibility.clear();
  }

  private getTransferIndicatorKind(
    extendedProps: Record<string, unknown>,
  ): StayCalendarTransferIndicatorKind | null {
    const kind = extendedProps['transferIndicatorKind'];

    return kind === 'arrival' || kind === 'departure' || kind === 'arrival-and-departure'
      ? kind
      : null;
  }

  private applyStayEventAccessibleLabel(
    element: HTMLElement,
    details: {
      title: string;
      compactMarkerLabel: string;
      transferIndicatorKind: StayCalendarTransferIndicatorKind | null;
    },
  ): void {
    const transferIndicator =
      details.transferIndicatorKind === 'arrival'
        ? this.text().calendar.transferIndicators.arrival
        : details.transferIndicatorKind === 'departure'
          ? this.text().calendar.transferIndicators.departure
          : details.transferIndicatorKind === 'arrival-and-departure'
            ? this.text().calendar.transferIndicators.arrivalAndDeparture
            : '';
    const eventLabel = details.compactMarkerLabel
      ? `${details.compactMarkerLabel}. ${this.text().calendar.openStayInList}.`
      : this.text().calendar.openStayInList;
    const accessibleLabel = [transferIndicator, details.title, eventLabel]
      .filter(Boolean)
      .join('. ');

    element.title = accessibleLabel;
    element.setAttribute('aria-label', accessibleLabel);
  }

  private updateToolbarLayout(): void {
    const toolbar = this.host.nativeElement.querySelector<HTMLElement>('.fc-toolbar');
    const navigation = toolbar?.querySelector<HTMLElement>('.fc-toolbar-chunk:first-child');
    const title = toolbar?.querySelector<HTMLElement>('.fc-toolbar-title');
    if (!toolbar || !navigation || !title) return;

    const elements = [toolbar, navigation, title];
    if (elements.some((element, index) => element !== this.toolbarElements[index])) {
      this.toolbarResizeObserver?.disconnect();
      this.toolbarElements = elements;
      if (typeof ResizeObserver !== 'undefined') {
        this.toolbarResizeObserver = new ResizeObserver(() => this.updateToolbarLayout());
        elements.forEach((element) => this.toolbarResizeObserver!.observe(element));
      }
    }

    const width = toolbar.getBoundingClientRect().width;
    const navigationWidth = navigation.getBoundingClientRect().width;
    const gap = parseFloat(getComputedStyle(toolbar).columnGap) || 0;
    const available = Math.max(0, width - navigationWidth - gap);
    const fullTitle = this.calendar()?.getApi().view.title;
    if (!fullTitle || width === 0) return;

    // Re-measure normal typography so growth, locale and display-mode changes restore the full title.
    title.textContent = fullTitle;
    title.setAttribute('aria-label', fullTitle);
    title.style.removeProperty('font-size');
    if (title.getBoundingClientRect().width > available) {
      title.textContent = this.compactMonthLabel();
      const compactWidth = title.getBoundingClientRect().width;
      if (compactWidth > available) {
        const normalSize = parseFloat(getComputedStyle(title).fontSize);
        const minimumSize = parseFloat(getComputedStyle(document.documentElement).fontSize) * 0.75;
        title.style.fontSize = `${Math.max(minimumSize, (normalSize * available) / compactWidth)}px`;
      }
    }
    const titleWidth = title.getBoundingClientRect().width;
    const offset = Math.max(0, (width - titleWidth) / 2 - navigationWidth - gap);
    title.style.setProperty('--calendar-title-offset', `${offset}px`);
  }

  setViewInterval(info: DatesSetArg): void {
    const lastDay = new Date(info.view.currentEnd);
    lastDay.setDate(lastDay.getDate() - 1);
    const interval = {
      dateFrom: this.toDateValue(info.view.currentStart),
      dateTo: this.toDateValue(lastDay),
    };
    if (
      this.viewInterval?.dateFrom === interval.dateFrom &&
      this.viewInterval?.dateTo === interval.dateTo
    )
      return;
    this.viewInterval = interval;
    this.stays.set([]);
    this.loadStays();
  }

  loadStays(): void {
    if (!this.viewInterval) return;
    const id = ++this.requestId;
    this.request?.unsubscribe();
    this.loading.set(true);
    this.error.set(null);

    this.request = this.stayApiService
      .getStays({ ...this.viewInterval, dateMatchMode: 'OVERLAPS' })
      .subscribe({
        next: (stays) => {
          if (id !== this.requestId) return;
          this.stays.set(stays);
          this.loading.set(false);
        },
        error: () => {
          if (id !== this.requestId) return;
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
    this.draftSearchFilters.set(filters);
  }

  clearFilters(): void {
    this.searchControls()?.clear();
  }
  applyFilters(): void {
    if (
      this.searchControls()?.validateDates() === false ||
      !isStayDateRangeValid(this.draftSearchFilters())
    )
      return;
    this.searchFilters.set(this.draftSearchFilters());
    // A pending view load remains valid: its bounded population is filtered using the latest applied state.
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

  private mountStickyMonth(stickyHeader: HTMLElement): void {
    this.disconnectStickyMonth();

    const appHeader = document.querySelector<HTMLElement>('.app-header');
    const toolbar = stickyHeader.closest('.fc')?.querySelector<HTMLElement>('.fc-toolbar');
    const stickyMonth = document.createElement('div');
    stickyMonth.className = 'calendar-sticky-month';
    stickyMonth.setAttribute('aria-hidden', 'true');
    stickyHeader.prepend(stickyMonth);
    this.stickyMonthElement = stickyMonth;
    this.updateStickyMonthLabel();

    let visibilityObserver: IntersectionObserver | undefined;
    const updateStickyOffset = () => {
      const stickyTop =
        appHeader && getComputedStyle(appHeader).position === 'sticky'
          ? Math.max(0, appHeader.getBoundingClientRect().bottom)
          : 0;
      this.calendarStickyTop.set(stickyTop);
      visibilityObserver?.disconnect();
      if (toolbar && typeof IntersectionObserver !== 'undefined') {
        visibilityObserver = new IntersectionObserver(
          ([entry]) => {
            stickyMonth.classList.toggle(
              'calendar-sticky-month--visible',
              entry.boundingClientRect.bottom <= stickyTop,
            );
          },
          { rootMargin: `-${stickyTop}px 0px 0px 0px`, threshold: 0 },
        );
        visibilityObserver.observe(toolbar);
      }
    };

    const headerObserver =
      typeof ResizeObserver !== 'undefined' ? new ResizeObserver(updateStickyOffset) : undefined;
    if (appHeader) headerObserver?.observe(appHeader);
    window.addEventListener('resize', updateStickyOffset);
    this.stickyHeaderPositionListener = () => {
      window.removeEventListener('resize', updateStickyOffset);
      headerObserver?.disconnect();
      visibilityObserver?.disconnect();
    };
    updateStickyOffset();
  }

  private disconnectStickyMonth(): void {
    this.stickyHeaderPositionListener?.();
    this.stickyHeaderPositionListener = undefined;
    this.stickyMonthElement?.remove();
    this.stickyMonthElement = undefined;
    this.calendarStickyTop.set(0);
  }

  private updateStickyMonthLabel(): void {
    if (this.stickyMonthElement) {
      this.stickyMonthElement.textContent = this.compactMonthLabel();
    }
  }

  private toDateValue(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }
}
