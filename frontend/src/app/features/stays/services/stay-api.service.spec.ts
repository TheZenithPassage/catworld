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
});
