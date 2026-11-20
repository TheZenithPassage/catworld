import { Stay } from '../../../stays/models/stay.model';
import { STAY_COLOR_PALETTE, StayCalendarColor } from './stay-calendar-colors';

export function getStayColorAssignments(stays: Stay[]): Map<string, StayCalendarColor> {
  const assignments = new Map<string, StayCalendarColor>();
  const usedColorIndexesByMonth = new Map<string, Set<number>>();

  getSortedStays(stays).forEach((stay) => {
    const monthKeys = getStayMonthKeys(stay);
    const preferredColorIndex = getPreferredColorIndex(stay.stayId);
    const colorIndex = getAvailableColorIndex(
      monthKeys,
      usedColorIndexesByMonth,
      preferredColorIndex,
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

function getSortedStays(stays: Stay[]): Stay[] {
  return [...stays].sort((firstStay, secondStay) => {
    const createdAtComparison = firstStay.createdAt.localeCompare(secondStay.createdAt);

    if (createdAtComparison !== 0) {
      return createdAtComparison;
    }

    return firstStay.stayId.localeCompare(secondStay.stayId);
  });
}

function getAvailableColorIndex(
  monthKeys: string[],
  usedColorIndexesByMonth: Map<string, Set<number>>,
  preferredColorIndex: number,
): number {
  for (let offset = 0; offset < STAY_COLOR_PALETTE.length; offset++) {
    const colorIndex = (preferredColorIndex + offset) % STAY_COLOR_PALETTE.length;

    const colorIsAvailable = monthKeys.every(
      (monthKey) => !usedColorIndexesByMonth.get(monthKey)?.has(colorIndex),
    );

    if (colorIsAvailable) {
      return colorIndex;
    }
  }

  return preferredColorIndex;
}

function getStayMonthKeys(stay: Stay): string[] {
  const monthKeys: string[] = [];

  const currentMonth = new Date(stay.startAt.slice(0, 7) + '-01');
  const lastMonth = new Date(stay.endAt.slice(0, 7) + '-01');

  while (currentMonth <= lastMonth) {
    monthKeys.push(currentMonth.toISOString().slice(0, 7));
    currentMonth.setUTCMonth(currentMonth.getUTCMonth() + 1);
  }

  return monthKeys;
}

function getPreferredColorIndex(stayId: string): number {
  let hash = 0;

  for (const character of stayId) {
    hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  }

  return hash % STAY_COLOR_PALETTE.length;
}
