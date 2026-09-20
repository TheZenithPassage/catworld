import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/config/api.config';
import { NightlyReferenceRateApiService } from './nightly-reference-rate-api.service';

const currentRates = [
  { key: 'ONE_CAT', nightlyRate: '45' },
  { key: 'ONE_CAT_7_TO_14', nightlyRate: null },
  { key: 'ONE_CAT_15_TO_29', nightlyRate: '40' },
  { key: 'ONE_CAT_30_PLUS', nightlyRate: null },
  { key: 'TWO_CATS', nightlyRate: '70' },
  { key: 'THREE_PLUS_CATS', nightlyRate: '90' },
] as const;

describe('NightlyReferenceRateApiService', () => {
  let service: NightlyReferenceRateApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(NightlyReferenceRateApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => http.verify());

  it('preserves a 19-digit response amount through Angular HTTP consumption', () => {
    let receivedRate: string | null | undefined;
    service.getCurrentRates().subscribe((rates) => {
      receivedRate = rates[0]?.nightlyRate;
    });
    const request = http.expectOne(`${API_BASE_URL}/nightly-reference-rates`);
    expect(request.request.method).toBe('GET');
    request.flush([
      { ...currentRates[0], nightlyRate: '9999999999999999999' },
      ...currentRates.slice(1),
    ]);
    expect(receivedRate).toBe('9999999999999999999');
  });

  it('configures the exact key with the digit string', () => {
    service.configureRate('ONE_CAT_15_TO_29', '9999999999999999999').subscribe();
    const request = http.expectOne(`${API_BASE_URL}/nightly-reference-rates/ONE_CAT_15_TO_29`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ nightlyRate: '9999999999999999999' });
    request.flush({ key: 'ONE_CAT_15_TO_29', nightlyRate: '9999999999999999999' });
  });

  it('clears the exact key', () => {
    service.clearRate('TWO_CATS').subscribe();
    const request = http.expectOne(`${API_BASE_URL}/nightly-reference-rates/TWO_CATS`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
