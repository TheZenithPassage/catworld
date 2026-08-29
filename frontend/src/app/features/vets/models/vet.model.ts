export interface Vet {
  id: string;
  canDelete?: boolean;
  name: string;
  address: string | null;
  phoneNumber: string | null;
  registrationNumber: string | null;
  notes: string | null;
}

export interface CreateVetRequest {
  name: string;
  address: string | null;
  phoneNumber: string | null;
  registrationNumber: string | null;
  notes: string | null;
}

export type UpdateVetRequest = CreateVetRequest;

export interface VetLookup {
  id: string;
  name: string;
}
