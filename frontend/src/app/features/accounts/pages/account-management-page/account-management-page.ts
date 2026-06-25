import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { UserRole } from '../../../../core/auth/auth.model';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { UserAccount } from '../../models/user-account.model';
import { UserAccountApiService } from '../../services/user-account-api.service';

@Component({
  selector: 'app-account-management-page',
  imports: [FormsModule],
  templateUrl: './account-management-page.html',
  styleUrl: './account-management-page.scss',
})
export class AccountManagementPage {
  private readonly userAccountApiService = inject(UserAccountApiService);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly i18nService = inject(I18nService);

  readonly text = this.i18nService.text;
  readonly accounts = signal<UserAccount[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly username = signal('');
  readonly password = signal('');
  readonly newAccountRole = signal<UserRole>('STAFF');
  readonly creating = signal(false);
  readonly pendingAccountIds = signal<ReadonlySet<string>>(new Set());
  readonly roleSelections = signal<Record<string, UserRole>>({});

  constructor() {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.loading.set(true);
    this.loadError.set(null);

    this.userAccountApiService.getAccounts().subscribe({
      next: (accounts) => {
        this.accounts.set(accounts);
        this.roleSelections.set(
          Object.fromEntries(accounts.map((account) => [account.id, account.role])) as Record<
            string,
            UserRole
          >,
        );
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(this.text().accounts.errorLoading);
        this.loading.set(false);
      },
    });
  }

  createAccount(): void {
    this.actionError.set(null);

    if (!this.username().trim()) {
      this.actionError.set(this.text().accounts.create.errors.usernameRequired);
      return;
    }

    if (!this.password()) {
      this.actionError.set(this.text().accounts.create.errors.passwordRequired);
      return;
    }

    this.creating.set(true);

    this.userAccountApiService
      .createAccount({
        username: this.username(),
        password: this.password(),
        role: this.newAccountRole(),
      })
      .pipe(
        finalize(() => {
          this.password.set('');
          this.creating.set(false);
        }),
      )
      .subscribe({
        next: (account) => {
          this.accounts.update((accounts) => [...accounts, account]);
          this.roleSelections.update((selections) => ({
            ...selections,
            [account.id]: account.role,
          }));
          this.username.set('');
          this.newAccountRole.set('STAFF');
        },
        error: (error: unknown) => {
          this.actionError.set(
            this.getApiErrorMessage(
              error,
              this.text().accounts.create.errors.createFailed,
              this.text().accounts.create.errors.duplicateUsername,
            ),
          );
        },
      });
  }

  selectedRole(account: UserAccount): UserRole {
    return this.roleSelections()[account.id] ?? account.role;
  }

  selectRole(accountId: string, role: UserRole): void {
    this.roleSelections.update((selections) => ({ ...selections, [accountId]: role }));
  }

  changeRole(account: UserAccount): void {
    const role = this.selectedRole(account);

    if (role === account.role || this.isPending(account.id)) {
      return;
    }

    this.actionError.set(null);
    this.setPending(account.id, true);

    this.userAccountApiService.changeRole(account.id, role).subscribe({
      next: (updatedAccount) => {
        this.replaceAccount(updatedAccount);
        this.selectRole(updatedAccount.id, updatedAccount.role);
        this.setPending(account.id, false);
        this.endSessionIfCurrentAccountLostAdminAccess(updatedAccount);
      },
      error: (error: unknown) => {
        this.selectRole(account.id, account.role);
        this.setPending(account.id, false);
        this.refreshAccountsIfNotFound(error);

        this.actionError.set(
          this.getApiErrorMessage(
            error,
            this.text().accounts.errors.updateFailed,
            this.text().accounts.errors.lastEnabledAdmin,
          ),
        );
      },
    });
  }

  changeEnabled(account: UserAccount): void {
    if (this.isPending(account.id)) {
      return;
    }

    this.actionError.set(null);
    this.setPending(account.id, true);

    this.userAccountApiService.changeEnabled(account.id, !account.enabled).subscribe({
      next: (updatedAccount) => {
        this.replaceAccount(updatedAccount);
        this.setPending(account.id, false);
        this.endSessionIfCurrentAccountLostAdminAccess(updatedAccount);
      },
      error: (error: unknown) => {
        this.setPending(account.id, false);
        this.refreshAccountsIfNotFound(error);

        this.actionError.set(
          this.getApiErrorMessage(
            error,
            this.text().accounts.errors.updateFailed,
            this.text().accounts.errors.lastEnabledAdmin,
          ),
        );
      },
    });
  }

  isCurrentAccount(account: UserAccount): boolean {
    return account.username === this.authSessionService.getUsername();
  }

  isPending(accountId: string): boolean {
    return this.pendingAccountIds().has(accountId);
  }

  private replaceAccount(updatedAccount: UserAccount): void {
    this.accounts.update((accounts) =>
      accounts.map((account) => (account.id === updatedAccount.id ? updatedAccount : account)),
    );
  }

  private setPending(accountId: string, pending: boolean): void {
    this.pendingAccountIds.update((currentIds) => {
      const nextIds = new Set(currentIds);

      if (pending) {
        nextIds.add(accountId);
      } else {
        nextIds.delete(accountId);
      }

      return nextIds;
    });
  }

  private endSessionIfCurrentAccountLostAdminAccess(account: UserAccount): void {
    if (this.isCurrentAccount(account) && (!account.enabled || account.role !== 'ADMIN')) {
      this.authSessionService.logout();
      this.router.navigate(['/login']);
    }
  }

  private getApiErrorMessage(
    error: unknown,
    fallbackMessage: string,
    conflictMessage: string,
  ): string {
    if (!(error instanceof HttpErrorResponse)) {
      return fallbackMessage;
    }

    if (error.status === 409) {
      return conflictMessage;
    }

    if (error.status === 404) {
      return this.text().accounts.errors.notFound;
    }

    if (error.status !== 400) {
      return fallbackMessage;
    }

    if (this.isValidationErrorMap(error.error)) {
      return this.getValidationErrorMessage(error.error, fallbackMessage);
    }

    return fallbackMessage;
  }

  private isValidationErrorMap(value: unknown): value is Record<string, string> {
    return (
      typeof value === 'object' &&
      value !== null &&
      !Array.isArray(value) &&
      Object.values(value).every((message) => typeof message === 'string')
    );
  }

  private getValidationErrorMessage(
    validationErrors: Record<string, string>,
    fallbackMessage: string,
  ): string {
    const messages = Object.keys(validationErrors).map((field) => {
      if (field === 'username') {
        return this.text().accounts.create.errors.invalidUsername;
      }

      if (field === 'password') {
        return this.text().accounts.create.errors.invalidPassword;
      }

      return this.text().accounts.errors.invalidInput;
    });

    const uniqueMessages = [...new Set(messages)];
    return uniqueMessages.length > 0 ? uniqueMessages.join(' ') : fallbackMessage;
  }

  private refreshAccountsIfNotFound(error: unknown): void {
    if (error instanceof HttpErrorResponse && error.status === 404) {
      this.loadAccounts();
    }
  }
}
