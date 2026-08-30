import { Stay } from '../../../stays/models/stay.model';

export interface CalendarDailyParticipant {
  catId: string;
  catName: string;
  ownerId: string;
  ownerName: string;
  hasEntry: boolean;
  hasExit: boolean;
}

export interface CalendarDailyAggregate {
  date: string;
  participants: CalendarDailyParticipant[];
  count: number;
}

export function getCalendarDailyAggregates(visibleStays: Stay[]): CalendarDailyAggregate[] {
  const participantsByDate = new Map<string, Map<string, CalendarDailyParticipant>>();

  for (const stay of visibleStays) {
    if (stay.cancelledAt !== null) {
      continue;
    }

    const arrivalDate = toLocalDateKey(stay.startAt);
    const departureDate = toLocalDateKey(stay.endAt);

    for (const date of inclusiveDateKeys(arrivalDate, departureDate)) {
      let participants = participantsByDate.get(date);

      if (!participants) {
        participants = new Map<string, CalendarDailyParticipant>();
        participantsByDate.set(date, participants);
      }

      for (const cat of stay.cats) {
        const existing = participants.get(cat.catId);
        const hasEntry = date === arrivalDate;
        const hasExit = date === departureDate;

        if (existing) {
          existing.hasEntry ||= hasEntry;
          existing.hasExit ||= hasExit;
          continue;
        }

        participants.set(cat.catId, {
          catId: cat.catId,
          catName: cat.name,
          ownerId: stay.ownerId,
          ownerName: stay.ownerName,
          hasEntry,
          hasExit,
        });
      }
    }
  }

  return [...participantsByDate.entries()]
    .sort(([firstDate], [secondDate]) => compareText(firstDate, secondDate))
    .map(([date, participantsByCat]) => {
      const participants = [...participantsByCat.values()].sort(compareParticipants);

      return {
        date,
        participants,
        count: participants.length,
      };
    })
    .filter((aggregate) => aggregate.count > 0);
}

function toLocalDateKey(localDateTime: string): string {
  return localDateTime.slice(0, 10);
}

function* inclusiveDateKeys(firstDate: string, lastDate: string): Generator<string> {
  let currentDate = firstDate;

  while (currentDate <= lastDate) {
    yield currentDate;
    currentDate = nextDateKey(currentDate);
  }
}

function nextDateKey(date: string): string {
  const [yearValue, monthValue, dayValue] = date.split('-').map(Number);
  let year = yearValue;
  let month = monthValue;
  let day = dayValue + 1;

  if (day > daysInMonth(year, month)) {
    day = 1;
    month += 1;

    if (month > 12) {
      month = 1;
      year += 1;
    }
  }

  return `${String(year).padStart(4, '0')}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function daysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }

  return [4, 6, 9, 11].includes(month) ? 30 : 31;
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function compareParticipants(
  first: CalendarDailyParticipant,
  second: CalendarDailyParticipant,
): number {
  return (
    compareText(first.catName, second.catName) ||
    compareText(first.ownerName, second.ownerName) ||
    compareText(first.catId, second.catId) ||
    compareText(first.ownerId, second.ownerId)
  );
}

function compareText(first: string, second: string): number {
  return first < second ? -1 : first > second ? 1 : 0;
}
