import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/config/api.config';
import { StayApiService } from './stay-api.service';

describe('StayApiService', () => {
  let service: StayApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(StayApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    TestBed.resetTestingModule();
  });

  it('deletes a stay permanently', () => {
    service.deleteStay('stay-1').subscribe();

    const request = httpTestingController.expectOne(`${API_BASE_URL}/stays/stay-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });

  it('encodes complete-population overview filters', () => {
    service
      .getStayOverview(2, {
        statuses: ['RESERVED', 'CHECKED_IN'],
        ownerId: 'owner-1',
        catId: null,
        paymentConditions: ['NO_PAYMENT'],
        outstandingOnly: true,
      })
      .subscribe((page) => expect(page.pageSize).toBe(10));
    const request = httpTestingController.expectOne(
      (candidate) =>
        candidate.url === `${API_BASE_URL}/stays/overview` && candidate.params.get('page') === '2',
    );
    expect(request.request.params.getAll('status')).toEqual(['RESERVED', 'CHECKED_IN']);
    expect(request.request.params.get('ownerId')).toBe('owner-1');
    expect(request.request.params.getAll('paymentCondition')).toEqual(['NO_PAYMENT']);
    expect(request.request.params.get('outstandingOnly')).toBe('true');
    request.flush({ items: [], page: 2, pageSize: 10, totalElements: 21 });
  });

  it('reads exact lightweight Stay detail and fixed-page Cat endpoints', () => {
    service.getStayDetail('stay-1').subscribe();
    const detail = httpTestingController.expectOne(`${API_BASE_URL}/stays/stay-1/detail`);
    expect(detail.request.method).toBe('GET');
    detail.flush({});

    service.getStayCats('stay-1', 3).subscribe();
    const cats = httpTestingController.expectOne(
      (request) =>
        request.url === `${API_BASE_URL}/stays/stay-1/cats` && request.params.get('page') === '3',
    );
    expect(cats.request.method).toBe('GET');
    cats.flush({ items: [], page: 3, pageSize: 5, totalElements: 0, totalPages: 0 });
  });

  it('posts exact creation pricing input to the preview endpoint', () => {
    const payload = { startAt: '2099-01-01T10:00', endAt: '2099-01-02T10:00', catIds: ['cat-1'] };
    service.previewCreationPricing(payload).subscribe();
    const request = httpTestingController.expectOne(`${API_BASE_URL}/stays/pricing-preview`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush({
      numberOfNights: 1,
      retainedNightlyRate: '9999999999999999999',
      suggestedAmount: '0',
      confirmation: {
        numberOfNights: 1,
        retainedNightlyRate: '9999999999999999999',
        suggestedAmount: '0',
      },
    });
  });

  it('posts date previews and direct corrections to their focused stay endpoints', () => {
    service
      .previewDateChangePricing('stay-1', {
        startAt: '2099-01-01T10:00',
        endAt: '2099-01-03T10:00',
      })
      .subscribe();
    const preview = httpTestingController.expectOne(`${API_BASE_URL}/stays/stay-1/pricing-preview`);
    expect(preview.request.method).toBe('POST');
    preview.flush({
      pricingDecisionRequired: false,
      currentNumberOfNights: 7,
      currentAgreedAmount: '100',
      numberOfNights: 7,
      retainedNightlyRate: '50',
      suggestedAmount: '100',
      confirmation: null,
    });

    service
      .correctAgreedAmount('stay-1', {
        agreedAmount: '9999999999999999999',
        reason: 'Signed correction',
      })
      .subscribe();
    const correction = httpTestingController.expectOne(
      `${API_BASE_URL}/stays/stay-1/agreed-amount`,
    );
    expect(correction.request.method).toBe('PATCH');
    expect(correction.request.body).toEqual({
      agreedAmount: '9999999999999999999',
      reason: 'Signed correction',
    });
    correction.flush({});
  });

  it('keeps exact payment strings and uses every focused payment endpoint', () => {
    const amount = '9999999999999999999';
    service
      .registerPayment('stay-1', { amount, paymentDate: '2026-08-05', note: null })
      .subscribe();
    const registration = httpTestingController.expectOne(`${API_BASE_URL}/stays/stay-1/payments`);
    expect(registration.request.method).toBe('POST');
    expect(registration.request.body).toEqual({ amount, paymentDate: '2026-08-05', note: null });
    registration.flush({});

    service.editPayment('stay-1', 'payment-1', { amount, reason: 'Correction' }).subscribe();
    const edit = httpTestingController.expectOne(`${API_BASE_URL}/stays/stay-1/payments/payment-1`);
    expect(edit.request.method).toBe('PATCH');
    expect(edit.request.body).toEqual({ amount, reason: 'Correction' });
    edit.flush({});

    service.annulPayment('stay-1', 'payment-1', { reason: 'Duplicate' }).subscribe();
    const annul = httpTestingController.expectOne(
      `${API_BASE_URL}/stays/stay-1/payments/payment-1/annul`,
    );
    expect(annul.request.method).toBe('PATCH');
    expect(annul.request.body).toEqual({ reason: 'Duplicate' });
    annul.flush({});

    service.removePayment('stay-1', 'payment-1', { reason: 'Entered in error' }).subscribe();
    const removal = httpTestingController.expectOne(
      `${API_BASE_URL}/stays/stay-1/payments/payment-1`,
    );
    expect(removal.request.method).toBe('DELETE');
    expect(removal.request.body).toEqual({ reason: 'Entered in error' });
    removal.flush({});
  });
});
