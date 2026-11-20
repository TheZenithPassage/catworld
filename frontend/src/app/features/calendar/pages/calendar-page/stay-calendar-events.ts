import { EventInput } from '@fullcalendar/core';

import { Stay } from '../../../stays/models/stay.model';
import { getStayStatus, StayStatus } from '../../../stays/utils/stay-status.util';
import { STAY_COLOR_PALETTE, StayCalendarColor } from './stay-calendar-colors';
import { CalendarDisplayMode } from './calendar-display-mode';
import { CalendarDailyAggregate } from './calendar-daily-aggregate';

type CompactMarkerKind = 'start' | 'end';

export type StayCalendarCompactMarkerLabels = Record<CompactMarkerKind, string>;

export interface StayCalendarTransferIndicatorLabels {
  arrival: string;
  departure: string;
  arrivalAndDeparture: string;
}

export type StayCalendarTransferIndicatorKind = 'arrival' | 'departure' | 'arrival-and-departure';

export type StayCalendarBoundaryKind = 'arrival' | 'departure' | 'arrival-and-departure';

const ARRIVAL_MARKER_COLOR = {
  backgroundColor: '#15803d',
  borderColor: '#166534',
  textColor: '#ffffff',
};

const DEPARTURE_MARKER_COLOR = {
  backgroundColor: '#b42318',
  borderColor: '#912018',
  textColor: '#ffffff',
};

export interface DailyCountEventLabels {
  singular: string;
  plural: string;
  accessibleSingular: string;
  accessiblePlural: string;
}

const EMPTY_COMPACT_MARKER_LABELS: StayCalendarCompactMarkerLabels = {
  start: '',
  end: '',
};

const EMPTY_TRANSFER_INDICATOR_LABELS: StayCalendarTransferIndicatorLabels = {
  arrival: '',
  departure: '',
  arrivalAndDeparture: '',
};

interface ToStayCalendarEventsParams {
  visibleStays: Stay[];
  businessNow: string;
  dailyAggregates?: CalendarDailyAggregate[];
  colorAssignments: Map<string, StayCalendarColor>;
  displayMode: CalendarDisplayMode;
  compactMarkerLabels?: StayCalendarCompactMarkerLabels;
  transferIndicatorLabels?: StayCalendarTransferIndicatorLabels;
  dailyCountLabels?: DailyCountEventLabels;
}

export function toStayCalendarEvents({
  visibleStays,
  businessNow,
  dailyAggregates = [],
  colorAssignments,
  displayMode,
  compactMarkerLabels = EMPTY_COMPACT_MARKER_LABELS,
  transferIndicatorLabels = EMPTY_TRANSFER_INDICATOR_LABELS,
  dailyCountLabels,
}: ToStayCalendarEventsParams): EventInput[] {
  if (displayMode === 'daily-counts') {
    return dailyCountLabels
      ? dailyAggregates
          .filter((aggregate) => aggregate.count > 0)
          .map((aggregate) => toDailyCountEvent(aggregate, dailyCountLabels))
      : [];
  }

  if (displayMode === 'daily-labels') {
    return visibleStays.flatMap((stay) =>
      toDailyCalendarEvents(
        stay,
        getStayStatus(stay, businessNow),
        colorAssignments.get(stay.stayId),
        transferIndicatorLabels,
      ),
    );
  }

  return visibleStays.flatMap((stay) =>
    toCompactCalendarEvents(
      stay,
      getStayStatus(stay, businessNow),
      compactMarkerLabels,
      transferIndicatorLabels,
    ),
  );
}

function toDailyCountEvent(
  aggregate: CalendarDailyAggregate,
  labels: DailyCountEventLabels,
): EventInput {
  const title = formatCountLabel(
    aggregate.count === 1 ? labels.singular : labels.plural,
    aggregate.count,
  );
  const accessibleName = formatCountLabel(
    aggregate.count === 1 ? labels.accessibleSingular : labels.accessiblePlural,
    aggregate.count,
  );

  return {
    id: `daily-count-${aggregate.date}`,
    title,
    start: aggregate.date,
    allDay: true,
    classNames: ['daily-count-event'],
    extendedProps: {
      eventKind: 'daily-count',
      dailyAggregate: aggregate,
      dailyCountAccessibleName: accessibleName,
      dailyCountNumeral: String(aggregate.count),
    },
  };
}

function formatCountLabel(template: string, count: number): string {
  return template.replace('{{count}}', String(count));
}

export function compareStayCalendarEvents(firstEvent: unknown, secondEvent: unknown): number {
  const startComparison = compareEventStringProp(firstEvent, secondEvent, 'stayStartAt');

  if (startComparison !== 0) {
    return startComparison;
  }

  const durationComparison =
    getEventNumberProp(secondEvent, 'stayDurationDays') -
    getEventNumberProp(firstEvent, 'stayDurationDays');

  if (durationComparison !== 0) {
    return durationComparison;
  }

  const markerComparison =
    getEventNumberProp(firstEvent, 'compactMarkerOrder') -
    getEventNumberProp(secondEvent, 'compactMarkerOrder');

  if (markerComparison !== 0) {
    return markerComparison;
  }

  const createdAtComparison = compareEventStringProp(firstEvent, secondEvent, 'stayCreatedAt');

  if (createdAtComparison !== 0) {
    return createdAtComparison;
  }

  return getEventTitleProp(firstEvent).localeCompare(getEventTitleProp(secondEvent));
}

function toCompactCalendarEvents(
  stay: Stay,
  status: StayStatus,
  compactMarkerLabels: StayCalendarCompactMarkerLabels,
  transferIndicatorLabels: StayCalendarTransferIndicatorLabels,
): EventInput[] {
  return [
    toCompactCalendarEvent(
      stay,
      stay.startAt.slice(0, 10),
      status,
      'start',
      compactMarkerLabels,
      transferIndicatorLabels,
    ),
    toCompactCalendarEvent(
      stay,
      stay.endAt.slice(0, 10),
      status,
      'end',
      compactMarkerLabels,
      transferIndicatorLabels,
    ),
  ];
}

function toCompactCalendarEvent(
  stay: Stay,
  dateValue: string,
  status: StayStatus,
  markerKind: CompactMarkerKind,
  compactMarkerLabels: StayCalendarCompactMarkerLabels,
  transferIndicatorLabels: StayCalendarTransferIndicatorLabels,
): EventInput {
  const eventColor = markerKind === 'start' ? ARRIVAL_MARKER_COLOR : DEPARTURE_MARKER_COLOR;

  return {
    id: `${stay.stayId}-${markerKind}-${dateValue}`,
    groupId: stay.stayId,
    title: getEventTitle(stay),
    start: dateValue,
    allDay: true,
    backgroundColor: eventColor.backgroundColor,
    borderColor: eventColor.borderColor,
    textColor: eventColor.textColor,
    classNames: getStayEventClassNames(status, [
      'stay-event--compact',
      `stay-event--compact-${markerKind}`,
    ]),
    extendedProps: {
      stayId: stay.stayId,
      status,
      stayStartAt: stay.startAt,
      stayCreatedAt: stay.createdAt,
      stayDurationDays: getStayDurationDays(stay),
      compactMarkerKind: markerKind,
      compactMarkerOrder: getCompactMarkerOrder(markerKind),
      compactMarkerLabel: compactMarkerLabels[markerKind],
      boundaryKind: getBoundaryKind(markerKind === 'start', markerKind === 'end'),
      transferIndicator: getTransferIndicator(
        stay,
        markerKind === 'start',
        markerKind === 'end',
        transferIndicatorLabels,
      ),
      transferIndicatorKind: getTransferIndicatorKind(
        stay,
        markerKind === 'start',
        markerKind === 'end',
      ),
    },
  };
}

function toDailyCalendarEvents(
  stay: Stay,
  status: StayStatus,
  color: StayCalendarColor | undefined,
  transferIndicatorLabels: StayCalendarTransferIndicatorLabels,
): EventInput[] {
  const currentDate = new Date(stay.startAt.slice(0, 10));
  const lastDate = new Date(stay.endAt.slice(0, 10));
  const events: EventInput[] = [];

  while (currentDate <= lastDate) {
    events.push(
      toCalendarEventForDate(
        stay,
        currentDate.toISOString().slice(0, 10),
        status,
        color,
        transferIndicatorLabels,
      ),
    );
    currentDate.setUTCDate(currentDate.getUTCDate() + 1);
  }

  return events;
}

function toCalendarEventForDate(
  stay: Stay,
  dateValue: string,
  status: StayStatus,
  color: StayCalendarColor | undefined,
  transferIndicatorLabels: StayCalendarTransferIndicatorLabels,
): EventInput {
  const eventColor = getEventColor(status, color);
  const isArrivalBoundary = dateValue === stay.startAt.slice(0, 10);
  const isDepartureBoundary = dateValue === stay.endAt.slice(0, 10);

  return {
    id: `${stay.stayId}-${dateValue}`,
    groupId: stay.stayId,
    title: getEventTitle(stay),
    start: dateValue,
    allDay: true,
    backgroundColor: eventColor.backgroundColor,
    borderColor: eventColor.borderColor,
    textColor: eventColor.textColor,
    classNames: getStayEventClassNames(status),
    extendedProps: {
      stayId: stay.stayId,
      status,
      stayStartAt: stay.startAt,
      stayCreatedAt: stay.createdAt,
      stayDurationDays: getStayDurationDays(stay),
      boundaryKind: getBoundaryKind(isArrivalBoundary, isDepartureBoundary),
      transferIndicator: getTransferIndicator(
        stay,
        isArrivalBoundary,
        isDepartureBoundary,
        transferIndicatorLabels,
      ),
      transferIndicatorKind: getTransferIndicatorKind(stay, isArrivalBoundary, isDepartureBoundary),
    },
  };
}

function getBoundaryKind(
  isArrivalBoundary: boolean,
  isDepartureBoundary: boolean,
): StayCalendarBoundaryKind | null {
  if (isArrivalBoundary && isDepartureBoundary) {
    return 'arrival-and-departure';
  }

  if (isArrivalBoundary) {
    return 'arrival';
  }

  return isDepartureBoundary ? 'departure' : null;
}

function getTransferIndicator(
  stay: Stay,
  isArrivalBoundary: boolean,
  isDepartureBoundary: boolean,
  labels: StayCalendarTransferIndicatorLabels,
): string {
  if (
    isArrivalBoundary &&
    isDepartureBoundary &&
    stay.arrivalTransferRequired === true &&
    stay.departureTransferRequired === true
  ) {
    return labels.arrivalAndDeparture;
  }

  if (isArrivalBoundary && stay.arrivalTransferRequired === true) {
    return labels.arrival;
  }

  if (isDepartureBoundary && stay.departureTransferRequired === true) {
    return labels.departure;
  }

  return '';
}

function getTransferIndicatorKind(
  stay: Stay,
  isArrivalBoundary: boolean,
  isDepartureBoundary: boolean,
): StayCalendarTransferIndicatorKind | null {
  if (
    isArrivalBoundary &&
    isDepartureBoundary &&
    stay.arrivalTransferRequired === true &&
    stay.departureTransferRequired === true
  ) {
    return 'arrival-and-departure';
  }

  if (isArrivalBoundary && stay.arrivalTransferRequired === true) {
    return 'arrival';
  }

  return isDepartureBoundary && stay.departureTransferRequired === true ? 'departure' : null;
}

function getCatNames(stay: Stay): string {
  return stay.cats.map((cat) => cat.name).join(', ');
}

function getEventTitle(stay: Stay): string {
  return getCatNames(stay);
}

function getStayEventClassNames(status: StayStatus, extraClassNames: string[] = []): string[] {
  return [`stay-event--${status}`, ...extraClassNames];
}

function getCompactMarkerOrder(markerKind: CompactMarkerKind): number {
  return markerKind === 'start' ? 1 : 2;
}

function getEventColor(
  status: StayStatus,
  color = STAY_COLOR_PALETTE[0],
): Pick<StayCalendarColor, 'backgroundColor' | 'borderColor' | 'textColor'> {
  if (status === 'checked-out' || status === 'cancelled') {
    return {
      backgroundColor: color.mutedBackgroundColor,
      borderColor: color.mutedBorderColor,
      textColor: color.mutedTextColor,
    };
  }

  return {
    backgroundColor: color.backgroundColor,
    borderColor: color.borderColor,
    textColor: color.textColor,
  };
}

function getStayDurationDays(stay: Stay): number {
  const startDay = Date.parse(stay.startAt.slice(0, 10));
  const endDay = Date.parse(stay.endAt.slice(0, 10));
  return (endDay - startDay) / 86_400_000 + 1;
}

function compareEventStringProp(
  firstEvent: unknown,
  secondEvent: unknown,
  propertyName: string,
): number {
  return getEventStringProp(firstEvent, propertyName).localeCompare(
    getEventStringProp(secondEvent, propertyName),
  );
}

function getEventStringProp(event: unknown, propertyName: string): string {
  const value = getEventExtendedProp(event, propertyName);

  return typeof value === 'string' ? value : '';
}

function getEventNumberProp(event: unknown, propertyName: string): number {
  const value = getEventExtendedProp(event, propertyName);

  return typeof value === 'number' ? value : 0;
}

function getEventTitleProp(event: unknown): string {
  if (
    typeof event === 'object' &&
    event !== null &&
    'title' in event &&
    typeof event.title === 'string'
  ) {
    return event.title;
  }

  return '';
}

function getEventExtendedProp(event: unknown, propertyName: string): unknown {
  if (
    typeof event !== 'object' ||
    event === null ||
    !('extendedProps' in event) ||
    typeof event.extendedProps !== 'object' ||
    event.extendedProps === null
  ) {
    return null;
  }

  return (event.extendedProps as Record<string, unknown>)[propertyName];
}
