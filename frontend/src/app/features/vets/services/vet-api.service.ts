import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import { CreateVetRequest, UpdateVetRequest, Vet, VetLookup } from '../models/vet.model';
import { EntityLookupPage } from '../../../shared/entity-lookup/entity-lookup.models';
import {
  CatRelationshipPage,
  VetDetailResponse,
} from '../../../shared/entity-detail/relationship.models';

@Injectable({
  providedIn: 'root',
})
export class VetApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/vets`;

  getVets(): Observable<Vet[]> {
    return this.http.get<Vet[]>(this.baseUrl);
  }

  getVetById(vetId: string): Observable<Vet> {
    return this.http.get<Vet>(`${this.baseUrl}/${vetId}`);
  }

  searchVets(query: string, page = 0): Observable<EntityLookupPage<VetLookup>> {
    return this.http.get<EntityLookupPage<VetLookup>>(`${this.baseUrl}/search`, {
      params: { q: query.trim(), page },
    });
  }

  getVetDetail(vetId: string): Observable<VetDetailResponse> {
    return this.http.get<VetDetailResponse>(`${this.baseUrl}/${vetId}/detail`);
  }

  getVetCats(vetId: string, page = 0): Observable<CatRelationshipPage> {
    return this.http.get<CatRelationshipPage>(`${this.baseUrl}/${vetId}/cats`, {
      params: { page },
    });
  }

  createVet(request: CreateVetRequest): Observable<Vet> {
    return this.http.post<Vet>(this.baseUrl, request);
  }

  updateVet(vetId: string, request: UpdateVetRequest): Observable<Vet> {
    return this.http.put<Vet>(`${this.baseUrl}/${vetId}`, request);
  }

  deleteVet(vetId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${vetId}`);
  }
}
