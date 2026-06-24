import { TestBed } from '@angular/core/testing';

import { AuthSessionService } from './auth-session.service';

describe('AuthSessionService', () => {
  let service: AuthSessionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthSessionService);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('starts without an authenticated session', () => {
    expect(service.authenticated()).toBeNull();
    expect(service.getUsername()).toBeNull();
    expect(service.getRole()).toBeNull();
    expect(service.getAuthorizationHeader()).toBeNull();
    expect(service.hasRole('ADMIN')).toBe(false);
  });

  it('stores canonical identity, role, and basic credentials after login', () => {
    service.login({ username: 'admin', role: 'ADMIN' }, { username: 'Admin', password: 'secret' });

    expect(service.authenticated()).toEqual({
      username: 'admin',
      role: 'ADMIN',
      authorizationHeader: `Basic ${btoa('Admin:secret')}`,
    });
    expect(service.getUsername()).toBe('admin');
    expect(service.getRole()).toBe('ADMIN');
    expect(service.hasRole('ADMIN')).toBe(true);
    expect(service.hasRole('STAFF')).toBe(false);
    expect(service.getAuthorizationHeader()).toBe(`Basic ${btoa('Admin:secret')}`);
  });

  it('recognizes an authenticated staff role', () => {
    service.login({ username: 'staff', role: 'STAFF' }, { username: 'staff', password: 'secret' });

    expect(service.getRole()).toBe('STAFF');
    expect(service.hasRole('STAFF')).toBe(true);
    expect(service.hasRole('ADMIN')).toBe(false);
  });

  it('clears the session on logout', () => {
    service.login({ username: 'admin', role: 'ADMIN' }, { username: 'admin', password: 'secret' });

    service.logout();

    expect(service.authenticated()).toBeNull();
    expect(service.getUsername()).toBeNull();
    expect(service.getRole()).toBeNull();
    expect(service.getAuthorizationHeader()).toBeNull();
    expect(service.hasRole('ADMIN')).toBe(false);
  });
});
