import type { StayCatSummary } from '../../stays/models/stay.model';
import type { StayMovementType } from '../../stays/services/stay-actual-movements-dialog.service';

export type AgendaMovementType = StayMovementType;

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
  actualAt?: string;
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
