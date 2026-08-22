import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import { CreateOwnerRequest, Owner, UpdateOwnerRequest } from '../models/owner.model';
import {
  CatRelationshipPage,
  OwnerDetailResponse,
  StayRelationshipPage,
} from '../../../shared/entity-detail/relationship.models';

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

  getOwnerDetail(ownerId: string): Observable<OwnerDetailResponse> {
    return this.http.get<OwnerDetailResponse>(`${this.baseUrl}/${ownerId}/detail`);
  }

  getOwnerCats(ownerId: string, page = 0): Observable<CatRelationshipPage> {
    return this.http.get<CatRelationshipPage>(`${this.baseUrl}/${ownerId}/cats`, {
      params: { page },
    });
  }

  getOwnerStays(ownerId: string, page = 0): Observable<StayRelationshipPage> {
    return this.http.get<StayRelationshipPage>(`${this.baseUrl}/${ownerId}/stays`, {
      params: { page },
    });
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
