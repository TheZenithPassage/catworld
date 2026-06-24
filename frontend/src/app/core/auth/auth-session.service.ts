import { Injectable, signal } from '@angular/core';

import { AuthUser, LoginRequest, UserRole } from './auth.model';

interface AuthSession {
  username: string;
  role: UserRole;
  authorizationHeader: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private readonly session = signal<AuthSession | null>(null);

  readonly authenticated = this.session.asReadonly();

  login(user: AuthUser, credentials: LoginRequest): void {
    this.session.set({
      username: user.username,
      role: user.role,
      authorizationHeader: this.buildBasicAuthorizationHeader(
        credentials.username,
        credentials.password,
      ),
    });
  }

  logout(): void {
    this.session.set(null);
  }

  getAuthorizationHeader(): string | null {
    return this.session()?.authorizationHeader ?? null;
  }

  getUsername(): string | null {
    return this.session()?.username ?? null;
  }

  getRole(): UserRole | null {
    return this.session()?.role ?? null;
  }

  hasRole(role: UserRole): boolean {
    return this.session()?.role === role;
  }

  private buildBasicAuthorizationHeader(username: string, password: string): string {
    return `Basic ${btoa(`${username}:${password}`)}`;
  }
}
