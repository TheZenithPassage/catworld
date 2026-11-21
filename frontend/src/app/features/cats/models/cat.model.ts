import type { CatProfileOptionFieldKey } from '../../../shared/cat-profile-options/cat-profile-options.service';

export type Sex = 'MALE' | 'FEMALE';

export type CatCatalogSelectionField =
  | Exclude<CatProfileOptionFieldKey, 'coat' | 'color'>
  | 'foodDetail';
export type CatCatalogSelection = Partial<Record<CatCatalogSelectionField, string>>;
export type CatCatalogText = Partial<Record<CatCatalogSelectionField, string>>;

export const CAT_COAT_LENGTHS = ['Corto', 'Largo', 'Sin pelo'] as const;

export type CatLitterPreference = 'OWN' | 'SHARED';

export const CATWORLD_LITTER = 'Usa las de CatWorld';
export const OWN_LITTER = 'Trae sus propias piedritas';

export interface FoodBrandOption {
  id: string;
  name: string;
}

export interface CatInformationalPhoto {
  id: string;
  createdAt: string;
}

export interface CatPhotoViewRequest {
  catId: string;
  catName: string;
  ownerName: string;
  informationalPhotoId?: string;
}

export interface Cat {
  id: string;
  updatedAt: string;
  canDelete?: boolean;
  deceased?: boolean;
  name: string;
  birthDate: string | null;
  birthYear?: number | null;
  sex: Sex;
  breed: string | null;
  coat: string | null;
  color: string | null;
  foodBrand: string | null;
  foodBrandId?: string | null;
  catalogOptionIds?: Partial<Record<CatProfileOptionFieldKey | 'foodDetail', string>>;
  foodDetail?: string | null;
  litterBrand: string | null;
  litterPreference?: CatLitterPreference | null;
  litterDetail?: string | null;
  personality: string | null;
  careInstructions?: string | null;
  notes: string | null;
  lastInternalDewormerName: string | null;
  lastInternalDewormingDate: string | null;
  lastExternalDewormerName: string | null;
  lastExternalDewormingDate: string | null;
  lastTripleFelineDate: string | null;
  lastRabiesDate: string | null;
  ownerId: string;
  ownerName: string;
  ownerDeceased?: boolean;
  vetId: string | null;
  vetName: string | null;
  hasPhoto: boolean;
}

export interface CreateCatRequest {
  name: string;
  birthDate: string | null;
  birthYear?: number | null;
  sex: Sex;
  breed: string | null;
  coat: string | null;
  color: string | null;
  foodBrand?: string | null;
  foodBrandId?: string;
  foodDetail?: string | null;
  foodVarietyId?: string;
  confirmedCatalogText?: CatCatalogText;
  catalogOptionIds?: Partial<
    Record<Exclude<CatCatalogSelectionField, 'foodBrand' | 'foodDetail'>, string>
  >;
  litterBrand?: string | null;
  litterPreference?: CatLitterPreference | null;
  litterDetail?: string | null;
  personality: string | null;
  careInstructions?: string | null;
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

export interface UpdateCatRequest extends CreateCatRequest {
  expectedUpdatedAt: string;
  deceased?: boolean;
  removedInformationalPhotoIds?: string[];
}

export interface CatPhotoMutation {
  photo: File | null;
  removePhoto: boolean;
}

export interface CatLookup {
  id: string;
  name: string;
  deceased?: boolean;
  ownerId: string;
  ownerName: string;
  ownerDeceased?: boolean;
}

export interface CatOverviewItem {
  id: string;
  name: string;
  deceased?: boolean;
  ownerId: string;
  ownerName: string;
  ownerDeceased?: boolean;
  hasPhoto: boolean;
}
