import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import { CreateOwnerRequest, Owner, UpdateOwnerRequest } from '../models/owner.model';

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

  createOwner(request: CreateOwnerRequest): Observable<Owner> {
    return this.http.post<Owner>(this.baseUrl, request);
  }

  updateOwner(ownerId: string, request: UpdateOwnerRequest): Observable<Owner> {
    return this.http.put<Owner>(`${this.baseUrl}/${ownerId}`, request);
  }
}
