export const CAT_INTAKE_FIELDS = [
  { key: 'name', kind: 'text', required: true, maxLength: 100 },
  { key: 'birthDate', kind: 'date', required: true },
  { key: 'sex', kind: 'sex', required: true },
  { key: 'breed', kind: 'option' },
  { key: 'coat', kind: 'option' },
  { key: 'color', kind: 'option' },
  { key: 'personality', kind: 'text', maxLength: 255 },
  { key: 'careInstructions', kind: 'textarea', maxLength: 2000 },
  { key: 'foodBrand', kind: 'option' },
  { key: 'foodDetail', kind: 'text', maxLength: 255 },
  { key: 'litterBrand', kind: 'text', maxLength: 100 },
  { key: 'lastTripleFelineDate', kind: 'date' },
  { key: 'lastRabiesDate', kind: 'date' },
  { key: 'lastInternalDewormerName', kind: 'option' },
  { key: 'lastInternalDewormingDate', kind: 'date' },
  { key: 'lastExternalDewormerName', kind: 'option' },
  { key: 'lastExternalDewormingDate', kind: 'date' },
] as const;

export type CatIntakeField = (typeof CAT_INTAKE_FIELDS)[number];
export type CatIntakeFieldKey = CatIntakeField['key'] | 'birthYear';
export type CatIntakeFields = Partial<Record<CatIntakeFieldKey, string | null>>;

export interface CatIntakeInvitationRequest {
  ownerId: string;
  allowNewCats: boolean;
  stayId?: string;
}

export interface ActiveCatIntakeInvitation extends CatIntakeInvitationRequest {
  id: string;
  expiresAt: string;
}

export interface IssuedCatIntakeInvitation {
  id: string;
  expiresAt: string;
  url: string;
}

export interface CatIntakeReviewItem {
  id: string;
  ownerId: string;
  ownerName: string;
  catId: string | null;
  catName: string;
  submittedAt: string;
}

export interface CatIntakeReviewDetail extends CatIntakeReviewItem {
  current: CatIntakeFields | null;
  proposed: CatIntakeFields;
  conflictFields: CatIntakeFieldKey[];
  unansweredRequestedFields: CatIntakeFieldKey[];
  proposedFoodDetailBrand?: string | null;
  photos: { id: string }[];
  catUpdatedAt: string | null;
  revision: number;
}

export interface CatIntakeReviewVersion {
  expectedCatUpdatedAt: string | null;
  expectedReviewRevision: number;
}

export interface CatIntakeApproval extends CatIntakeReviewVersion {
  fields: CatIntakeFields;
  photoIds: string[];
}
