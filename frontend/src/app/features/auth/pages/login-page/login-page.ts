import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule],
  templateUrl: './login-page.html',
  styleUrl: './login-page.scss'
})
export class LoginPage {
  private readonly authApiService = inject(AuthApiService);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly username = signal('');
  readonly password = signal('');
  readonly submitting = signal(false);
  readonly error = signal<string | null>(null);

  submit(): void {
    this.error.set(null);

    if (!this.username().trim()) {
      this.error.set('Username is required');
      return;
    }

    if (!this.password()) {
      this.error.set('Password is required');
      return;
    }

    const username = this.username().trim();
    const password = this.password();

    this.submitting.set(true);

    this.authApiService.login({ username, password }).subscribe({
      next: () => {
        this.authSessionService.login(username, password);
        this.submitting.set(false);
        this.router.navigateByUrl(this.getReturnUrl());
      },
      error: (error: unknown) => {
        this.error.set(this.getLoginErrorMessage(error));
        this.submitting.set(false);
      }
    });
  }

  private getReturnUrl(): string {
    return this.route.snapshot.queryParamMap.get('returnUrl') || '/';
  }

  private getLoginErrorMessage(error: unknown): string {
    if (error instanceof HttpErrorResponse && error.status === 401) {
      return 'Invalid username or password';
    }

    return 'Error logging in';
  }
}