import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
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
  readonly error = this.i18nService.createErrorSignal();
  readonly usernameError = this.i18nService.createErrorSignal();
  readonly passwordError = this.i18nService.createErrorSignal();

  submit(): void {
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
        this.submitting.set(false);
        this.router.navigateByUrl(this.getReturnUrl());
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

  private getLoginErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      return this.text().auth.login.errors.invalidCredentials;
    }

    return this.text().auth.login.errors.loginFailed;
  }
}
