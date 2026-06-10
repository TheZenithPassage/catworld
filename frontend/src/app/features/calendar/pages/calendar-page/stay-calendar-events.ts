import { EventInput } from '@fullcalendar/core';

import { Stay } from '../../../stays/models/stay.model';
import { getStayStatus, StayStatus } from '../../../stays/utils/stay-status.util';
import { STAY_COLOR_PALETTE, StayCalendarColor } from './stay-calendar-colors';

type CompactMarkerKind = 'start' | 'end';

export type StayCalendarCompactMarkerLabels = Record<CompactMarkerKind, string>;

const EMPTY_COMPACT_MARKER_LABELS: StayCalendarCompactMarkerLabels = {
  start: '',
  end: '',
};

interface ToStayCalendarEventsParams {
  visibleStays: Stay[];
  colorAssignments: Map<string, StayCalendarColor>;
  dailyLabelsEnabled: boolean;
  compactModeEnabled: boolean;
  compactMarkerLabels?: StayCalendarCompactMarkerLabels;
}

export function toStayCalendarEvents({
  visibleStays,
  colorAssignments,
  dailyLabelsEnabled,
  compactModeEnabled,
  compactMarkerLabels = EMPTY_COMPACT_MARKER_LABELS,
}: ToStayCalendarEventsParams): EventInput[] {
  if (dailyLabelsEnabled) {
    return visibleStays.flatMap((stay) =>
      toDailyCalendarEvents(stay, colorAssignments.get(stay.stayId), compactModeEnabled),
    );
  }

  if (compactModeEnabled) {
    return visibleStays.flatMap((stay) =>
      toCompactCalendarEvents(stay, colorAssignments.get(stay.stayId), compactMarkerLabels),
    );
  }

  return visibleStays.map((stay) => toCalendarEvent(stay, colorAssignments.get(stay.stayId)));
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

function toCalendarEvent(stay: Stay, color?: StayCalendarColor): EventInput {
  const status = getStayStatus(stay);
  const eventColor = getEventColor(status, color);

  return {
    id: stay.stayId,
    title: getEventTitle(stay),
    start: stay.startAt,
    end: stay.endAt,
    allDay: false,
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
    },
  };
}

function toCompactCalendarEvents(
  stay: Stay,
  color: StayCalendarColor | undefined,
  compactMarkerLabels: StayCalendarCompactMarkerLabels,
): EventInput[] {
  return [
    toCompactCalendarEvent(stay, new Date(stay.startAt), 'start', color, compactMarkerLabels),
    toCompactCalendarEvent(stay, new Date(stay.endAt), 'end', color, compactMarkerLabels),
  ];
}

function toCompactCalendarEvent(
  stay: Stay,
  date: Date,
  markerKind: CompactMarkerKind,
  color: StayCalendarColor | undefined,
  compactMarkerLabels: StayCalendarCompactMarkerLabels,
): EventInput {
  const status = getStayStatus(stay);
  const eventColor = getEventColor(status, color);
  const dateValue = toDateValue(date);

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
    },
  };
}

function toDailyCalendarEvents(
  stay: Stay,
  color: StayCalendarColor | undefined,
  compactModeEnabled: boolean,
): EventInput[] {
  const startDate = new Date(stay.startAt);
  const endDate = new Date(stay.endAt);
  const events: EventInput[] = [];

  const currentDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());
  const lastDate = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  while (currentDate <= lastDate) {
    events.push(toCalendarEventForDate(stay, currentDate, color, compactModeEnabled));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return events;
}

function toCalendarEventForDate(
  stay: Stay,
  date: Date,
  color: StayCalendarColor | undefined,
  compactModeEnabled: boolean,
): EventInput {
  const status = getStayStatus(stay);
  const eventColor = getEventColor(status, color);
  const dateValue = toDateValue(date);

  return {
    id: `${stay.stayId}-${dateValue}`,
    groupId: stay.stayId,
    title: getEventTitle(stay),
    start: dateValue,
    allDay: true,
    backgroundColor: eventColor.backgroundColor,
    borderColor: eventColor.borderColor,
    textColor: eventColor.textColor,
    classNames: getStayEventClassNames(status, compactModeEnabled ? ['stay-event--compact'] : []),
    extendedProps: {
      stayId: stay.stayId,
      status,
      stayStartAt: stay.startAt,
      stayCreatedAt: stay.createdAt,
      stayDurationDays: getStayDurationDays(stay),
    },
  };
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
  const startDate = new Date(stay.startAt);
  const endDate = new Date(stay.endAt);

  const startDay = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  const endDay = new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate());

  const millisecondsPerDay = 24 * 60 * 60 * 1000;

  return Math.floor((endDay.getTime() - startDay.getTime()) / millisecondsPerDay) + 1;
}

function toDateValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
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
