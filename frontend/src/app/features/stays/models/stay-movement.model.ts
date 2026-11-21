import type { StayOverviewStatus } from './stay.model';

export type StayMovementType = 'ARRIVAL' | 'DEPARTURE';
export type StayMovementAction =
  | 'record-arrival'
  | 'record-departure'
  | 'correct-arrival'
  | 'reset-arrival';

export interface StayActualMovement {
  occurredAt: string;
  revision: number;
  recordedBy: string;
  correctedBy: string | null;
  canEdit: boolean;
}

export interface StayActualMovements {
  startAt: string;
  endAt: string;
  cancelled: boolean;
  status: StayOverviewStatus;
  revision: number;
  arrival: StayActualMovement | null;
  departure: StayActualMovement | null;
  canRecordArrival: boolean;
  canRecordDeparture: boolean;
  canResetArrival: boolean;
  arrivalAllowsNow: boolean;
  departureAllowsNow: boolean;
}

export interface StayMovementDialogData {
  stayId: string;
  catNames: string[];
  action: StayMovementAction;
  allowHistorical: boolean;
}
