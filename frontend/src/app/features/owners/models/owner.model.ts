export interface Owner {
  id: string;
  fullName: string;
  address: string | null;
  primaryPhone: string;
  secondaryPhone: string | null;
  secondaryPhoneName: string | null;
  instagram: string | null;
  facebook: string | null;
}

export interface CreateOwnerRequest {
  fullName: string;
  address: string | null;
  primaryPhone: string;
  secondaryPhone: string | null;
  secondaryPhoneName: string | null;
  instagram: string | null;
  facebook: string | null;
}

export type UpdateOwnerRequest = CreateOwnerRequest;
