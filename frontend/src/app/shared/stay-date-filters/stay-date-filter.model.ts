export const DATE_MATCH_MODES = ['OVERLAPS', 'STAY_WITHIN_RANGE', 'RANGE_WITHIN_STAY'] as const;
export type StayDateMatchMode = (typeof DATE_MATCH_MODES)[number];
export interface StayDateFilters {
  dateFrom?: string | null;
  dateTo?: string | null;
  dateMatchMode?: StayDateMatchMode;
}

export function isStayDateRangeValid(filters: StayDateFilters): boolean {
  return !filters.dateFrom || !filters.dateTo || filters.dateFrom <= filters.dateTo;
}

export function isStayVisibleByDateFilters(
  stay: { startAt: string; endAt: string },
  filters: StayDateFilters,
): boolean {
  const from = filters.dateFrom;
  const to = filters.dateTo;
  if (!from && !to) return true;
  const start = stay.startAt.slice(0, 10);
  const end = stay.endAt.slice(0, 10);
  switch (filters.dateMatchMode ?? 'OVERLAPS') {
    case 'OVERLAPS':
      return (!from || end >= from) && (!to || start <= to);
    case 'STAY_WITHIN_RANGE':
      return (!from || start >= from) && (!to || end <= to);
    case 'RANGE_WITHIN_STAY':
      return start <= (from || to!) && end >= (to || from!);
  }
}
