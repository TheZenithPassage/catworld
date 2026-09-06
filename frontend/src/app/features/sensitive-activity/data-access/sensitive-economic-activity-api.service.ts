import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import { OverviewPage } from '../../../shared/pagination/overview-page';
import {
  parseSensitiveActivity,
  SensitiveActivityFilters,
  SensitiveEconomicActivityEvent,
} from '../models/sensitive-economic-activity';

@Injectable({ providedIn: 'root' })
export class SensitiveEconomicActivityApiService {
  private readonly http = inject(HttpClient);

  getActivity(
    filters: SensitiveActivityFilters,
    page = 0,
  ): Observable<OverviewPage<SensitiveEconomicActivityEvent>> {
    let params = new HttpParams().set('page', page);
    for (const key of Object.keys(filters) as (keyof SensitiveActivityFilters)[]) {
      const value = filters[key];
      if (value) params = params.set(key, value);
    }
    return this.http
      .get<unknown>(`${API_BASE_URL}/sensitive-economic-activity`, { params })
      .pipe(map((value) => parseSensitiveActivity(value, page)));
  }
}
