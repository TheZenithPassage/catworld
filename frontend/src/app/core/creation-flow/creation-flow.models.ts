import type { StayLitterChoices } from '../../features/stays/models/stay.model';

export const CREATION_FLOW_QUERY_PARAM = 'creationFlowId';

export type CreationFlowId = string & { readonly __creationFlowId: unique symbol };
export type CreationFlowRoot = 'cat' | 'stay';
export type CreationFlowFrameKind = CreationFlowRoot;

export interface CatCreationDraft {
  name: string;
  birthDate: string;
  sex: 'MALE' | 'FEMALE' | '';
  breed: string;
  coat: string;
  color: string;
  foodBrand: string;
  foodBrandId?: string | null;
  foodDetail?: string;
  approveFoodBrand?: boolean;
  litterBrand: string;
  personality: string;
  notes: string;
  lastInternalDewormerName: string;
  lastInternalDewormingDate: string;
  lastExternalDewormerName: string;
  lastExternalDewormingDate: string;
  lastTripleFelineDate: string;
  lastRabiesDate: string;
  ownerId: string;
  vetId: string;
  photo: File | null;
}

export interface StayCreationDraft {
  ownerId: string;
  catIds: string[];
  startAt: string;
  endAt: string;
  notes: string;
  agreedAmount: string;
  pricePending?: boolean;
  pricingReason: string;
  transferAssistanceActive?: boolean;
  arrivalTransferRequired?: boolean;
  departureTransferRequired?: boolean;
  transferWaived?: boolean;
  litterChoices?: StayLitterChoices;
}

export interface CreationFlowFrames {
  cat: CatCreationDraft;
  stay: StayCreationDraft;
}

export interface CreationFlowHop {
  from: string;
  to: string;
}
