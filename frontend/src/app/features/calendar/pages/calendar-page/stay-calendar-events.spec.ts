import { EventInput } from '@fullcalendar/core';

import { Stay } from '../../../stays/models/stay.model';
import { toStayCalendarEvents } from './stay-calendar-events';

describe('toStayCalendarEvents', () => {
  it('creates the existing check-in and check-out marker events in entry/exit mode', () => {
    const stay = createStay();

    const events = toStayCalendarEvents({
      visibleStays: [stay],
      colorAssignments: new Map(),
      displayMode: 'entry-exit-markers',
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
      displayMode: 'daily-labels',
    });

    expect(events).toHaveLength(3);
    expect(events.map((event) => event.start)).toEqual(['2099-06-03', '2099-06-04', '2099-06-05']);
    expect(events.every((event) => !getClassNames(event).includes('stay-event--compact'))).toBe(
      true,
    );
  });

  it('adds translated labels to entry and exit marker events', () => {
    const stay = createStay();

    const events = toStayCalendarEvents({
      visibleStays: [stay],
      colorAssignments: new Map(),
      displayMode: 'entry-exit-markers',
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
    numberOfNights: 8,
    cancelledAt: null,
    createdAt: '2099-05-01T10:00:00',
    updatedAt: '2099-05-01T10:00:00',
    notes: null,
    catIds: ['cat-1'],
    ownerId: 'owner-1',
    ownerName: 'Owner One',
    cats: [{ catId: 'cat-1', name: 'John' }],
    retainedNightlyRate: '50',
    suggestedAmount: '100',
    agreedAmount: '100',
    totalPaid: '0',
    remainingAmount: '100',
    paymentCondition: 'NO_PAYMENT',
    outstandingCollectionEligible: true,
    payments: [],
    ...overrides,
  };
}

function getClassNames(event: EventInput): string[] {
  return Array.isArray(event.classNames) ? event.classNames : [];
}
