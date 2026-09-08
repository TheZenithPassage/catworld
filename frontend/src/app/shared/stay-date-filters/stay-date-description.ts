import { StayDateFilters, StayDateMatchMode } from './stay-date-filter.model';

export type StayDateDescriptions = Record<
  StayDateMatchMode,
  {
    both: (from: string, to: string) => string;
    sameDay: (date: string) => string;
    from: (date: string) => string;
    to: (date: string) => string;
  }
>;

/** Select the shared calendar relationship's localized semantic variant. */
export function describeStayDates(
  filters: StayDateFilters,
  descriptions: StayDateDescriptions,
  format: (date: string) => string,
): string | undefined {
  const { dateFrom, dateTo, dateMatchMode = 'OVERLAPS' } = filters;
  if (!dateFrom && !dateTo) return undefined;
  const copy = descriptions[dateMatchMode];
  if (dateFrom && dateFrom === dateTo) return copy.sameDay(format(dateFrom));
  if (dateFrom && dateTo) return copy.both(format(dateFrom), format(dateTo));
  return dateFrom ? copy.from(format(dateFrom)) : copy.to(format(dateTo!));
}
