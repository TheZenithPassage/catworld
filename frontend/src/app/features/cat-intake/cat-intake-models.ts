export const CAT_INTAKE_FIELDS = [
  { key: 'name', kind: 'text', required: true, maxLength: 100 },
  { key: 'birthDate', kind: 'date', required: true },
  { key: 'sex', kind: 'sex', required: true },
  { key: 'breed', kind: 'text', maxLength: 100 },
  { key: 'coat', kind: 'text', maxLength: 100 },
  { key: 'color', kind: 'text', maxLength: 100 },
  { key: 'personality', kind: 'text', maxLength: 255 },
  { key: 'foodBrand', kind: 'text', maxLength: 100 },
  { key: 'litterBrand', kind: 'text', maxLength: 100 },
  { key: 'lastTripleFelineDate', kind: 'date' },
  { key: 'lastRabiesDate', kind: 'date' },
  { key: 'lastInternalDewormerName', kind: 'text', maxLength: 100 },
  { key: 'lastInternalDewormingDate', kind: 'date' },
  { key: 'lastExternalDewormerName', kind: 'text', maxLength: 100 },
  { key: 'lastExternalDewormingDate', kind: 'date' },
] as const;

export type CatIntakeField = (typeof CAT_INTAKE_FIELDS)[number];
export type CatIntakeFieldKey = CatIntakeField['key'];
export type CatIntakeFields = Partial<Record<CatIntakeFieldKey, string | null>>;

export interface CatIntakeInvitationRequest {
  ownerId: string;
  catIds: string[];
  allowNewCats: boolean;
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
  photos: { id: string }[];
  catUpdatedAt: string | null;
}

export interface CatIntakeApproval {
  fields: CatIntakeFields;
  photoIds: string[];
  expectedCatUpdatedAt: string | null;
}
