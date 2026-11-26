import { HttpErrorResponse } from '@angular/common/http';
import { NgModel } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { ACCOUNT_DELETION_FORBIDDEN_REASON } from '../../../../core/auth/auth-redirect-reason';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { DemoApiService, DemoStatus } from '../../../../core/auth/demo-api.service';
import { RuntimeConfigService } from '../../../../core/config/runtime-config.service';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let redirectReason: string | null;

  const authApiService = {
    login: vi.fn(),
    loginDemo: vi.fn(),
  };

  const demoApiService = { getStatus: vi.fn(), requestReset: vi.fn() };
  const demoStatus: DemoStatus = {
    hasAdditionalAccounts: false,
    nextScheduledCheckAt: new Date(Date.now() + 60_000).toISOString(),
    resetState: 'CLEAN',
    resetAvailableAt: null,
  };

  const authSessionService = {
    login: vi.fn(),
    loginDemo: vi.fn(),
    logout: vi.fn(),
  };

  const router = {
    url: '/login',
    navigateByUrl: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    demoApiService.getStatus.mockReturnValue(of(demoStatus));
    redirectReason = null;
    router.url = '/login';
    router.navigateByUrl.mockImplementation(async (url: string) => {
      router.url = url;
      return true;
    });

    await TestBed.configureTestingModule({
      imports: [LoginPage],
      providers: [
        provideNoopAnimations(),
        {
          provide: AuthApiService,
          useValue: authApiService,
        },
        {
          provide: AuthSessionService,
          useValue: authSessionService,
        },
        {
          provide: DemoApiService,
          useValue: demoApiService,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: {
                get: (key: string) => {
                  if (key === 'returnUrl') {
                    return '/owners';
                  }

                  return key === 'reason' ? redirectReason : null;
                },
              },
            },
          },
        },
        {
          provide: Router,
          useValue: router,
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });

  async function submitRenderedForm(): Promise<void> {
    fixture.nativeElement
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function setInputValue(name: string, value: string): void {
    const inputDebugElement = fixture.debugElement.query(By.css(`input[name="${name}"]`));
    const input = inputDebugElement.nativeElement as HTMLInputElement;
    const ngModel = inputDebugElement.injector.get(NgModel);
    const formSignal = (component as unknown as Record<string, { set(value: string): void }>)[name];

    input.value = value;
    ngModel.control.setValue(value);
    ngModel.control.markAsTouched();
    ngModel.control.updateValueAndValidity();
    formSignal?.set(value);
    fixture.detectChanges();
  }

  function getMaterialErrorText(): string {
    return [...fixture.nativeElement.querySelectorAll('mat-error')]
      .map((error) => error.textContent?.trim())
      .join(' ');
  }

  it('renders Material login fields and submit action', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('mat-form-field')).toHaveLength(2);
    expect(compiled.querySelector('input[name="username"]')).not.toBeNull();
    expect(compiled.querySelector('input[name="password"]')).not.toBeNull();
    expect(compiled.querySelector('button[mat-flat-button]')).not.toBeNull();
  });

  it('opens the same workspace from the demo button without credential fields', async () => {
    const user = { username: 'demo', role: 'ADMIN' as const };
    authApiService.loginDemo.mockReturnValue(of({ user, generation: 'generation-1' }));
    TestBed.inject(RuntimeConfigService).demoMode.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('input')).toBeNull();
    const button = compiled.querySelector<HTMLButtonElement>('button[mat-flat-button]');
    expect(button?.textContent?.trim()).toBe(component.text().auth.demo.enter);

    button?.click();
    await fixture.whenStable();

    expect(authApiService.loginDemo).toHaveBeenCalledOnce();
    expect(authApiService.login).not.toHaveBeenCalled();
    expect(authSessionService.loginDemo).toHaveBeenCalledWith(user, 'generation-1');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/owners');
  });

  it('offers credential login alongside quick access when other demo accounts exist', async () => {
    const user = { username: 'visitor', role: 'STAFF' as const };
    demoApiService.getStatus.mockReturnValue(of({ ...demoStatus, hasAdditionalAccounts: true }));
    authApiService.loginDemo.mockReturnValue(of({ user, generation: 'generation-2' }));
    TestBed.inject(RuntimeConfigService).demoMode.set(true);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('button[mat-flat-button]')?.textContent?.trim()).toBe(
      component.text().auth.demo.enter,
    );
    expect(compiled.querySelector('form')?.textContent).toContain(
      component.text().auth.demo.inventedCredentials,
    );
    setInputValue('username', 'visitor');
    setInputValue('password', 'invented-password');
    await submitRenderedForm();

    const credentials = { username: 'visitor', password: 'invented-password' };
    expect(authApiService.loginDemo).toHaveBeenCalledWith(credentials);
    expect(authSessionService.login).toHaveBeenCalledWith(user, credentials, 'generation-2');
    expect(router.navigateByUrl).toHaveBeenCalledWith('/owners');
  });

  it('keeps both demo sign-in methods blocked through a queued reset and recovers after a failed poll', () => {
    vi.useFakeTimers();
    const reset = new Subject<DemoStatus>();
    const recovered = new Subject<DemoStatus>();
    const active = { ...demoStatus, hasAdditionalAccounts: true };
    demoApiService.getStatus
      .mockReturnValueOnce(of({ ...active, resetState: 'AVAILABLE' }))
      .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 530 })))
      .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 429 })))
      .mockReturnValueOnce(recovered);
    demoApiService.requestReset.mockReturnValue(reset);
    TestBed.inject(RuntimeConfigService).demoMode.set(true);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const signInButtons = [...page.querySelectorAll<HTMLButtonElement>('button[mat-flat-button]')];
    const confirmation = vi.spyOn(window, 'confirm').mockReturnValue(true);
    component.requestDemoReset();
    confirmation.mockRestore();
    fixture.detectChanges();
    expect(signInButtons.map((button) => button.disabled)).toEqual([true, true]);
    reset.next({ ...active, resetState: 'QUEUED' });
    reset.complete();

    vi.advanceTimersByTime(5_000);
    fixture.detectChanges();

    expect(page.querySelectorAll('aside [role="status"]')).toHaveLength(1);
    expect(page.querySelector('[role="alert"]')).toBeNull();
    expect(signInButtons.map((button) => button.disabled)).toEqual([true, true]);
    component.username.set('visitor');
    component.password.set('invented-password');
    component.enterDemo();
    page.querySelector('form')?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    expect(authApiService.loginDemo).not.toHaveBeenCalled();

    vi.advanceTimersByTime(5_000);
    fixture.detectChanges();
    expect(page.querySelector('[role="alert"]')).toBeNull();
    vi.advanceTimersByTime(5_000);
    component.loadDemoStatus();
    expect(demoApiService.getStatus).toHaveBeenCalledTimes(4);
    recovered.next(demoStatus);
    recovered.complete();
    fixture.detectChanges();

    expect(signInButtons[0].disabled).toBe(false);
    expect(page.querySelector('form')).toBeNull();
    expect(page.querySelector('aside [role="status"]')?.textContent).toContain(
      component.text().auth.demo.resetStatus.CLEAN,
    );
    expect(demoApiService.requestReset).toHaveBeenCalledOnce();
  });

  it('reconnects after a demo sign-in hits an outage and slows the status checks after a minute', () => {
    vi.useFakeTimers();
    demoApiService.getStatus
      .mockReturnValueOnce(of(demoStatus))
      .mockReturnValue(throwError(() => new HttpErrorResponse({ status: 503 })));
    authApiService.loginDemo.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 0 })),
    );
    TestBed.inject(RuntimeConfigService).demoMode.set(true);
    fixture.detectChanges();

    const page = fixture.nativeElement as HTMLElement;
    const enter = page.querySelector<HTMLButtonElement>('button[mat-flat-button]')!;
    enter.click();
    fixture.detectChanges();

    expect(enter.disabled).toBe(true);
    expect(page.querySelector('[role="alert"]')).toBeNull();
    expect(page.querySelector('aside [role="status"]')?.textContent).toContain(
      component.text().auth.demo.reconnecting,
    );

    vi.advanceTimersByTime(60_000);
    fixture.detectChanges();

    expect(page.querySelector('[role="alert"]')?.textContent).toContain(
      component.text().auth.demo.statusUnavailable,
    );
    expect(page.querySelector('aside [role="status"]')).toBeNull();
    const retry = [...page.querySelectorAll<HTMLButtonElement>('aside button')].find(
      (button) => button.textContent?.trim() === component.text().auth.demo.retry,
    );
    const readsBeforeRetry = demoApiService.getStatus.mock.calls.length;
    retry?.click();
    expect(demoApiService.getStatus).toHaveBeenCalledTimes(readsBeforeRetry + 1);

    vi.advanceTimersByTime(14_999);
    expect(demoApiService.getStatus).toHaveBeenCalledTimes(readsBeforeRetry + 1);
    demoApiService.getStatus.mockReturnValue(of(demoStatus));
    vi.advanceTimersByTime(1);
    fixture.detectChanges();

    expect(enter.disabled).toBe(false);
    expect(page.querySelector('[role="alert"]')).toBeNull();
    expect(authApiService.loginDemo).toHaveBeenCalledOnce();
  });

  it('renders a localized explanation after a forbidden account deletion redirect', () => {
    fixture.destroy();
    redirectReason = ACCOUNT_DELETION_FORBIDDEN_REASON;
    fixture = TestBed.createComponent(LoginPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      component.text().auth.login.errors.accountDeletionForbidden,
    );
  });

  it('does not submit when the username is blank', async () => {
    fixture.detectChanges();
    setInputValue('username', '   ');
    setInputValue('password', 'secret');
    await submitRenderedForm();

    expect(authApiService.login).not.toHaveBeenCalled();
    expect(component.usernameError()).toBe(component.text().auth.login.errors.usernameRequired);
    expect(getMaterialErrorText()).toContain(component.text().auth.login.errors.usernameRequired);
    expect(component.error()).toBeNull();
  });

  it('does not submit when the password is blank', () => {
    component.username.set('admin');
    component.password.set('');

    component.submit();

    expect(authApiService.login).not.toHaveBeenCalled();
    expect(component.passwordError()).toBe(component.text().auth.login.errors.passwordRequired);
    expect(component.error()).toBeNull();
  });

  it('stores the session and remains pending while redirecting to the return URL', async () => {
    const user = { username: 'admin', role: 'ADMIN' as const };
    authApiService.login.mockReturnValue(of(user));

    component.username.set('  admin  ');
    component.password.set('secret');

    component.submit();
    await fixture.whenStable();

    expect(authApiService.login).toHaveBeenCalledWith({
      username: 'admin',
      password: 'secret',
    });
    expect(authSessionService.login).toHaveBeenCalledWith(user, {
      username: 'admin',
      password: 'secret',
    });
    expect(authSessionService.logout).not.toHaveBeenCalled();
    expect(router.navigateByUrl).toHaveBeenCalledWith('/owners');
    expect(component.submitting()).toBe(true);
    expect(component.navigating()).toBe(true);
    expect(component.error()).toBeNull();
  });

  it('shows shared loading and prevents duplicate authentication while navigation is pending', () => {
    authApiService.login.mockReturnValue(of({ username: 'admin', role: 'ADMIN' as const }));
    router.navigateByUrl.mockReturnValue(new Promise<boolean>(() => undefined));
    component.username.set('admin');
    component.password.set('secret');

    component.submit();
    component.submit();
    fixture.detectChanges();

    expect(authApiService.login).toHaveBeenCalledOnce();
    expect(component.navigating()).toBe(true);
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="status"]')?.textContent).toContain(
      component.text().auth.login.navigating,
    );
    expect(fixture.nativeElement.querySelector('mat-progress-spinner')).not.toBeNull();
  });

  it('clears the session and restores login when navigation is cancelled', async () => {
    authApiService.login.mockReturnValue(of({ username: 'admin', role: 'ADMIN' as const }));
    router.navigateByUrl.mockResolvedValue(false);
    component.username.set('admin');
    component.password.set('secret');

    component.submit();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(authSessionService.logout).toHaveBeenCalledOnce();
    expect(component.submitting()).toBe(false);
    expect(component.navigating()).toBe(false);
    expect(fixture.nativeElement.querySelector('form')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      component.text().auth.login.errors.loginFailed,
    );
  });

  it('clears the session and restores login when navigation rejects', async () => {
    authApiService.login.mockReturnValue(of({ username: 'admin', role: 'ADMIN' as const }));
    router.navigateByUrl.mockRejectedValue(new Error('router detail'));
    component.username.set('admin');
    component.password.set('secret');

    component.submit();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(authSessionService.logout).toHaveBeenCalledOnce();
    expect(component.submitting()).toBe(false);
    expect(component.navigating()).toBe(false);
    expect(fixture.nativeElement.textContent).not.toContain('router detail');
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      component.text().auth.login.errors.loginFailed,
    );
  });

  it('recovers when navigation reports success but the active route remains login', async () => {
    authApiService.login.mockReturnValue(of({ username: 'admin', role: 'ADMIN' as const }));
    router.navigateByUrl.mockResolvedValue(true);
    component.username.set('admin');
    component.password.set('secret');

    component.submit();
    await fixture.whenStable();

    expect(router.url).toBe('/login');
    expect(authSessionService.logout).toHaveBeenCalledOnce();
    expect(component.submitting()).toBe(false);
  });

  it('shows the invalid credentials message when login returns unauthorized', () => {
    authApiService.login.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
          }),
      ),
    );

    component.username.set('admin');
    component.password.set('wrong-password');

    component.submit();

    expect(component.error()).toBe(component.text().auth.login.errors.invalidCredentials);
    expect(component.submitting()).toBe(false);
    expect(authSessionService.login).not.toHaveBeenCalled();
    expect(authSessionService.logout).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).not.toHaveBeenCalled();

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain(
      component.text().auth.login.errors.invalidCredentials,
    );
  });
});
