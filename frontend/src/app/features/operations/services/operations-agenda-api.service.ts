import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import { OperationsAgenda } from '../models/operations-agenda.model';

@Injectable({ providedIn: 'root' })
export class OperationsAgendaApiService {
  private readonly http = inject(HttpClient);

  getAgenda(date?: string): Observable<OperationsAgenda> {
    return this.http.get<OperationsAgenda>(`${API_BASE_URL}/operations/agenda`, {
      params: date ? { date } : {},
    });
  }
}
