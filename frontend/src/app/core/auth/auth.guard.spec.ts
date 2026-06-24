import {
  ActivatedRouteSnapshot,
  CanActivateFn,
  Router,
  RouterStateSnapshot,
  UrlTree,
  provideRouter,
} from '@angular/router';
import { TestBed } from '@angular/core/testing';

import { authGuard } from './auth.guard';
import { AuthSessionService } from './auth-session.service';

describe('authGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) =>
    TestBed.runInInjectionContext(() => authGuard(...guardParameters));

  let authSessionService: AuthSessionService;
  let router: Router;

  const route = {} as ActivatedRouteSnapshot;
  const state = { url: '/owners' } as RouterStateSnapshot;

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

  it('allows navigation when the user is authenticated', () => {
    authSessionService.login(
      { username: 'admin', role: 'ADMIN' },
      { username: 'admin', password: 'secret' },
    );

    expect(executeGuard(route, state)).toBe(true);
  });

  it('redirects to login with returnUrl when the user is not authenticated', () => {
    const result = executeGuard(route, state);

    expect(router.serializeUrl(result as UrlTree)).toBe('/login?returnUrl=%2Fowners');
  });
});
