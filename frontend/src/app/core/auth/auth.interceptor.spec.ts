import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { vi } from 'vitest';

import { API_BASE_URL } from '../config/api.config';

import { authInterceptor } from './auth.interceptor';
import { AuthSessionService } from './auth-session.service';

describe('authInterceptor', () => {
  const adminUser = { username: 'admin', role: 'ADMIN' as const };
  const adminCredentials = { username: 'admin', password: 'secret' };

  let authSessionService: AuthSessionService;
  let httpClient: HttpClient;
  let httpTestingController: HttpTestingController;
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    authSessionService = TestBed.inject(AuthSessionService);
    httpClient = TestBed.inject(HttpClient);
    httpTestingController = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
  });

  afterEach(() => {
    httpTestingController.verify();
    vi.restoreAllMocks();
    TestBed.resetTestingModule();
  });

  it('adds the stored authorization header to API requests', () => {
    authSessionService.login(adminUser, adminCredentials);

    httpClient.get(`${API_BASE_URL}/owners`).subscribe();

    const request = httpTestingController.expectOne(`${API_BASE_URL}/owners`);

    expect(request.request.headers.get('Authorization')).toBe(`Basic ${btoa('admin:secret')}`);

    request.flush([]);
  });

  it('does not override an existing authorization header', () => {
    authSessionService.login(adminUser, adminCredentials);

    httpClient
      .get(`${API_BASE_URL}/owners`, {
        headers: {
          Authorization: 'Basic custom-header',
        },
      })
      .subscribe();

    const request = httpTestingController.expectOne(`${API_BASE_URL}/owners`);

    expect(request.request.headers.get('Authorization')).toBe('Basic custom-header');

    request.flush([]);
  });

  it('does not add the stored authorization header to login requests', () => {
    authSessionService.login(adminUser, adminCredentials);

    httpClient.post(`${API_BASE_URL}/auth/login`, null).subscribe();

    const request = httpTestingController.expectOne(`${API_BASE_URL}/auth/login`);

    expect(request.request.headers.has('Authorization')).toBe(false);

    request.flush(adminUser);
  });

  it('logs out and redirects to login when a protected API request returns unauthorized', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const returnUrl = router.url;

    authSessionService.login(adminUser, adminCredentials);

    httpClient.get(`${API_BASE_URL}/owners`).subscribe({
      error: () => undefined,
    });

    const request = httpTestingController.expectOne(`${API_BASE_URL}/owners`);

    request.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authSessionService.authenticated()).toBeNull();
    expect(authSessionService.getRole()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], {
      queryParams: {
        returnUrl,
      },
    });
  });

  it('does not add the stored authorization header to non-API requests', () => {
    authSessionService.login(adminUser, adminCredentials);

    httpClient.get('https://example.com/status').subscribe();

    const request = httpTestingController.expectOne('https://example.com/status');

    expect(request.request.headers.has('Authorization')).toBe(false);

    request.flush({});
  });

  it('logs out and redirects to login with the current route when a protected API request returns unauthorized', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    vi.spyOn(router, 'url', 'get').mockReturnValue('/owners');

    authSessionService.login(adminUser, adminCredentials);

    httpClient.get(`${API_BASE_URL}/owners`).subscribe({
      error: () => undefined,
    });

    const request = httpTestingController.expectOne(`${API_BASE_URL}/owners`);

    request.flush({ error: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });

    expect(authSessionService.authenticated()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], {
      queryParams: {
        returnUrl: '/owners',
      },
    });
  });

  it('does not log out or redirect on non-unauthorized API errors', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);

    authSessionService.login(adminUser, adminCredentials);

    httpClient.get(`${API_BASE_URL}/owners`).subscribe({
      error: () => undefined,
    });

    const request = httpTestingController.expectOne(`${API_BASE_URL}/owners`);

    request.flush({ error: 'Server error' }, { status: 500, statusText: 'Server Error' });

    expect(authSessionService.getUsername()).toBe('admin');
    expect(authSessionService.getRole()).toBe('ADMIN');
    expect(navigateSpy).not.toHaveBeenCalled();
  });

  it('clears a stale ADMIN session when an account-management request returns forbidden', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    authSessionService.login(adminUser, adminCredentials);

    httpClient.patch(`${API_BASE_URL}/users/user-1/role`, { role: 'STAFF' }).subscribe({
      error: () => undefined,
    });

    const request = httpTestingController.expectOne(`${API_BASE_URL}/users/user-1/role`);
    request.flush({ error: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

    expect(authSessionService.authenticated()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], {
      queryParams: {
        returnUrl: router.url,
      },
    });
  });

  it('clears a stale ADMIN session when loading accounts returns forbidden', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    authSessionService.login(adminUser, adminCredentials);

    httpClient.get(`${API_BASE_URL}/users`).subscribe({
      error: () => undefined,
    });

    const request = httpTestingController.expectOne(`${API_BASE_URL}/users`);
    request.flush({ error: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

    expect(authSessionService.authenticated()).toBeNull();
    expect(navigateSpy).toHaveBeenCalledWith(['/login'], {
      queryParams: {
        returnUrl: router.url,
      },
    });
  });

  it('does not clear the session for forbidden responses outside account management', () => {
    const navigateSpy = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    authSessionService.login(adminUser, adminCredentials);

    httpClient.get(`${API_BASE_URL}/owners`).subscribe({
      error: () => undefined,
    });

    const request = httpTestingController.expectOne(`${API_BASE_URL}/owners`);
    request.flush({ error: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });

    expect(authSessionService.getRole()).toBe('ADMIN');
    expect(navigateSpy).not.toHaveBeenCalled();
  });
});
