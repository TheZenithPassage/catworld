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
    expect(service.getAuthorizationHeader()).toBeNull();
  });

  it('stores username and basic authorization header after login', () => {
    service.login('admin', 'secret');

    expect(service.authenticated()).toEqual({
      username: 'admin',
      authorizationHeader: `Basic ${btoa('admin:secret')}`,
    });
    expect(service.getUsername()).toBe('admin');
    expect(service.getAuthorizationHeader()).toBe(`Basic ${btoa('admin:secret')}`);
  });

  it('clears the session on logout', () => {
    service.login('admin', 'secret');

    service.logout();

    expect(service.authenticated()).toBeNull();
    expect(service.getUsername()).toBeNull();
    expect(service.getAuthorizationHeader()).toBeNull();
  });
});
