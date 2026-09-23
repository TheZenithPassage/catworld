import { HttpErrorResponse } from '@angular/common/http';
import { NgModel } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { ACCOUNT_DELETION_FORBIDDEN_REASON } from '../../../../core/auth/auth-redirect-reason';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;
  let redirectReason: string | null;

  const authApiService = {
    login: vi.fn(),
  };

  const authSessionService = {
    login: vi.fn(),
    logout: vi.fn(),
  };

  const router = {
    url: '/login',
    navigateByUrl: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
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
