import { Injectable, signal } from '@angular/core';

import {
  AuthUser,
  basicAuthorization,
  DEMO_AUTHORIZATION,
  LoginRequest,
  UserRole,
} from './auth.model';

interface AuthSession {
  username: string;
  role: UserRole;
  authorizationHeader: string;
  demoGeneration?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private readonly session = signal<AuthSession | null>(null);

  readonly authenticated = this.session.asReadonly();

  login(user: AuthUser, credentials: LoginRequest, demoGeneration?: string): void {
    this.session.set({
      username: user.username,
      role: user.role,
      authorizationHeader: basicAuthorization(credentials),
      demoGeneration,
    });
  }

  loginDemo(user: AuthUser, demoGeneration: string): void {
    this.session.set({ ...user, authorizationHeader: DEMO_AUTHORIZATION, demoGeneration });
  }

  logout(): void {
    this.session.set(null);
  }

  getAuthorizationHeader(): string | null {
    return this.session()?.authorizationHeader ?? null;
  }

  getDemoGeneration(): string | undefined {
    return this.session()?.demoGeneration;
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
}
