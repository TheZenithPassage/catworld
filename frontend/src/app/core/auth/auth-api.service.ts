import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import {
  AuthUser,
  basicAuthorization,
  DEMO_AUTHORIZATION,
  DEMO_GENERATION_HEADER,
  LoginRequest,
} from './auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/auth`;

  login(request: LoginRequest): Observable<AuthUser> {
    return this.http.post<AuthUser>(`${this.baseUrl}/login`, null, {
      headers: { Authorization: basicAuthorization(request) },
    });
  }

  loginDemo(credentials?: LoginRequest): Observable<{ user: AuthUser; generation: string }> {
    return this.http
      .post<AuthUser>(`${this.baseUrl}/login`, null, {
        headers: {
          Authorization: credentials ? basicAuthorization(credentials) : DEMO_AUTHORIZATION,
        },
        observe: 'response',
      })
      .pipe(
        map(({ body: user, headers }) => {
          const generation = headers.get(DEMO_GENERATION_HEADER);
          if (!user || !generation) {
            throw new Error('Demo login response is missing the user or generation');
          }
          return { user, generation };
        }),
      );
  }
}
