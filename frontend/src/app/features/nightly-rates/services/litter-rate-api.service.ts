import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '../../../core/config/api.config';

interface LitterRateResponse {
  litterRatePerKg: string | null;
}

@Injectable({ providedIn: 'root' })
export class LitterRateApiService {
  private readonly http = inject(HttpClient);
  private readonly url = `${API_BASE_URL}/litter-rate`;

  getCurrentRate() {
    return this.http.get<LitterRateResponse>(this.url);
  }

  configureRate(litterRatePerKg: string) {
    return this.http.put<LitterRateResponse>(this.url, { litterRatePerKg });
  }

  clearRate() {
    return this.http.delete<void>(this.url);
  }
}
