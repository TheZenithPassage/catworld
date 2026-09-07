import { PaymentCondition, Stay } from '../models/stay.model';

export const PAYMENT_CONDITION_FILTER_OPTIONS: readonly PaymentCondition[] = [
  'NO_PAYMENT',
  'PARTIAL_PAYMENT',
  'FULL_PAYMENT',
];

export type PaymentConditionVisibility = Record<PaymentCondition, boolean>;

export interface StayPaymentFilters {
  conditionVisibility: PaymentConditionVisibility;
  outstandingOnly: boolean;
}

export function getDefaultStayPaymentFilters(): StayPaymentFilters {
  return {
    conditionVisibility: {
      NO_PAYMENT: true,
      PARTIAL_PAYMENT: true,
      FULL_PAYMENT: true,
    },
    outstandingOnly: false,
  };
}

export function isStayVisibleByPaymentFilters(stay: Stay, filters: StayPaymentFilters): boolean {
  return (
    filters.conditionVisibility[stay.paymentCondition] &&
    (!filters.outstandingOnly || stay.outstandingCollectionEligible)
  );
}

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
