import { Stay } from '../models/stay.model';

export type StayStatus = 'cancelled' | 'checked-out' | 'checked-in' | 'reserved';

export function getStayStatus(stay: Pick<Stay, 'startAt' | 'endAt' | 'cancelledAt'>): StayStatus {
  if (stay.cancelledAt) {
    return 'cancelled';
  }

  const now = new Date();
  const startAt = new Date(stay.startAt);
  const endAt = new Date(stay.endAt);

  if (endAt <= now) {
    return 'checked-out';
  }

  if (startAt <= now && endAt > now) {
    return 'checked-in';
  }

  return 'reserved';
}

export function canModifyStay(stay: Pick<Stay, 'startAt' | 'endAt' | 'cancelledAt'>): boolean {
  const status = getStayStatus(stay);

  return status !== 'cancelled' && status !== 'checked-out';
}

export function canCancelStay(stay: Pick<Stay, 'startAt' | 'endAt' | 'cancelledAt'>): boolean {
  return canModifyStay(stay);
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
  stay: Pick<Stay, 'startAt' | 'endAt' | 'cancelledAt'>,
  statusVisibility: StayStatusVisibility,
): boolean {
  return statusVisibility[getStayStatus(stay)];
}
