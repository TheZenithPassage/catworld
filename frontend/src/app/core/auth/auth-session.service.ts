import { Injectable, signal } from '@angular/core';

interface AuthSession {
  username: string;
  authorizationHeader: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthSessionService {
  private readonly session = signal<AuthSession | null>(null);

  readonly authenticated = this.session.asReadonly();

  login(username: string, password: string): void {
    this.session.set({
      username,
      authorizationHeader: this.buildBasicAuthorizationHeader(username, password),
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

  private buildBasicAuthorizationHeader(username: string, password: string): string {
    return `Basic ${btoa(`${username}:${password}`)}`;
  }
}
