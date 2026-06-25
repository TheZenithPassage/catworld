import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { UserRole } from '../../../core/auth/auth.model';
import { API_BASE_URL } from '../../../core/config/api.config';
import { CreateUserAccountRequest, UserAccount } from '../models/user-account.model';

@Injectable({
  providedIn: 'root',
})
export class UserAccountApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/users`;

  getAccounts(): Observable<UserAccount[]> {
    return this.http.get<UserAccount[]>(this.baseUrl);
  }

  createAccount(request: CreateUserAccountRequest): Observable<UserAccount> {
    return this.http.post<UserAccount>(this.baseUrl, request);
  }

  changeRole(accountId: string, role: UserRole): Observable<UserAccount> {
    return this.http.patch<UserAccount>(`${this.baseUrl}/${accountId}/role`, { role });
  }

  changeEnabled(accountId: string, enabled: boolean): Observable<UserAccount> {
    return this.http.patch<UserAccount>(`${this.baseUrl}/${accountId}/enabled`, { enabled });
  }
}
