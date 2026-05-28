import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import { CreateOwnerRequest, Owner } from '../models/owner.model';

@Injectable({
  providedIn: 'root'
})
export class OwnerApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/owners`;

  getOwners(): Observable<Owner[]> {
    return this.http.get<Owner[]>(this.baseUrl);
  }

  createOwner(request: CreateOwnerRequest): Observable<Owner> {
  return this.http.post<Owner>(this.baseUrl, request);
}
}