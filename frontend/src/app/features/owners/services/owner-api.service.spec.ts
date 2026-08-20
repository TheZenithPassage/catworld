import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/config/api.config';
import { OwnerApiService } from './owner-api.service';
import { ownerLookupLabel } from '../models/owner.model';

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

  it('searches paged owner lookup options', () => {
    service.searchLookupOptions('Mílo', 1).subscribe();

    const request = httpTestingController.expectOne(
      `${API_BASE_URL}/owners/search?q=M%C3%ADlo&page=1`,
    );
    expect(request.request.method).toBe('GET');
    request.flush({ items: [], page: 1, hasNext: false });
  });

  it('resolves an owner lookup option and formats its label', () => {
    service.getLookupOption('owner-1').subscribe((option) => {
      expect(ownerLookupLabel(option)).toBe('Ana Owner (Milo, Zoe)');
    });

    const request = httpTestingController.expectOne(`${API_BASE_URL}/owners/owner-1/lookup-option`);
    expect(request.request.method).toBe('GET');
    request.flush({
      id: 'owner-1',
      fullName: 'Ana Owner',
      cats: [
        { id: 'cat-1', name: 'Milo' },
        { id: 'cat-2', name: 'Zoe' },
      ],
    });
  });
});
