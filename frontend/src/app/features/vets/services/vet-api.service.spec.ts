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

  it('searches vets with the submitted query and page', () => {
    service.searchVets('Clínica', 2).subscribe((response) => {
      expect(response.items[0]?.name).toBe('Clínica Central');
      expect(response.page).toBe(2);
      expect(response.hasNext).toBe(true);
    });

    const request = httpTestingController.expectOne(
      `${API_BASE_URL}/vets/search?q=Cl%C3%ADnica&page=2`,
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      items: [{ id: 'vet-1', name: 'Clínica Central' }],
      page: 2,
      hasNext: true,
    });
  });

  it('resolves the current vet lookup option by id', () => {
    service.resolveVetLookupOption('vet-1').subscribe((option) => {
      expect(option).toEqual({ id: 'vet-1', name: 'Vet Clinic' });
    });

    const request = httpTestingController.expectOne(`${API_BASE_URL}/vets/vet-1/lookup-option`);
    expect(request.request.method).toBe('GET');
    request.flush({ id: 'vet-1', name: 'Vet Clinic' });
  });
});
