import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import { CreateStayRequest, Stay, UpdateStayRequest } from '../models/stay.model';

@Injectable({
  providedIn: 'root',
})
export class StayApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/stays`;

  getStays(): Observable<Stay[]> {
    return this.http.get<Stay[]>(this.baseUrl);
  }

  getStayById(id: string): Observable<Stay> {
    return this.http.get<Stay>(`${this.baseUrl}/${id}`);
  }

  createStay(request: CreateStayRequest): Observable<Stay> {
    return this.http.post<Stay>(this.baseUrl, request);
  }

  updateStay(id: string, request: UpdateStayRequest): Observable<Stay> {
    return this.http.put<Stay>(`${this.baseUrl}/${id}`, request);
  }

  cancelStay(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/cancel`, null);
  }
}
