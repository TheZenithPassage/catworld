import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { API_BASE_URL } from '../../core/config/api.config';
import {
  CareDay,
  CareHistory,
  CareRecord,
  CareRecordRequest,
  CareRoutine,
  CareRoutineRequest,
} from './care.models';

@Injectable({ providedIn: 'root' })
export class CareApiService {
  private readonly http = inject(HttpClient);
  private readonly base = API_BASE_URL + '/care';

  day(date: string | null) {
    return this.http.get<CareDay>(this.base + '/day', { params: date ? { date } : {} });
  }

  history(stayId: string) {
    return this.http.get<CareHistory>(this.base + '/stays/' + stayId + '/records');
  }

  listRoutines() {
    return this.http.get<CareRoutine[]>(this.base + '/routines');
  }

  addRoutine(request: CareRoutineRequest) {
    return this.http.post<CareRoutine>(this.base + '/routines', request);
  }

  configureRoutine(id: string, request: CareRoutineRequest) {
    return this.http.put<CareRoutine>(this.base + '/routines/' + id, request);
  }

  deactivateRoutine(id: string) {
    return this.http.delete<void>(this.base + '/routines/' + id);
  }

  record(request: CareRecordRequest) {
    return this.http.post<CareRecord>(this.base + '/records', request);
  }

  annul(id: string) {
    return this.http.post<CareRecord>(this.base + '/records/' + id + '/annul', null);
  }
}
