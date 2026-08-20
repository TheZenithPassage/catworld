export interface Vet {
  id: string;
  name: string;
  address: string | null;
  phoneNumber: string | null;
}

export interface CreateVetRequest {
  name: string;
  address: string | null;
  phoneNumber: string | null;
}

export type UpdateVetRequest = CreateVetRequest;

export interface VetLookupOption {
  readonly id: string;
  readonly name: string;
}

export interface VetLookupPage {
  readonly items: readonly VetLookupOption[];
  readonly page: number;
  readonly hasNext: boolean;
}

export const vetLookupOptionLabel = (option: VetLookupOption): string => option.name;
