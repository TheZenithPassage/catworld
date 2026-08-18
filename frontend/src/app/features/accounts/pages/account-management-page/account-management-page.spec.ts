import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
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
    deleteAccount: vi.fn(),
  };
  const dialog = {
    open: vi.fn(),
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

  beforeEach(async () => {
    vi.resetAllMocks();
    userAccountApiService.getAccounts.mockReturnValue(of([adminAccount, staffAccount]));
    authSessionService.getUsername.mockReturnValue('admin');
    router.navigate.mockResolvedValue(true);
    dialog.open.mockReturnValue({ afterClosed: () => of(false) });

    await TestBed.configureTestingModule({
      imports: [AccountManagementPage],
      providers: [
        provideNoopAnimations(),
        { provide: UserAccountApiService, useValue: userAccountApiService },
        { provide: AuthSessionService, useValue: authSessionService },
        { provide: Router, useValue: router },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();

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

    const marker = fixture.nativeElement.querySelector(
      '.current-account-marker',
    ) as HTMLElement | null;
    expect(marker?.textContent?.trim()).toBe(`(${component.text().accounts.you})`);
  });

  it('renders the account list through a Material table with existing row actions', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const headerText = [...compiled.querySelectorAll('th')]
      .map((header) => header.textContent?.trim())
      .join(' ');

    expect(compiled.querySelector('table[mat-table]')).not.toBeNull();
    expect(headerText).toContain(component.text().accounts.table.username);
    expect(headerText).toContain(component.text().accounts.table.actions);
    expect(compiled.textContent).toContain('admin');
    expect(compiled.textContent).toContain('staff');
    expect(compiled.querySelectorAll('.account-form mat-form-field')).toHaveLength(3);
    expect(compiled.querySelectorAll('.role-action mat-form-field')).toHaveLength(1);
    expect(compiled.querySelectorAll('.role-action button')).toHaveLength(0);
    expect(compiled.querySelector('button[mat-flat-button]')?.textContent).toContain(
      component.text().accounts.create.submit,
    );
    expect(compiled.querySelectorAll('button[mat-stroked-button]').length).toBeGreaterThanOrEqual(
      2,
    );
  });

  it('renders permanent deletion only for the non-current account', () => {
    fixture.detectChanges();

    const deleteActions = [
      ...fixture.nativeElement.querySelectorAll('.delete-account-action'),
    ] as HTMLButtonElement[];

    expect(deleteActions).toHaveLength(1);
    expect(deleteActions[0].textContent).toContain(
      component.text().accounts.actions.deletePermanently,
    );
    expect(deleteActions[0].closest('tr')?.textContent).toContain(staffAccount.username);
    expect(deleteActions[0].closest('tr')?.textContent).not.toContain(adminAccount.username);
  });

  it('fixes the current administrator role and omits its disable action', () => {
    fixture.detectChanges();

    const currentRow = fixture.nativeElement
      .querySelector('.current-account-marker')
      ?.closest('tr') as HTMLTableRowElement | null;
    const rows = [...fixture.nativeElement.querySelectorAll('tr')] as HTMLTableRowElement[];
    const otherRow = rows.find((row) => row.textContent?.includes(staffAccount.username));
    expect(currentRow?.querySelector('select')).toBeNull();
    expect(currentRow?.textContent).toContain(component.text().accounts.roles.admin);
    expect(currentRow?.textContent).not.toContain(component.text().accounts.actions.disable);
    expect(otherRow?.textContent).toContain(component.text().accounts.actions.disable);
  });

  it('uses the shared confirmation subject and sends no request when deletion is cancelled', () => {
    component.confirmDeleteAccount(staffAccount);

    expect(dialog.open).toHaveBeenCalledWith(expect.any(Function), {
      data: { subject: staffAccount.username },
    });
    expect(userAccountApiService.deleteAccount).not.toHaveBeenCalled();
    expect(component.accounts()).toEqual([adminAccount, staffAccount]);
  });

  it('removes a confirmed deleted account from the rendered list without reloading', () => {
    dialog.open.mockReturnValue({ afterClosed: () => of(true) });
    userAccountApiService.deleteAccount.mockReturnValue(of(undefined));

    component.confirmDeleteAccount(staffAccount);
    fixture.detectChanges();

    expect(userAccountApiService.deleteAccount).toHaveBeenCalledOnce();
    expect(userAccountApiService.deleteAccount).toHaveBeenCalledWith(staffAccount.id);
    expect(userAccountApiService.getAccounts).toHaveBeenCalledOnce();
    expect(component.accounts()).toEqual([adminAccount]);
    expect(fixture.nativeElement.textContent).not.toContain(staffAccount.username);
  });

  it('prevents duplicate account actions while confirmed deletion is pending', () => {
    const deletion = new Subject<void>();
    dialog.open.mockReturnValue({ afterClosed: () => of(true) });
    userAccountApiService.deleteAccount.mockReturnValue(deletion);

    component.confirmDeleteAccount(staffAccount);
    component.confirmDeleteAccount(staffAccount);
    fixture.detectChanges();

    expect(dialog.open).toHaveBeenCalledOnce();
    expect(userAccountApiService.deleteAccount).toHaveBeenCalledOnce();
    expect(component.isPending(staffAccount.id)).toBe(true);
    expect(component.isDeleting(staffAccount.id)).toBe(true);
    const row = [...fixture.nativeElement.querySelectorAll('tr')].find((candidate: Element) =>
      candidate.textContent?.includes(staffAccount.username),
    );
    const rowButtons = [...(row?.querySelectorAll('button') ?? [])] as HTMLButtonElement[];
    expect(rowButtons.length).toBeGreaterThan(0);
    expect(rowButtons.every((button) => button.disabled)).toBe(true);
    expect(row?.textContent).toContain(component.text().accounts.actions.deleting);
  });

  it.each([[409, 'deletionConflict']] as const)(
    'keeps the account and shows the expected deletion error for status %i',
    (status, messageKey) => {
      dialog.open.mockReturnValue({ afterClosed: () => of(true) });
      userAccountApiService.deleteAccount.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status })),
      );

      component.confirmDeleteAccount(staffAccount);
      fixture.detectChanges();

      expect(component.accounts()).toEqual([adminAccount, staffAccount]);
      expect(component.isPending(staffAccount.id)).toBe(false);
      expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
        component.text().accounts.errors[messageKey],
      );
    },
  );

  it('refreshes stale accounts and shows a useful message after deletion returns not found', () => {
    dialog.open.mockReturnValue({ afterClosed: () => of(true) });
    userAccountApiService.deleteAccount.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 404 })),
    );
    userAccountApiService.getAccounts.mockReturnValueOnce(of([adminAccount]));

    component.confirmDeleteAccount(staffAccount);
    fixture.detectChanges();

    expect(userAccountApiService.getAccounts).toHaveBeenCalledTimes(2);
    expect(component.accounts()).toEqual([adminAccount]);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      component.text().accounts.errors.deletionNotFound,
    );
  });

  it('renders loading, empty, and load-error states without the Material table', () => {
    component.loading.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(component.text().accounts.loading);
    expect(fixture.nativeElement.querySelector('table[mat-table]')).toBeNull();

    component.loading.set(false);
    component.accounts.set([]);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(component.text().accounts.empty);
    expect(fixture.nativeElement.querySelector('table[mat-table]')).toBeNull();

    component.loadError.set(component.text().accounts.errorLoading);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(component.text().accounts.errorLoading);
    expect(fixture.nativeElement.textContent).toContain(component.text().accounts.retry);
    expect(fixture.nativeElement.querySelector('table[mat-table]')).toBeNull();
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

  it('shows the last-enabled-ADMIN error and restores another account role after failure', () => {
    const otherAdmin = { ...staffAccount, role: 'ADMIN' as const };
    component.accounts.set([adminAccount, otherAdmin]);
    component.selectRole(otherAdmin.id, 'STAFF');
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
    component.changeRole(otherAdmin);

    expect(component.accounts()).toEqual([adminAccount, otherAdmin]);
    expect(component.selectedRole(otherAdmin)).toBe('ADMIN');
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

  it('does not send a self-disable request or end the current session', () => {
    component.changeEnabled(adminAccount);

    expect(component.accounts()).toEqual([adminAccount, staffAccount]);
    expect(userAccountApiService.changeEnabled).not.toHaveBeenCalled();
    expect(authSessionService.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('does not send a self-demotion request or end the current session', () => {
    component.selectRole(adminAccount.id, 'STAFF');

    component.changeRole(adminAccount);

    expect(component.selectedRole(adminAccount)).toBe('ADMIN');
    expect(userAccountApiService.changeRole).not.toHaveBeenCalled();
    expect(authSessionService.logout).not.toHaveBeenCalled();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
