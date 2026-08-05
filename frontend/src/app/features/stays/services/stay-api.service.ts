import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import {
  CreateStayRequest,
  CreationPricingPreview,
  CreationPricingPreviewRequest,
  PricingDecision,
  Stay,
  StayDatePricingPreview,
  StayDatePricingPreviewRequest,
  UpdateStayRequest,
} from '../models/stay.model';

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

  previewCreationPricing(
    request: CreationPricingPreviewRequest,
  ): Observable<CreationPricingPreview> {
    return this.http.post<CreationPricingPreview>(`${this.baseUrl}/pricing-preview`, request);
  }

  previewDateChangePricing(
    id: string,
    request: StayDatePricingPreviewRequest,
  ): Observable<StayDatePricingPreview> {
    return this.http.post<StayDatePricingPreview>(`${this.baseUrl}/${id}/pricing-preview`, request);
  }

  updateStay(id: string, request: UpdateStayRequest): Observable<Stay> {
    return this.http.put<Stay>(`${this.baseUrl}/${id}`, request);
  }

  correctAgreedAmount(id: string, request: PricingDecision): Observable<Stay> {
    return this.http.patch<Stay>(`${this.baseUrl}/${id}/agreed-amount`, request);
  }

  cancelStay(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/cancel`, null);
  }

  deleteStay(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
