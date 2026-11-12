import { Stay } from '../models/stay.model';

export type StayStatus = 'cancelled' | 'checked-out' | 'checked-in' | 'reserved';

type StayDates = Pick<Stay, 'startAt' | 'endAt' | 'cancelledAt'>;

export function getStayStatus(stay: StayDates, businessNow: string): StayStatus {
  if (stay.cancelledAt) {
    return 'cancelled';
  }

  // Treat the wall-clock values as UTC solely to compare their calendar fields.
  const now = Date.parse(businessNow + 'Z');
  const startAt = Date.parse(stay.startAt + 'Z');
  const endAt = Date.parse(stay.endAt + 'Z');

  if (endAt <= now) {
    return 'checked-out';
  }

  if (startAt <= now && endAt > now) {
    return 'checked-in';
  }

  return 'reserved';
}

export function canModifyStay(stay: StayDates, businessNow: string): boolean {
  const status = getStayStatus(stay, businessNow);

  return status !== 'cancelled' && status !== 'checked-out';
}

export type StayStatusVisibility = Record<StayStatus, boolean>;

export interface StayStatusFilterOption {
  status: StayStatus;
}

export const STAY_STATUS_FILTER_OPTIONS: StayStatusFilterOption[] = [
  {
    status: 'reserved',
  },
  {
    status: 'checked-in',
  },
  {
    status: 'checked-out',
  },
  {
    status: 'cancelled',
  },
];

export function getDefaultStayStatusVisibility(): StayStatusVisibility {
  return {
    reserved: true,
    'checked-in': true,
    'checked-out': false,
    cancelled: false,
  };
}

export function isStayVisibleByStatus(
  stay: StayDates,
  statusVisibility: StayStatusVisibility,
  businessNow: string,
): boolean {
  return statusVisibility[getStayStatus(stay, businessNow)];
}
