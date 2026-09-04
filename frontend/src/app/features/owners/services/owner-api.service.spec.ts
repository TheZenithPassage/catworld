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

  it('requests a trimmed fixed-page overview', () => {
    service.getOwnerOverview(2, '  Ada  ').subscribe((page) => expect(page.pageSize).toBe(10));
    const request = httpTestingController.expectOne(`${API_BASE_URL}/owners/overview?page=2&q=Ada`);
    request.flush({ items: [], page: 2, pageSize: 10, totalElements: 21 });
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

  it('searches encoded owner pages and resolves complete lookup values', () => {
    service
      .searchOwners('  María & Co  ', 2)
      .subscribe((page) =>
        expect(page.items[0].currentCats).toEqual([{ id: 'cat-1', name: 'Milo' }]),
      );
    service.getOwnerLookup('owner/1').subscribe();

    const search = httpTestingController.expectOne(
      `${API_BASE_URL}/owners/search?q=Mar%C3%ADa%20%26%20Co&page=2`,
    );
    expect(search.request.method).toBe('GET');
    search.flush({
      items: [{ id: 'owner-1', fullName: 'María', currentCats: [{ id: 'cat-1', name: 'Milo' }] }],
      page: 2,
      pageSize: 5,
      totalElements: 11,
    });
    const resolve = httpTestingController.expectOne(`${API_BASE_URL}/owners/owner/1/lookup`);
    expect(resolve.request.method).toBe('GET');
    resolve.flush({ id: 'owner/1', fullName: 'María', currentCats: [] });
  });
});
