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

export interface StaySearchFilters {
  catId: string | null;
  ownerId: string | null;
}

export function getDefaultStaySearchFilters(): StaySearchFilters {
  return {
    catId: null,
    ownerId: null,
  };
}

export function isStayVisibleBySearchFilters(stay: Stay, filters: StaySearchFilters): boolean {
  if (filters.catId) {
    return stay.cats.some((cat) => cat.catId === filters.catId);
  }

  if (filters.ownerId) {
    return stay.ownerId === filters.ownerId;
  }

  return true;
}

export function hasActiveStayEntityFilter(filters: StaySearchFilters): boolean {
  return Boolean(filters.catId || filters.ownerId);
}
