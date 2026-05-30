import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import { CreateVetRequest, Vet } from '../models/vet.model';

@Injectable({
  providedIn: 'root'
})
export class VetApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/vets`;

  getVets(): Observable<Vet[]> {
    return this.http.get<Vet[]>(this.baseUrl);
  }

  createVet(request: CreateVetRequest): Observable<Vet> {
    return this.http.post<Vet>(this.baseUrl, request);
  }
}