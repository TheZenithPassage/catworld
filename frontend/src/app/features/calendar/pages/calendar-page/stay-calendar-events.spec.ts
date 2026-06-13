import { EventInput } from '@fullcalendar/core';

import { Stay } from '../../../stays/models/stay.model';
import { toStayCalendarEvents } from './stay-calendar-events';

describe('toStayCalendarEvents', () => {
  it('keeps the full stay span when daily labels and compact mode are disabled', () => {
    const stay = createStay();

    const events = toStayCalendarEvents({
      visibleStays: [stay],
      colorAssignments: new Map(),
      dailyLabelsEnabled: false,
      compactModeEnabled: false,
    });

    expect(events).toHaveLength(1);
    expect(events[0].id).toBe(stay.stayId);
    expect(events[0].start).toBe(stay.startAt);
    expect(events[0].end).toBe(stay.endAt);
    expect(getClassNames(events[0])).not.toContain('stay-event--compact');
  });

  it('creates check-in and check-out markers when compact mode is enabled without daily labels', () => {
    const stay = createStay();

    const events = toStayCalendarEvents({
      visibleStays: [stay],
      colorAssignments: new Map(),
      dailyLabelsEnabled: false,
      compactModeEnabled: true,
    });

    expect(events).toHaveLength(2);

    expect(events[0].id).toBe('stay-1-start-2099-06-03');
    expect(events[0].title).toBe('John');
    expect(events[0].start).toBe('2099-06-03');
    expect(events[0].allDay).toBe(true);
    expect(getClassNames(events[0])).toContain('stay-event--compact');
    expect(getClassNames(events[0])).toContain('stay-event--compact-start');

    expect(events[1].id).toBe('stay-1-end-2099-06-11');
    expect(events[1].title).toBe('John');
    expect(events[1].start).toBe('2099-06-11');
    expect(events[1].allDay).toBe(true);
    expect(getClassNames(events[1])).toContain('stay-event--compact');
    expect(getClassNames(events[1])).toContain('stay-event--compact-end');
  });

  it('keeps daily labels unchanged when compact mode is disabled', () => {
    const stay = createStay({
      startAt: '2099-06-03T10:00:00',
      endAt: '2099-06-05T10:00:00',
    });

    const events = toStayCalendarEvents({
      visibleStays: [stay],
      colorAssignments: new Map(),
      dailyLabelsEnabled: true,
      compactModeEnabled: false,
    });

    expect(events).toHaveLength(3);
    expect(events.map((event) => event.start)).toEqual(['2099-06-03', '2099-06-04', '2099-06-05']);
    expect(events.every((event) => !getClassNames(event).includes('stay-event--compact'))).toBe(
      true,
    );
  });

  it('keeps daily labels but adds compact styling when both toggles are enabled', () => {
    const stay = createStay({
      startAt: '2099-06-03T10:00:00',
      endAt: '2099-06-05T10:00:00',
    });

    const events = toStayCalendarEvents({
      visibleStays: [stay],
      colorAssignments: new Map(),
      dailyLabelsEnabled: true,
      compactModeEnabled: true,
    });

    expect(events).toHaveLength(3);
    expect(events.every((event) => getClassNames(event).includes('stay-event--compact'))).toBe(
      true,
    );
    expect(
      events.every((event) => !getClassNames(event).includes('stay-event--compact-start')),
    ).toBe(true);
    expect(events.every((event) => !getClassNames(event).includes('stay-event--compact-end'))).toBe(
      true,
    );
  });

  it('adds translated compact marker labels when compact mode is enabled without daily labels', () => {
    const stay = createStay();

    const events = toStayCalendarEvents({
      visibleStays: [stay],
      colorAssignments: new Map(),
      dailyLabelsEnabled: false,
      compactModeEnabled: true,
      compactMarkerLabels: {
        start: 'Entrada',
        end: 'Salida',
      },
    });

    expect(events).toHaveLength(2);
    expect(events[0].extendedProps?.['compactMarkerLabel']).toBe('Entrada');
    expect(events[1].extendedProps?.['compactMarkerLabel']).toBe('Salida');
  });
});

function createStay(overrides: Partial<Stay> = {}): Stay {
  return {
    stayId: 'stay-1',
    startAt: '2099-06-03T10:00:00',
    endAt: '2099-06-11T10:00:00',
    cancelledAt: null,
    createdAt: '2099-05-01T10:00:00',
    updatedAt: '2099-05-01T10:00:00',
    notes: null,
    catIds: ['cat-1'],
    ownerId: 'owner-1',
    ownerName: 'Owner One',
    cats: [{ catId: 'cat-1', name: 'John' }],
    ...overrides,
  };
}

function getClassNames(event: EventInput): string[] {
  return Array.isArray(event.classNames) ? event.classNames : [];
}
