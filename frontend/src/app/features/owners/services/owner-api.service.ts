import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import {
  CreateOwnerRequest,
  Owner,
  OwnerLookupOption,
  OwnerLookupPage,
  UpdateOwnerRequest,
} from '../models/owner.model';

@Injectable({
  providedIn: 'root',
})
export class OwnerApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/owners`;

  getOwners(): Observable<Owner[]> {
    return this.http.get<Owner[]>(this.baseUrl);
  }

  getOwnerById(ownerId: string): Observable<Owner> {
    return this.http.get<Owner>(`${this.baseUrl}/${ownerId}`);
  }

  searchLookupOptions(query: string, page: number): Observable<OwnerLookupPage> {
    return this.http.get<OwnerLookupPage>(`${this.baseUrl}/search`, {
      params: { q: query, page },
    });
  }

  getLookupOption(ownerId: string): Observable<OwnerLookupOption> {
    return this.http.get<OwnerLookupOption>(`${this.baseUrl}/${ownerId}/lookup-option`);
  }

  createOwner(request: CreateOwnerRequest): Observable<Owner> {
    return this.http.post<Owner>(this.baseUrl, request);
  }

  updateOwner(ownerId: string, request: UpdateOwnerRequest): Observable<Owner> {
    return this.http.put<Owner>(`${this.baseUrl}/${ownerId}`, request);
  }

  deleteOwner(ownerId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${ownerId}`);
  }
}
