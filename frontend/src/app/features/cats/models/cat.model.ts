export type Sex = 'MALE' | 'FEMALE';

export interface Cat {
  id: string;
  name: string;
  birthDate: string;
  sex: Sex;
  breed: string | null;
  coat: string | null;
  color: string | null;
  foodBrand: string | null;
  litterBrand: string | null;
  personality: string | null;
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
