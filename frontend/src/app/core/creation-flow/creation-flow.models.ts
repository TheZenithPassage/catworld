import type {
  CatCatalogSelection,
  CatLitterPreference,
} from '../../features/cats/models/cat.model';

export const CREATION_FLOW_QUERY_PARAM = 'creationFlowId';

export type CreationFlowId = string & { readonly __creationFlowId: unique symbol };
export type CreationFlowRoot = 'cat' | 'stay';
export type CreationFlowFrameKind = CreationFlowRoot;

export interface CatCreationDraft {
  name: string;
  birthDate: string;
  birthYear?: string;
  yearOnly?: boolean;
  sex: 'MALE' | 'FEMALE' | '';
  breed: string;
  coat: string;
  color: string;
  foodBrand: string;
  foodDetail?: string;
  catalogSelection?: CatCatalogSelection;
  litterBrand: string;
  litterPreference?: CatLitterPreference | null;
  personality: string;
  careInstructions?: string;
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
  informationalPhotos?: File[];
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
}

export interface CreationFlowFrames {
  cat: CatCreationDraft;
  stay: StayCreationDraft;
}

export interface CreationFlowHop {
  from: string;
  to: string;
}
