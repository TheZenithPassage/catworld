import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/config/api.config';
import { CatApiService } from './cat-api.service';

describe('CatApiService', () => {
  let service: CatApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(CatApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    TestBed.resetTestingModule();
  });

  it('deletes a cat permanently', () => {
    service.deleteCat('cat-1').subscribe();

    const request = httpTestingController.expectOne(`${API_BASE_URL}/cats/cat-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });
});
