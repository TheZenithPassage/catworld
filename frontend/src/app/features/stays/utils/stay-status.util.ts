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

export function getStayStatusLabel(status: StayStatus): string {
  switch (status) {
    case 'cancelled':
      return 'Cancelled';
    case 'checked-out':
      return 'Checked-out';
    case 'checked-in':
      return 'Checked-in';
    case 'reserved':
      return 'Reserved';
  }
}

export function canModifyStay(stay: Pick<Stay, 'startAt' | 'endAt' | 'cancelledAt'>): boolean {
  const status = getStayStatus(stay);

  return status !== 'cancelled' && status !== 'checked-out';
}

export function canCancelStay(stay: Pick<Stay, 'startAt' | 'endAt' | 'cancelledAt'>): boolean {
  return canModifyStay(stay);
}