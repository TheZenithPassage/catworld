export type Sex = 'MALE' | 'FEMALE';

export interface Cat {
  id: string;
  canDelete?: boolean;
  name: string;
  birthDate: string;
  sex: Sex;
  breed: string | null;
  coat: string | null;
  color: string | null;
  foodBrand: string | null;
  litterBrand: string | null;
  personality: string | null;
  notes: string | null;
  lastInternalDewormerName: string | null;
  lastInternalDewormingDate: string | null;
  lastExternalDewormerName: string | null;
  lastExternalDewormingDate: string | null;
  lastTripleFelineDate: string | null;
  lastRabiesDate: string | null;
  ownerId: string;
  ownerName: string;
  vetId: string | null;
  vetName: string | null;
  hasPhoto: boolean;
}

export interface CreateCatRequest {
  name: string;
  birthDate: string;
  sex: Sex;
  breed: string | null;
  coat: string | null;
  color: string | null;
  foodBrand: string | null;
  litterBrand: string | null;
  personality: string | null;
  notes: string | null;
  lastInternalDewormerName: string | null;
  lastInternalDewormingDate: string | null;
  lastExternalDewormerName: string | null;
  lastExternalDewormingDate: string | null;
  lastTripleFelineDate: string | null;
  lastRabiesDate: string | null;
  ownerId: string;
  vetId: string | null;
}

export type UpdateCatRequest = CreateCatRequest;

export interface CatPhotoMutation {
  photo: File | null;
  removePhoto: boolean;
}

export interface CatLookup {
  id: string;
  name: string;
  ownerId: string;
  ownerName: string;
}
