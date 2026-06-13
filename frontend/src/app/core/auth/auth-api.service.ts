import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { AuthUser, LoginRequest } from './auth.model';

@Injectable({
  providedIn: 'root',
})
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/auth`;

  login(request: LoginRequest): Observable<AuthUser> {
    const authorizationHeader = `Basic ${btoa(`${request.username}:${request.password}`)}`;

    return this.http.post<AuthUser>(`${this.baseUrl}/login`, null, {
      headers: new HttpHeaders({
        Authorization: authorizationHeader,
      }),
    });
  }
}
