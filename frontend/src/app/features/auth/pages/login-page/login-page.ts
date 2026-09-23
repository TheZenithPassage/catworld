import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { ACCOUNT_DELETION_FORBIDDEN_REASON } from '../../../../core/auth/auth-redirect-reason';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { TrimRequiredDirective } from '../../../../shared/forms/trim-required.directive';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';

@Component({
  selector: 'app-login-page',
  imports: [
    FormsModule,
    MatButton,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    TrimRequiredDirective,
    UiStateComponent,
  ],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss',
})
export class LoginPage {
  private readonly authApiService = inject(AuthApiService);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18nService = inject(I18nService);

  readonly text = this.i18nService.text;
  readonly username = signal('');
  readonly password = signal('');
  readonly submitting = signal(false);
  readonly navigating = signal(false);
  readonly error = createLanguageResetError(this.i18nService.language);
  readonly usernameError = createLanguageResetError(this.i18nService.language);
  readonly passwordError = createLanguageResetError(this.i18nService.language);

  constructor() {
    if (this.route.snapshot.queryParamMap.get('reason') === ACCOUNT_DELETION_FORBIDDEN_REASON) {
      this.error.set(this.text().auth.login.errors.accountDeletionForbidden);
    }
  }

  submit(): void {
    if (this.submitting()) {
      return;
    }

    this.error.set(null);
    this.clearValidationErrors();

    if (!this.username().trim()) {
      this.usernameError.set(this.text().auth.login.errors.usernameRequired);
      return;
    }

    if (!this.password()) {
      this.passwordError.set(this.text().auth.login.errors.passwordRequired);
      return;
    }

    const username = this.username().trim();
    const password = this.password();

    this.submitting.set(true);

    const credentials = { username, password };

    this.authApiService.login(credentials).subscribe({
      next: (user) => {
        this.authSessionService.login(user, credentials);
        this.navigating.set(true);
        void this.router
          .navigateByUrl(this.getReturnUrl())
          .then((navigated) => {
            if (!navigated || this.isLoginUrl(this.router.url)) {
              this.recoverFromNavigationFailure();
            }
          })
          .catch(() => this.recoverFromNavigationFailure());
      },
      error: (error: unknown) => {
        this.authSessionService.logout();
        this.error.set(this.getLoginErrorMessage(error));
        this.submitting.set(false);
      },
    });
  }

  private getReturnUrl(): string {
    return this.route.snapshot.queryParamMap.get('returnUrl') || '/';
  }

  private clearValidationErrors(): void {
    this.usernameError.set(null);
    this.passwordError.set(null);
  }

  private recoverFromNavigationFailure(): void {
    this.authSessionService.logout();
    this.error.set(this.text().auth.login.errors.loginFailed);
    this.navigating.set(false);
    this.submitting.set(false);
  }

  private isLoginUrl(url: string): boolean {
    return url.split(/[?#]/, 1)[0] === '/login';
  }

  private getLoginErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      return this.text().auth.login.errors.invalidCredentials;
    }

    return this.text().auth.login.errors.loginFailed;
  }
}
