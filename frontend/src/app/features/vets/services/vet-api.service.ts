import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import {
  CreateVetRequest,
  UpdateVetRequest,
  Vet,
  VetLookupOption,
  VetLookupPage,
} from '../models/vet.model';

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

  searchVets(query: string, page: number): Observable<VetLookupPage> {
    return this.http.get<VetLookupPage>(`${this.baseUrl}/search`, {
      params: { q: query, page },
    });
  }

  resolveVetLookupOption(vetId: string): Observable<VetLookupOption> {
    return this.http.get<VetLookupOption>(`${this.baseUrl}/${vetId}/lookup-option`);
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
