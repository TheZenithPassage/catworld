import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/config/api.config';
import { OwnerApiService } from './owner-api.service';

describe('OwnerApiService', () => {
  let service: OwnerApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(OwnerApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    TestBed.resetTestingModule();
  });

  it('deletes an owner permanently', () => {
    service.deleteOwner('owner-1').subscribe();

    const request = httpTestingController.expectOne(`${API_BASE_URL}/owners/owner-1`);
    expect(request.request.method).toBe('DELETE');
    request.flush(null);
  });

  it('loads typed owner detail and fixed nested relationship pages', () => {
    service.getOwnerDetail('owner-1').subscribe();
    service.getOwnerCats('owner-1', 2).subscribe();
    service.getOwnerStays('owner-1', 1).subscribe();

    for (const url of [
      `${API_BASE_URL}/owners/owner-1/detail`,
      `${API_BASE_URL}/owners/owner-1/cats?page=2`,
      `${API_BASE_URL}/owners/owner-1/stays?page=1`,
    ]) {
      const request = httpTestingController.expectOne(url);
      expect(request.request.method).toBe('GET');
      request.flush({});
    }
  });
});
