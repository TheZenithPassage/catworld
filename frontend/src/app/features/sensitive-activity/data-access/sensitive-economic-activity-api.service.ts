import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import {
  parseSensitiveActivity,
  SensitiveActivityFilters,
  SensitiveEconomicActivityEvent,
} from '../models/sensitive-economic-activity';

@Injectable({ providedIn: 'root' })
export class SensitiveEconomicActivityApiService {
  private readonly http = inject(HttpClient);

  getActivity(filters: SensitiveActivityFilters): Observable<SensitiveEconomicActivityEvent[]> {
    let params = new HttpParams();
    for (const key of Object.keys(filters) as (keyof SensitiveActivityFilters)[]) {
      const value = filters[key];
      if (value) params = params.set(key, this.serialize(key, value));
    }
    return this.http
      .get<unknown>(`${API_BASE_URL}/sensitive-economic-activity`, { params })
      .pipe(map(parseSensitiveActivity));
  }

  private serialize(key: keyof SensitiveActivityFilters, value: string): string {
    return key === 'occurredFrom' || key === 'occurredTo' ? new Date(value).toISOString() : value;
  }
}
