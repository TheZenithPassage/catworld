import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import {
  Cat,
  CatLookupOption,
  CatLookupPage,
  CreateCatRequest,
  UpdateCatRequest,
} from '../models/cat.model';

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

  searchLookupOptions(query: string, page: number): Observable<CatLookupPage> {
    return this.http.get<CatLookupPage>(`${this.baseUrl}/search`, {
      params: { q: query, page },
    });
  }

  getLookupOption(catId: string): Observable<CatLookupOption> {
    return this.http.get<CatLookupOption>(`${this.baseUrl}/${catId}/lookup-option`);
  }

  createCat(request: CreateCatRequest): Observable<Cat> {
    return this.http.post<Cat>(this.baseUrl, request);
  }

  updateCat(catId: string, request: UpdateCatRequest): Observable<Cat> {
    return this.http.put<Cat>(`${this.baseUrl}/${catId}`, request);
  }

  deleteCat(catId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${catId}`);
  }
}
