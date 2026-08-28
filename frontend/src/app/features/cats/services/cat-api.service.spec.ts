import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/config/api.config';
import { CatApiService } from './cat-api.service';
import { CreateCatRequest } from '../models/cat.model';

describe('CatApiService', () => {
  let service: CatApiService;
  let httpTestingController: HttpTestingController;
  const cat: CreateCatRequest = {
    name: 'Milo',
    birthDate: '2022-01-01',
    sex: 'MALE',
    breed: null,
    coat: null,
    color: null,
    foodBrand: null,
    litterBrand: null,
    personality: null,
    lastInternalDewormerName: null,
    lastInternalDewormingDate: null,
    lastExternalDewormerName: null,
    lastExternalDewormingDate: null,
    lastTripleFelineDate: null,
    lastRabiesDate: null,
    ownerId: 'owner-1',
    vetId: null,
  };

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

  it('creates a cat as multipart with JSON and the original optional file', async () => {
    const photo = new File(['photo'], 'milo.webp', { type: 'image/webp' });
    service.createCat(cat, photo).subscribe();

    const request = httpTestingController.expectOne(`${API_BASE_URL}/cats`);
    expect(request.request.method).toBe('POST');
    expect(request.request.headers.has('Content-Type')).toBe(false);
    const body = request.request.body as FormData;
    const catPart = body.get('cat') as Blob;
    expect(catPart.type).toBe('application/json');
    expect(JSON.parse(await catPart.text())).toEqual(cat);
    expect(body.get('photo')).toBe(photo);
    request.flush({});
  });

  it('encodes each update photo intent as exact multipart fields', () => {
    const photo = new File(['photo'], 'milo.jpg', { type: 'image/jpeg' });
    const cases = [
      { photo: null, remove: false },
      { photo, remove: false },
      { photo: null, remove: true },
      { photo, remove: true },
    ];

    for (const value of cases) {
      service.updateCat('cat-1', cat, value.photo, value.remove).subscribe();
      const request = httpTestingController.expectOne(`${API_BASE_URL}/cats/cat-1`);
      expect(request.request.method).toBe('PUT');
      expect(request.request.headers.has('Content-Type')).toBe(false);
      const body = request.request.body as FormData;
      expect(body.get('photo')).toBe(value.photo);
      expect(body.get('removePhoto')).toBe(String(value.remove));
      request.flush({});
    }
  });

  it('reads a cat photo as a blob', () => {
    const blob = new Blob(['jpeg'], { type: 'image/jpeg' });
    service.getCatPhoto('cat-1').subscribe((result) => expect(result).toBe(blob));

    const request = httpTestingController.expectOne(`${API_BASE_URL}/cats/cat-1/photo`);
    expect(request.request.method).toBe('GET');
    expect(request.request.responseType).toBe('blob');
    request.flush(blob);
  });

  it('searches encoded cat pages with the focused owner presentation shape', () => {
    service.searchCats('  Milo & Mia  ', 1).subscribe((page) =>
      expect(page.items[0]).toEqual({
        id: 'cat-1',
        name: 'Milo',
        ownerId: 'owner-1',
        ownerName: 'María',
      }),
    );
    const request = httpTestingController.expectOne(
      `${API_BASE_URL}/cats/search?q=Milo%20%26%20Mia&page=1`,
    );
    expect(request.request.method).toBe('GET');
    request.flush({
      items: [{ id: 'cat-1', name: 'Milo', ownerId: 'owner-1', ownerName: 'María' }],
      page: 1,
      pageSize: 5,
      totalElements: 6,
    });
  });
});
