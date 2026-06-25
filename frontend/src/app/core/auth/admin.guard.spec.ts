import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { TestBed } from '@angular/core/testing';

import { adminGuard } from './admin.guard';
import { AuthSessionService } from './auth-session.service';

describe('adminGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => adminGuard(...guardParameters));

  let authSessionService: AuthSessionService;
  let router: Router;

  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/accounts' } as RouterStateSnapshot;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });

    authSessionService = TestBed.inject(AuthSessionService);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('allows an authenticated ADMIN', () => {
    authSessionService.login(
      { username: 'admin', role: 'ADMIN' },
      { username: 'admin', password: 'secret' },
    );

    expect(executeGuard(route, state)).toBe(true);
  });

  it('redirects an authenticated STAFF user to the dashboard', () => {
    authSessionService.login(
      { username: 'staff', role: 'STAFF' },
      { username: 'staff', password: 'secret' },
    );

    const result = executeGuard(route, state);

    expect(router.serializeUrl(result as UrlTree)).toBe('/');
  });

  it('uses the existing login flow for an unauthenticated user', () => {
    const result = executeGuard(route, state);

    expect(router.serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Faccounts');
  });
});
