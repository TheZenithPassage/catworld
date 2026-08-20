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

  it('searches cat lookup options with the shared paging contract', () => {
    service.searchLookupOptions('Mílo', 2).subscribe((response) => {
      expect(response).toEqual({ items: [], page: 2, hasNext: false });
    });

    const request = httpTestingController.expectOne(
      `${API_BASE_URL}/cats/search?q=M%C3%ADlo&page=2`,
    );
    expect(request.request.method).toBe('GET');
    request.flush({ items: [], page: 2, hasNext: false });
  });

  it('resolves a cat lookup option by authoritative id', () => {
    service.getLookupOption('cat-1').subscribe();

    const request = httpTestingController.expectOne(`${API_BASE_URL}/cats/cat-1/lookup-option`);
    expect(request.request.method).toBe('GET');
    request.flush({ id: 'cat-1', name: 'Milo', ownerName: 'Ada' });
  });
});
