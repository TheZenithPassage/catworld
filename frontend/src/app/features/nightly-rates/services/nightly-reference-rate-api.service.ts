import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';

export type NightlyRateThreshold = 1 | 2 | 3;
export interface NightlyReferenceRate {
  minimumCatCount: NightlyRateThreshold;
  nightlyRate: string | number | null;
}

@Injectable({ providedIn: 'root' })
export class NightlyReferenceRateApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/nightly-reference-rates`;
  getCurrentRates(): Observable<NightlyReferenceRate[]> {
    return this.http.get<NightlyReferenceRate[]>(this.baseUrl);
  }
  configureRate(
    minimumCatCount: NightlyRateThreshold,
    nightlyRate: string,
  ): Observable<NightlyReferenceRate> {
    return this.http.put<NightlyReferenceRate>(`${this.baseUrl}/${minimumCatCount}`, {
      nightlyRate,
    });
  }
  clearRate(minimumCatCount: NightlyRateThreshold): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${minimumCatCount}`);
  }
}
