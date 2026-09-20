import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import {
  NightlyReferenceRate as SharedNightlyReferenceRate,
  NightlyReferenceRateKey,
} from '../models/nightly-reference-rate.model';

export type NightlyRateThreshold = 1 | 2 | 3;
export type NightlyReferenceRate = SharedNightlyReferenceRate & {
  minimumCatCount?: NightlyRateThreshold;
};

@Injectable({ providedIn: 'root' })
export class NightlyReferenceRateApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/nightly-reference-rates`;
  getCurrentRates(): Observable<NightlyReferenceRate[]> {
    return this.http.get<NightlyReferenceRate[]>(this.baseUrl);
  }
  configureRate(
    key: NightlyReferenceRateKey,
    nightlyRate: string,
  ): Observable<NightlyReferenceRate> {
    return this.http.put<NightlyReferenceRate>(`${this.baseUrl}/${key}`, {
      nightlyRate,
    });
  }
  clearRate(key: NightlyReferenceRateKey): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${key}`);
  }
}
