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

  it('loads typed vet detail and its fixed nested cat page', () => {
    service.getVetDetail('vet-1').subscribe();
    service.getVetCats('vet-1', 3).subscribe();

    for (const url of [
      `${API_BASE_URL}/vets/vet-1/detail`,
      `${API_BASE_URL}/vets/vet-1/cats?page=3`,
    ]) {
      const request = httpTestingController.expectOne(url);
      expect(request.request.method).toBe('GET');
      request.flush({});
    }
  });

  it('searches encoded vet pages with the focused shape', () => {
    service.searchVets('  Clínica & Sol  ', 0).subscribe((page) =>
      expect(page).toEqual({
        items: [{ id: 'vet-1', name: 'Clínica Sol' }],
        page: 0,
        pageSize: 5,
        totalElements: 1,
      }),
    );
    service.getVetById('vet-1').subscribe((vet) => expect(vet.name).toBe('Clínica Sol'));
    const request = httpTestingController.expectOne(
      `${API_BASE_URL}/vets/search?q=Cl%C3%ADnica%20%26%20Sol&page=0`,
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      items: [{ id: 'vet-1', name: 'Clínica Sol' }],
      page: 0,
      pageSize: 5,
      totalElements: 1,
    });
    const resolve = httpTestingController.expectOne(`${API_BASE_URL}/vets/vet-1`);
    expect(resolve.request.method).toBe('GET');
    resolve.flush({ id: 'vet-1', name: 'Clínica Sol', address: null, phoneNumber: null });
  });
});
