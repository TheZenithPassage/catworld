import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/config/api.config';
import { NightlyReferenceRateApiService } from './nightly-reference-rate-api.service';

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

  it('loads the complete current set', () => {
    service.getCurrentRates().subscribe();
    const request = http.expectOne(`${API_BASE_URL}/nightly-reference-rates`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });

  it('configures the exact threshold with the digit string', () => {
    service.configureRate(3, '9999999999999999999').subscribe();
    const request = http.expectOne(`${API_BASE_URL}/nightly-reference-rates/3`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({ nightlyRate: '9999999999999999999' });
    request.flush({ minimumCatCount: 3, nightlyRate: '9999999999999999999' });
  });

  it('clears the exact threshold', () => {
    service.clearRate(2).subscribe();
    const request = http.expectOne(`${API_BASE_URL}/nightly-reference-rates/2`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
