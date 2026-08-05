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
    preview.flush({});

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
});
