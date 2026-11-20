import { Stay } from '../models/stay.model';

export {
  DATE_MATCH_MODES,
  isStayDateRangeValid,
  isStayVisibleByDateFilters,
} from '../../../shared/stay-date-filters/stay-date-filter.model';
export type {
  StayDateFilters,
  StayDateMatchMode,
} from '../../../shared/stay-date-filters/stay-date-filter.model';
import {
  StayDateFilters,
  isStayVisibleByDateFilters,
} from '../../../shared/stay-date-filters/stay-date-filter.model';

export interface StaySearchFilters extends StayDateFilters {
  catId: string | null;
  ownerId: string | null;
}

export function getDefaultStaySearchFilters(): StaySearchFilters {
  return {
    dateFrom: null,
    dateTo: null,
    dateMatchMode: 'OVERLAPS',
    catId: null,
    ownerId: null,
  };
}

export function isStayVisibleBySearchFilters(stay: Stay, filters: StaySearchFilters): boolean {
  return (
    (!filters.catId || stay.cats.some((cat) => cat.catId === filters.catId)) &&
    (!filters.ownerId || stay.ownerId === filters.ownerId) &&
    isStayVisibleByDateFilters(stay, filters)
  );
}

export function hasActiveStayEntityFilter(filters: StaySearchFilters): boolean {
  return Boolean(filters.catId || filters.ownerId);
}
