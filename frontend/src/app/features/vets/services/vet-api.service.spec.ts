import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/config/api.config';
import { VetApiService } from './vet-api.service';

describe('VetApiService', () => {
  let service: VetApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(VetApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    TestBed.resetTestingModule();
  });

  it('deletes a vet permanently', () => {
    service.deleteVet('vet-1').subscribe();

    const request = httpTestingController.expectOne(`${API_BASE_URL}/vets/vet-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
