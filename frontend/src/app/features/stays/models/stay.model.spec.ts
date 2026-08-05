import { HttpErrorResponse } from '@angular/common/http';

import { isStalePricingConfirmationError, isVaccineConflictError } from './stay.model';

describe('isVaccineConflictError', () => {
  const validResponse = {
    code: 'VACCINE_VALIDITY_CONFLICT',
    violations: [
      {
        catId: 'cat-1',
        catName: 'Milo',
        vaccineType: 'RABIES',
        reason: 'EXPIRED',
        vaccinatedOn: '2025-07-01',
        expiresOn: '2026-07-01',
      },
      {
        catId: 'cat-2',
        catName: 'Luna',
        vaccineType: 'TRIPLE_FELINE',
        reason: 'MISSING',
        vaccinatedOn: null,
        expiresOn: null,
      },
    ],
  };

  it('recognizes the complete structured 409 contract', () => {
    const error = new HttpErrorResponse({
      error: validResponse,
      status: 409,
    });

    expect(isVaccineConflictError(error)).toBe(true);
  });

  it.each([
    ['a non-409 response', new HttpErrorResponse({ error: validResponse, status: 400 })],
    [
      'the wrong conflict code',
      new HttpErrorResponse({
        error: { ...validResponse, code: 'OTHER_CONFLICT' },
        status: 409,
      }),
    ],
    [
      'an empty violation list',
      new HttpErrorResponse({
        error: { ...validResponse, violations: [] },
        status: 409,
      }),
    ],
    [
      'an unknown vaccine type',
      new HttpErrorResponse({
        error: {
          ...validResponse,
          violations: [{ ...validResponse.violations[0], vaccineType: 'UNKNOWN' }],
        },
        status: 409,
      }),
    ],
    [
      'an unknown conflict reason',
      new HttpErrorResponse({
        error: {
          ...validResponse,
          violations: [{ ...validResponse.violations[0], reason: 'UNKNOWN' }],
        },
        status: 409,
      }),
    ],
    [
      'a malformed violation',
      new HttpErrorResponse({
        error: {
          ...validResponse,
          violations: [{ ...validResponse.violations[0], catName: null }],
        },
        status: 409,
      }),
    ],
  ])('rejects %s', (_description, error) => {
    expect(isVaccineConflictError(error)).toBe(false);
  });
});

describe('isStalePricingConfirmationError', () => {
  it('recognizes only the exact recoverable 409 code', () => {
    expect(
      isStalePricingConfirmationError(
        new HttpErrorResponse({ status: 409, error: { code: 'STALE_PRICING_CONFIRMATION' } }),
      ),
    ).toBe(true);
    expect(
      isStalePricingConfirmationError(
        new HttpErrorResponse({ status: 409, error: { code: 'OTHER' } }),
      ),
    ).toBe(false);
    expect(
      isStalePricingConfirmationError(
        new HttpErrorResponse({ status: 400, error: { code: 'STALE_PRICING_CONFIRMATION' } }),
      ),
    ).toBe(false);
  });
});
