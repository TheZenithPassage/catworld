import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../config/api.config';

import { AuthApiService } from './auth-api.service';

describe('AuthApiService', () => {
  let service: AuthApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(AuthApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    TestBed.resetTestingModule();
  });

  it('sends basic credentials when logging in', () => {
    service.login({ username: 'admin', password: 'secret' }).subscribe((user) => {
      expect(user).toEqual({ username: 'admin', role: 'ADMIN' });
    });

    const request = httpTestingController.expectOne(`${API_BASE_URL}/auth/login`);

    expect(request.request.method).toBe('POST');
    expect(request.request.headers.get('Authorization')).toBe(`Basic ${btoa('admin:secret')}`);
    expect(request.request.body).toBeNull();

    request.flush({ username: 'admin', role: 'ADMIN' });
  });
});
