export interface Owner {
  id: string;
  canDelete?: boolean;
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

export interface OwnerLookupCat {
  id: string;
  name: string;
}

export interface OwnerLookup {
  id: string;
  fullName: string;
  currentCats: OwnerLookupCat[];
}
