import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { UserAccount } from '../../models/user-account.model';
import { UserAccountApiService } from '../../services/user-account-api.service';
import { AccountManagementPage } from './account-management-page';

describe('AccountManagementPage', () => {
  const adminAccount: UserAccount = {
    id: 'admin-1',
    username: 'admin',
    role: 'ADMIN',
    enabled: true,
  };
  const staffAccount: UserAccount = {
    id: 'staff-1',
    username: 'staff',
    role: 'STAFF',
    enabled: true,
  };

  const userAccountApiService = {
    getAccounts: vi.fn(),
    createAccount: vi.fn(),
    changeRole: vi.fn(),
    changeEnabled: vi.fn(),
  };
  const authSessionService = {
    getUsername: vi.fn(),
    logout: vi.fn(),
  };
  const router = {
    navigate: vi.fn(),
  };

  let component: AccountManagementPage;
  let fixture: ComponentFixture<AccountManagementPage>;

  beforeEach(() => {
    vi.resetAllMocks();
    userAccountApiService.getAccounts.mockReturnValue(of([adminAccount, staffAccount]));
    authSessionService.getUsername.mockReturnValue('admin');
    router.navigate.mockResolvedValue(true);

    TestBed.configureTestingModule({
      imports: [AccountManagementPage],
      providers: [
        { provide: UserAccountApiService, useValue: userAccountApiService },
        { provide: AuthSessionService, useValue: authSessionService },
        { provide: Router, useValue: router },
      ],
    });

    fixture = TestBed.createComponent(AccountManagementPage);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('lists accounts returned by the API', () => {
    expect(userAccountApiService.getAccounts).toHaveBeenCalledOnce();
    expect(component.accounts()).toEqual([adminAccount, staffAccount]);
  });

  it('identifies the current account in the rendered account list', () => {
    fixture.detectChanges();

    const marker = fixture.nativeElement.querySelector('.you-marker') as HTMLElement | null;
    expect(marker?.textContent?.trim()).toBe(component.text().accounts.you);
  });

  it('creates an account and preserves username and password input exactly', () => {
    const createdAccount: UserAccount = {
      id: 'staff-2',
      username: 'new-staff',
      role: 'STAFF',
      enabled: true,
    };
    userAccountApiService.createAccount.mockReturnValue(of(createdAccount));

    component.username.set(' New-Staff ');
    component.password.set('  secret value  ');
    component.newAccountRole.set('STAFF');

    component.createAccount();

    expect(userAccountApiService.createAccount).toHaveBeenCalledWith({
      username: ' New-Staff ',
      password: '  secret value  ',
      role: 'STAFF',
    });
    expect(component.accounts()).toEqual([adminAccount, staffAccount, createdAccount]);
    expect(component.password()).toBe('');
  });

  it('requires a non-empty password before creating an account', () => {
    component.username.set('new-user');
    component.password.set('');

    component.createAccount();

    expect(userAccountApiService.createAccount).not.toHaveBeenCalled();
    expect(component.actionError()).toBe(component.text().accounts.create.errors.passwordRequired);
  });

  it('shows duplicate username errors without adding an account', () => {
    userAccountApiService.createAccount.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            statusText: 'Conflict',
            error: 'User account with username staff already exists',
          }),
      ),
    );
    component.username.set(' STAFF ');
    component.password.set('secret');

    component.createAccount();

    expect(component.accounts()).toEqual([adminAccount, staffAccount]);
    expect(component.actionError()).toBe(component.text().accounts.create.errors.duplicateUsername);
    expect(component.password()).toBe('');

    fixture.detectChanges();
    const error = fixture.nativeElement.querySelector('[role="alert"]') as HTMLElement | null;
    expect(error?.textContent).toContain(component.text().accounts.create.errors.duplicateUsername);
  });

  it('maps structured backend validation errors to Spanish text', () => {
    TestBed.inject(I18nService).language.set('es');
    userAccountApiService.createAccount.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            statusText: 'Bad Request',
            error: {
              username: 'Username must not exceed 255 characters',
              password: 'Password is required',
            },
          }),
      ),
    );
    component.username.set('x'.repeat(256));
    component.password.set('   ');

    component.createAccount();

    expect(component.actionError()).toContain(
      component.text().accounts.create.errors.invalidUsername,
    );
    expect(component.actionError()).toContain(
      component.text().accounts.create.errors.invalidPassword,
    );
    expect(component.actionError()).not.toContain('Username');
    expect(component.actionError()).not.toContain('Password');
  });

  it('updates a role only after a successful response', () => {
    const updatedStaffAccount = { ...staffAccount, role: 'ADMIN' as const };
    userAccountApiService.changeRole.mockReturnValue(of(updatedStaffAccount));
    component.selectRole(staffAccount.id, 'ADMIN');

    component.changeRole(staffAccount);

    expect(userAccountApiService.changeRole).toHaveBeenCalledWith(staffAccount.id, 'ADMIN');
    expect(component.accounts()).toEqual([adminAccount, updatedStaffAccount]);
  });

  it('updates enabled state only after a successful response', () => {
    const disabledStaffAccount = { ...staffAccount, enabled: false };
    userAccountApiService.changeEnabled.mockReturnValue(of(disabledStaffAccount));

    component.changeEnabled(staffAccount);

    expect(userAccountApiService.changeEnabled).toHaveBeenCalledWith(staffAccount.id, false);
    expect(component.accounts()).toEqual([adminAccount, disabledStaffAccount]);
  });

  it('shows the last-enabled-ADMIN error and restores role selection after failure', () => {
    userAccountApiService.changeRole.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            statusText: 'Conflict',
            error: 'At least one enabled ADMIN account is required',
          }),
      ),
    );
    component.selectRole(adminAccount.id, 'STAFF');

    component.changeRole(adminAccount);

    expect(component.accounts()).toEqual([adminAccount, staffAccount]);
    expect(component.selectedRole(adminAccount)).toBe('ADMIN');
    expect(component.actionError()).toBe(component.text().accounts.errors.lastEnabledAdmin);
    expect(authSessionService.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('does not change enabled state after a failed request', () => {
    userAccountApiService.changeEnabled.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
            statusText: 'Server Error',
          }),
      ),
    );

    component.changeEnabled(staffAccount);

    expect(component.accounts()).toEqual([adminAccount, staffAccount]);
    expect(component.actionError()).toBe(component.text().accounts.errors.updateFailed);
  });

  it('keeps the current session and list state after a failed self-disable', () => {
    userAccountApiService.changeEnabled.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            statusText: 'Conflict',
            error: 'At least one enabled ADMIN account is required',
          }),
      ),
    );

    component.changeEnabled(adminAccount);

    expect(component.accounts()).toEqual([adminAccount, staffAccount]);
    expect(authSessionService.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('logs out and redirects after successfully demoting the current administrator', () => {
    userAccountApiService.changeRole.mockReturnValue(of({ ...adminAccount, role: 'STAFF' }));
    component.selectRole(adminAccount.id, 'STAFF');

    component.changeRole(adminAccount);

    expect(authSessionService.logout).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('logs out and redirects after successfully disabling the current administrator', () => {
    userAccountApiService.changeEnabled.mockReturnValue(of({ ...adminAccount, enabled: false }));

    component.changeEnabled(adminAccount);

    expect(authSessionService.logout).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });
});
