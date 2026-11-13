import type { StayCatSummary } from '../../stays/models/stay.model';

export type AgendaMovementType = 'ARRIVAL' | 'DEPARTURE';

export interface AgendaStay {
  stayId: string;
  ownerId: string;
  ownerName: string;
  cats: StayCatSummary[];
  startAt: string;
  endAt: string;
}

export interface AgendaMovement {
  type: AgendaMovementType;
  scheduledAt: string;
  transferRequired: boolean;
  stay: AgendaStay;
}

export interface AgendaDay {
  date: string;
  movements: AgendaMovement[];
}

export interface OperationsAgenda {
  date: string;
  businessDate: string;
  movements: AgendaMovement[];
  boardingStays: AgendaStay[];
  upcomingDays: AgendaDay[];
}
