import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import { Cat, CreateCatRequest, UpdateCatRequest } from '../models/cat.model';
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

  getCatById(catId: string): Observable<Cat> {
    return this.http.get<Cat>(`${this.baseUrl}/${catId}`);
  }

  getCatDetail(catId: string): Observable<CatDetailResponse> {
    return this.http.get<CatDetailResponse>(`${this.baseUrl}/${catId}/detail`);
  }

  getCatStays(catId: string, page = 0): Observable<StayRelationshipPage> {
    return this.http.get<StayRelationshipPage>(`${this.baseUrl}/${catId}/stays`, {
      params: { page },
    });
  }

  createCat(request: CreateCatRequest, photo: File | null = null): Observable<Cat> {
    const body = this.catFormData(request);
    if (photo) body.append('photo', photo);
    return this.http.post<Cat>(this.baseUrl, body);
  }

  updateCat(
    catId: string,
    request: UpdateCatRequest,
    photo: File | null = null,
    removePhoto = false,
  ): Observable<Cat> {
    const body = this.catFormData(request);
    if (photo) body.append('photo', photo);
    body.append('removePhoto', String(removePhoto));
    return this.http.put<Cat>(`${this.baseUrl}/${catId}`, body);
  }

  deleteCat(catId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${catId}`);
  }

  private catFormData(request: CreateCatRequest | UpdateCatRequest): FormData {
    const body = new FormData();
    body.append('cat', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    return body;
  }
}
