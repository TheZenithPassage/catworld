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
  stay: Pick<Stay, 'startAt' | 'endAt'>,
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
