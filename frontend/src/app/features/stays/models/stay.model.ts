import { HttpErrorResponse } from '@angular/common/http';

export interface StayCatSummary {
  catId: string;
  name: string;
}

export interface Stay {
  stayId: string;
  startAt: string;
  endAt: string;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
  notes: string | null;
  catIds: string[];
  ownerId: string;
  ownerName: string;
  cats: StayCatSummary[];
}

export interface CreateStayRequest {
  catIds: string[];
  startAt: string;
  endAt: string;
  notes: string | null;
  overrideVaccineConflicts?: boolean;
}

export interface UpdateStayRequest {
  startAt: string;
  endAt: string;
  notes: string | null;
  overrideVaccineConflicts?: boolean;
}

export type VaccineType = 'RABIES' | 'TRIPLE_FELINE';

export type VaccineConflictReason = 'MISSING' | 'EXPIRED';

export interface VaccineConflictViolation {
  catId: string;
  catName: string;
  vaccineType: VaccineType;
  reason: VaccineConflictReason;
  vaccinatedOn: string | null;
  expiresOn: string | null;
}

export interface VaccineConflictResponse {
  code: 'VACCINE_VALIDITY_CONFLICT';
  violations: VaccineConflictViolation[];
}

export function isVaccineConflictError(
  error: unknown,
): error is HttpErrorResponse & { error: VaccineConflictResponse } {
  if (!(error instanceof HttpErrorResponse) || error.status !== 409) {
    return false;
  }

  const responseBody: unknown = error.error;

  return (
    isRecord(responseBody) &&
    responseBody['code'] === 'VACCINE_VALIDITY_CONFLICT' &&
    Array.isArray(responseBody['violations']) &&
    responseBody['violations'].length > 0 &&
    responseBody['violations'].every(isVaccineConflictViolation)
  );
}

function isVaccineConflictViolation(value: unknown): value is VaccineConflictViolation {
  if (!isRecord(value)) {
    return false;
  }

  return (
    isNonEmptyString(value['catId']) &&
    isNonEmptyString(value['catName']) &&
    isVaccineType(value['vaccineType']) &&
    isVaccineConflictReason(value['reason']) &&
    isNullableString(value['vaccinatedOn']) &&
    isNullableString(value['expiresOn'])
  );
}

function isVaccineType(value: unknown): value is VaccineType {
  return value === 'RABIES' || value === 'TRIPLE_FELINE';
}

function isVaccineConflictReason(value: unknown): value is VaccineConflictReason {
  return value === 'MISSING' || value === 'EXPIRED';
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === 'string';
}
