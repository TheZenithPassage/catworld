import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, computed, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize, Observable, Subscription, tap, timeout, TimeoutError, timer } from 'rxjs';

import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { ACCOUNT_DELETION_FORBIDDEN_REASON } from '../../../../core/auth/auth-redirect-reason';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { DemoApiService, DemoStatus } from '../../../../core/auth/demo-api.service';
import { RuntimeConfigService } from '../../../../core/config/runtime-config.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { createLanguageResetError } from '../../../../core/i18n/language-reset-error';
import { TrimRequiredDirective } from '../../../../shared/forms/trim-required.directive';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';

const DEMO_STATUS_INTERVAL = 5_000;
const DEMO_STATUS_TIMEOUT = 8_000;
const DEMO_RECONNECT_WINDOW = 60_000;
const DEMO_UNAVAILABLE_INTERVAL = 15_000;

function isTemporaryDemoError(error: unknown): boolean {
  return (
    error instanceof TimeoutError ||
    (error instanceof HttpErrorResponse &&
      (error.status === 0 || (error.status >= 500 && error.status < 600)))
  );
}

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
export class LoginPage implements OnInit {
  private readonly authApiService = inject(AuthApiService);
  private readonly authSessionService = inject(AuthSessionService);
  private readonly demoApiService = inject(DemoApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly i18nService = inject(I18nService);
  private readonly browserWindow = inject(DOCUMENT).defaultView;
  private readonly destroyRef = inject(DestroyRef);
  private readonly demoConnectionLostAt = signal<number | null>(null);
  private demoStatusRefresh?: Subscription;

  readonly text = this.i18nService.text;
  readonly demoMode = inject(RuntimeConfigService).demoMode;
  readonly username = signal('');
  readonly password = signal('');
  readonly submitting = signal(false);
  readonly navigating = signal(false);
  readonly error = createLanguageResetError(this.i18nService.language);
  readonly usernameError = createLanguageResetError(this.i18nService.language);
  readonly passwordError = createLanguageResetError(this.i18nService.language);
  readonly demoStatus = signal<DemoStatus | null>(null);
  readonly demoStatusFailed = signal(false);
  readonly demoResetFailed = signal(false);
  readonly loadingDemoStatus = signal(false);
  readonly resettingDemo = signal(false);
  readonly demoLoginBlocked = computed(
    () =>
      this.demoMode() &&
      (this.resettingDemo() ||
        this.demoStatus()?.resetState === 'QUEUED' ||
        this.demoConnectionLostAt() !== null),
  );
  readonly demoStatusMessage = computed(() => {
    const state = this.demoStatus()?.resetState;
    const copy = this.text().auth.demo;
    if (state === 'QUEUED') {
      return copy.resetStatus.QUEUED;
    }
    if (this.demoConnectionLostAt() !== null) {
      return copy.reconnecting;
    }
    return state && state !== 'AVAILABLE' ? copy.resetStatus[state] : null;
  });
  readonly canRequestDemoReset = computed(
    () =>
      this.demoStatus()?.resetState === 'AVAILABLE' &&
      !this.loadingDemoStatus() &&
      !this.demoStatusFailed() &&
      !this.demoLoginBlocked() &&
      !this.submitting(),
  );

  constructor() {
    if (this.route.snapshot.queryParamMap.get('reason') === ACCOUNT_DELETION_FORBIDDEN_REASON) {
      this.error.set(this.text().auth.login.errors.accountDeletionForbidden);
    }
  }

  ngOnInit(): void {
    if (this.demoMode()) {
      this.loadDemoStatus();
    }
  }

  enterDemo(): void {
    if (this.submitting() || this.demoLoginBlocked()) {
      return;
    }

    this.error.set(null);
    this.clearValidationErrors();
    this.startLogin(
      this.authApiService
        .loginDemo()
        .pipe(tap(({ user, generation }) => this.authSessionService.loginDemo(user, generation))),
      true,
    );
  }

  submit(): void {
    if (this.submitting() || this.demoLoginBlocked()) {
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

    const credentials = { username: this.username().trim(), password: this.password() };
    if (this.demoMode()) {
      this.startLogin(
        this.authApiService
          .loginDemo(credentials)
          .pipe(
            tap(({ user, generation }) =>
              this.authSessionService.login(user, credentials, generation),
            ),
          ),
      );
      return;
    }

    this.startLogin(
      this.authApiService
        .login(credentials)
        .pipe(tap((user) => this.authSessionService.login(user, credentials))),
    );
  }

  loadDemoStatus(): void {
    if (this.loadingDemoStatus() || this.resettingDemo()) {
      return;
    }

    this.demoStatusRefresh?.unsubscribe();
    this.loadingDemoStatus.set(true);
    this.demoApiService
      .getStatus()
      .pipe(
        timeout({ first: DEMO_STATUS_TIMEOUT }),
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.loadingDemoStatus.set(false)),
      )
      .subscribe({
        next: (status) => this.updateDemoStatus(status),
        error: (error: unknown) => {
          const rateLimited = error instanceof HttpErrorResponse && error.status === 429;
          if (rateLimited || isTemporaryDemoError(error)) {
            this.reconnectToDemo();
          } else {
            this.demoStatusFailed.set(true);
          }
        },
      });
  }

  requestDemoReset(): void {
    if (
      !this.canRequestDemoReset() ||
      !this.browserWindow?.confirm(this.text().auth.demo.confirmReset)
    ) {
      return;
    }

    this.demoStatusRefresh?.unsubscribe();
    this.demoResetFailed.set(false);
    this.resettingDemo.set(true);
    this.demoApiService
      .requestReset()
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        finalize(() => this.resettingDemo.set(false)),
      )
      .subscribe({
        next: (status) => this.updateDemoStatus(status),
        error: (error: unknown) => {
          if (error instanceof HttpErrorResponse && error.status === 429) {
            const status = error.error as DemoStatus | null;
            if (status?.resetState === 'COOLDOWN' || status?.resetState === 'LIMIT_REACHED') {
              this.updateDemoStatus(status);
              return;
            }
          }
          if (isTemporaryDemoError(error)) {
            this.reconnectToDemo();
          } else {
            this.demoResetFailed.set(true);
          }
        },
      });
  }

  formatDemoTime(instant: string): string {
    return new Intl.DateTimeFormat(this.i18nService.dateLocale(), {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(instant));
  }

  private updateDemoStatus(status: DemoStatus): void {
    this.demoStatus.set(status);
    this.demoConnectionLostAt.set(null);
    this.demoStatusFailed.set(false);
    this.demoResetFailed.set(false);
    const nextCheck = Date.parse(status.nextScheduledCheckAt);
    const nextAvailability = status.resetAvailableAt
      ? Date.parse(status.resetAvailableAt)
      : Infinity;
    const delay =
      status.resetState === 'QUEUED'
        ? DEMO_STATUS_INTERVAL
        : Math.max(DEMO_STATUS_INTERVAL, Math.min(nextCheck, nextAvailability) - Date.now());
    this.scheduleDemoStatusRefresh(delay);
  }

  private reconnectToDemo(): void {
    const now = Date.now();
    const lostAt = this.demoConnectionLostAt() ?? now;
    const unavailable = now - lostAt >= DEMO_RECONNECT_WINDOW;
    this.demoConnectionLostAt.set(lostAt);
    this.demoStatusFailed.set(unavailable);
    this.demoResetFailed.set(false);
    this.scheduleDemoStatusRefresh(unavailable ? DEMO_UNAVAILABLE_INTERVAL : DEMO_STATUS_INTERVAL);
  }

  private scheduleDemoStatusRefresh(delay: number): void {
    this.demoStatusRefresh?.unsubscribe();
    this.demoStatusRefresh = timer(delay)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadDemoStatus());
  }

  private startLogin(login: Observable<unknown>, quickLogin = false): void {
    this.submitting.set(true);
    login.subscribe({
      next: () => {
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
        if (this.demoMode() && isTemporaryDemoError(error)) {
          this.reconnectToDemo();
        } else {
          this.error.set(this.getLoginErrorMessage(error, quickLogin));
        }
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

  private getLoginErrorMessage(error: unknown, quickLogin: boolean): string {
    if (!quickLogin && error instanceof HttpErrorResponse && error.status === 401) {
      return this.text().auth.login.errors.invalidCredentials;
    }

    return this.text().auth.login.errors.loginFailed;
  }
}
