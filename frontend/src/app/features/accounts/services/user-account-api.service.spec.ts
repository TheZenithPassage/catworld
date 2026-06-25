import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/config/api.config';
import { UserAccount } from '../models/user-account.model';
import { UserAccountApiService } from './user-account-api.service';

describe('UserAccountApiService', () => {
  const account: UserAccount = {
    id: 'user-1',
    username: 'staff',
    role: 'STAFF',
    enabled: true,
  };

  let service: UserAccountApiService;
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });

    service = TestBed.inject(UserAccountApiService);
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
    TestBed.resetTestingModule();
  });

  it('lists accounts', () => {
    let result: UserAccount[] | undefined;

    service.getAccounts().subscribe((accounts) => (result = accounts));

    const request = httpTestingController.expectOne(`${API_BASE_URL}/users`);
    expect(request.request.method).toBe('GET');
    request.flush([account]);
    expect(result).toEqual([account]);
  });

  it('creates an account with the exact payload, including password whitespace', () => {
    const payload = {
      username: ' New-Staff ',
      password: '  secret value  ',
      role: 'STAFF' as const,
    };

    service.createAccount(payload).subscribe();

    const request = httpTestingController.expectOne(`${API_BASE_URL}/users`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(payload);
    request.flush(account);
  });

  it('changes an account role', () => {
    service.changeRole('user-1', 'ADMIN').subscribe();

    const request = httpTestingController.expectOne(`${API_BASE_URL}/users/user-1/role`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ role: 'ADMIN' });
    request.flush({ ...account, role: 'ADMIN' });
  });

  it('changes an account enabled state', () => {
    service.changeEnabled('user-1', false).subscribe();

    const request = httpTestingController.expectOne(`${API_BASE_URL}/users/user-1/enabled`);
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ enabled: false });
    request.flush({ ...account, enabled: false });
  });
});
