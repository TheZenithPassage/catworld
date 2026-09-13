import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';

export interface TransferRateResponse {
  transferRate: string | null;
}

@Injectable({ providedIn: 'root' })
export class TransferRateApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/transfer-rate`;
  getCurrentRate(): Observable<TransferRateResponse> {
    return this.http.get<TransferRateResponse>(this.url);
  }
  configureRate(transferRate: string): Observable<TransferRateResponse> {
    return this.http.put<TransferRateResponse>(this.url, { transferRate });
  }
  clearRate(): Observable<void> {
    return this.http.delete<void>(this.url);
  }
}
