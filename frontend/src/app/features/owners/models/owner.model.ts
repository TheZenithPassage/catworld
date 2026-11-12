export interface Owner {
  id: string;
  canDelete?: boolean;
  deceased?: boolean;
  fullName: string;
  address: string | null;
  primaryPhone: string;
  secondaryPhone: string | null;
  secondaryPhoneName: string | null;
  instagram: string | null;
  facebook: string | null;
  notes: string | null;
}

export interface CreateOwnerRequest {
  fullName: string;
  address: string | null;
  primaryPhone: string;
  secondaryPhone: string | null;
  secondaryPhoneName: string | null;
  instagram: string | null;
  facebook: string | null;
  notes: string | null;
}

export interface UpdateOwnerRequest extends CreateOwnerRequest {
  deceased?: boolean;
}

export interface OwnerLookupCat {
  id: string;
  name: string;
  deceased?: boolean;
}

export interface OwnerLookup {
  id: string;
  fullName: string;
  deceased?: boolean;
  currentCats: OwnerLookupCat[];
}

export interface OwnerOverviewItem {
  id: string;
  fullName: string;
  deceased?: boolean;
  cats: OwnerLookupCat[];
}
