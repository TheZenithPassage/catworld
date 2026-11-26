import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { DEMO_AUTHORIZATION } from './auth.model';

export const DEMO_STATUS_URL = `${API_BASE_URL}/demo/status`;
export const DEMO_RESET_URL = `${API_BASE_URL}/demo/reset`;

export interface DemoStatus {
  hasAdditionalAccounts: boolean;
  nextScheduledCheckAt: string;
  resetState: 'AVAILABLE' | 'CLEAN' | 'QUEUED' | 'COOLDOWN' | 'LIMIT_REACHED';
  resetAvailableAt: string | null;
}

@Injectable({
  providedIn: 'root',
})
export class DemoApiService {
  private readonly http = inject(HttpClient);
  private readonly options = { headers: { Authorization: DEMO_AUTHORIZATION } };

  getStatus(): Observable<DemoStatus> {
    return this.http.get<DemoStatus>(DEMO_STATUS_URL, this.options);
  }

  requestReset(): Observable<DemoStatus> {
    return this.http.post<DemoStatus>(DEMO_RESET_URL, null, this.options);
  }
}
