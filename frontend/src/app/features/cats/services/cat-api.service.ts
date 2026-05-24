import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/config/api.config';
import { Cat } from '../models/cat.model';

@Injectable({
  providedIn: 'root'
})
export class CatApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/cats`;

  getCats(): Observable<Cat[]> {
    return this.http.get<Cat[]>(this.baseUrl);
  }
}