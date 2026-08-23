import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import { CreateVetRequest, UpdateVetRequest, Vet } from '../models/vet.model';
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
