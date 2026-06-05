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
