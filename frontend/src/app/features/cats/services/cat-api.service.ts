import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import {
  Cat,
  CatInformationalPhoto,
  CatLookup,
  CatPhotoFrame,
  CatOverviewItem,
  CENTERED_PHOTO_FRAME,
  CreateCatRequest,
  FoodBrandOption,
  UpdateCatRequest,
} from '../models/cat.model';
import { OverviewPage } from '../../../shared/pagination/overview-page';
import { EntityLookupPage } from '../../../shared/entity-lookup/entity-lookup.models';
import {
  CatDetailResponse,
  StayRelationshipPage,
} from '../../../shared/entity-detail/relationship.models';

@Injectable({
  providedIn: 'root',
})
export class CatApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/cats`;

  getCats(): Observable<Cat[]> {
    return this.http.get<Cat[]>(this.baseUrl);
  }

  getCatOverview(page = 0, query = ''): Observable<OverviewPage<CatOverviewItem>> {
    return this.http.get<OverviewPage<CatOverviewItem>>(`${this.baseUrl}/overview`, {
      params: { page, ...(query ? { q: query.trim() } : {}) },
    });
  }

  getCatById(catId: string): Observable<Cat> {
    return this.http.get<Cat>(`${this.baseUrl}/${catId}`);
  }

  searchCats(query: string, page = 0): Observable<EntityLookupPage<CatLookup>> {
    return this.http.get<EntityLookupPage<CatLookup>>(`${this.baseUrl}/search`, {
      params: { q: query.trim(), page },
    });
  }

  getCatDetail(catId: string): Observable<CatDetailResponse> {
    return this.http.get<CatDetailResponse>(`${this.baseUrl}/${catId}/detail`);
  }

  getFoodBrands(): Observable<FoodBrandOption[]> {
    return this.http.get<FoodBrandOption[]>(`${API_BASE_URL}/food-brands`);
  }

  getCatPhoto(catId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${catId}/photo`, { responseType: 'blob' });
  }

  previewCatPhoto(file: File): Observable<Blob> {
    const body = new FormData();
    body.append('photo', file);
    return this.http.post(this.baseUrl + '/photo-preview', body, { responseType: 'blob' });
  }

  getFramedCatPhoto(catId: string): Observable<{ blob: Blob; frame: CatPhotoFrame }> {
    return this.http.get(`${this.baseUrl}/${catId}/photo`, { responseType: 'blob', observe: 'response' }).pipe(
      map(({ body, headers }) => {
        const [frameX, frameY, frameZoom] = headers.get('X-Cat-Photo-Frame')?.split(',').map(Number) ?? [];
        const frame = frameZoom ? { frameX, frameY, frameZoom } : CENTERED_PHOTO_FRAME;
        return { blob: body!, frame };
      }),
    );
  }

  listInformationalPhotos(catId: string): Observable<CatInformationalPhoto[]> {
    return this.http.get<CatInformationalPhoto[]>(`${this.baseUrl}/${catId}/informational-photos`);
  }

  getInformationalPhoto(catId: string, photoId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${catId}/informational-photos/${photoId}`, {
      responseType: 'blob',
    });
  }

  addInformationalPhoto(catId: string, file: File): Observable<CatInformationalPhoto> {
    const body = new FormData();
    body.append('photo', file);
    return this.http.post<CatInformationalPhoto>(
      `${this.baseUrl}/${catId}/informational-photos`,
      body,
    );
  }

  deleteInformationalPhoto(catId: string, photoId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${catId}/informational-photos/${photoId}`);
  }

  getCatStays(catId: string, page = 0): Observable<StayRelationshipPage> {
    return this.http.get<StayRelationshipPage>(`${this.baseUrl}/${catId}/stays`, {
      params: { page },
    });
  }

  createCat(
    request: CreateCatRequest,
    photo: File | null = null,
    informationalPhotos: File[] = [],
  ): Observable<Cat> {
    const body = this.catFormData(request, photo, informationalPhotos);
    return this.http.post<Cat>(this.baseUrl, body);
  }

  updateCat(
    catId: string,
    request: UpdateCatRequest,
    photo: File | null = null,
    removePhoto = false,
    informationalPhotos: File[] = [],
  ): Observable<Cat> {
    const body = this.catFormData(request, photo, informationalPhotos);
    body.append('removePhoto', String(removePhoto));
    return this.http.put<Cat>(`${this.baseUrl}/${catId}`, body);
  }

  deleteCat(catId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${catId}`);
  }

  private catFormData(
    request: CreateCatRequest | UpdateCatRequest,
    photo: File | null,
    informationalPhotos: File[],
  ): FormData {
    const body = new FormData();
    body.append('cat', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (photo) body.append('photo', photo);
    for (const attachment of informationalPhotos) body.append('informationalPhotos', attachment);
    return body;
  }
}
