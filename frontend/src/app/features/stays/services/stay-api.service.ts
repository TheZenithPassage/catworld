import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import {
  CatRelationshipPage,
  StayDetailResponse,
} from '../../../shared/entity-detail/relationship.models';
import {
  CreateStayRequest,
  CreationPricingPreview,
  CreationPricingPreviewRequest,
  PaymentEditRequest,
  PaymentReasonRequest,
  PaymentRegistrationRequest,
  PricingDecision,
  Stay,
  StayOverviewItem,
  StayOverviewStatus,
  StayDatePricingPreview,
  StayDatePricingPreviewRequest,
  UpdateStayRequest,
} from '../models/stay.model';
import { OverviewPage } from '../../../shared/pagination/overview-page';

import { StayDateFilters } from '../utils/stay-search-filter.util';

function dateParams(filters: StayDateFilters): Record<string, string> {
  if (!filters.dateFrom && !filters.dateTo) return {};
  return {
    ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
    ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
    dateMatchMode: filters.dateMatchMode ?? 'OVERLAPS',
  };
}

export interface StayOverviewFilters extends StayDateFilters {
  statuses: StayOverviewStatus[];
  ownerId: string | null;
  catId: string | null;
  paymentConditions: string[];
  outstandingOnly: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class StayApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/stays`;

  getStays(filters: StayDateFilters = {}): Observable<Stay[]> {
    return this.http.get<Stay[]>(this.baseUrl, { params: dateParams(filters) });
  }

  getStayOverview(
    page: number,
    filters: StayOverviewFilters,
  ): Observable<OverviewPage<StayOverviewItem>> {
    return this.http.get<OverviewPage<StayOverviewItem>>(`${this.baseUrl}/overview`, {
      params: {
        page,
        ...dateParams(filters),
        status: filters.statuses,
        paymentCondition: filters.paymentConditions,
        outstandingOnly: filters.outstandingOnly,
        ...(filters.ownerId ? { ownerId: filters.ownerId } : {}),
        ...(filters.catId ? { catId: filters.catId } : {}),
      },
    });
  }

  getStayById(id: string): Observable<Stay> {
    return this.http.get<Stay>(`${this.baseUrl}/${id}`);
  }

  getStayDetail(id: string): Observable<StayDetailResponse> {
    return this.http.get<StayDetailResponse>(`${this.baseUrl}/${id}/detail`);
  }

  getStayCats(id: string, page = 0): Observable<CatRelationshipPage> {
    return this.http.get<CatRelationshipPage>(`${this.baseUrl}/${id}/cats`, { params: { page } });
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

  registerPayment(id: string, request: PaymentRegistrationRequest): Observable<Stay> {
    return this.http.post<Stay>(`${this.baseUrl}/${id}/payments`, request);
  }

  editPayment(id: string, paymentId: string, request: PaymentEditRequest): Observable<Stay> {
    return this.http.patch<Stay>(`${this.baseUrl}/${id}/payments/${paymentId}`, request);
  }

  annulPayment(id: string, paymentId: string, request: PaymentReasonRequest): Observable<Stay> {
    return this.http.patch<Stay>(`${this.baseUrl}/${id}/payments/${paymentId}/annul`, request);
  }

  removePayment(id: string, paymentId: string, request: PaymentReasonRequest): Observable<Stay> {
    return this.http.delete<Stay>(`${this.baseUrl}/${id}/payments/${paymentId}`, {
      body: request,
    });
  }

  cancelStay(id: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/${id}/cancel`, null);
  }

  deleteStay(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
