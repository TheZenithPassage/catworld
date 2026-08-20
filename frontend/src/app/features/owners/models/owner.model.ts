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

export interface OwnerLookupOption {
  id: string;
  fullName: string;
  catNames: string[];
}

export interface OwnerLookupPage {
  items: OwnerLookupOption[];
  page: number;
  hasNext: boolean;
}

export function ownerLookupLabel(option: OwnerLookupOption): string {
  return option.catNames.length > 0
    ? `${option.fullName} (${option.catNames.join(', ')})`
    : option.fullName;
}
