import { HttpErrorResponse } from '@angular/common/http';
import { NgModel } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { LoginPage } from './login-page';

describe('LoginPage', () => {
  let component: LoginPage;
  let fixture: ComponentFixture<LoginPage>;

  const authApiService = {
    login: vi.fn(),
  };

  const authSessionService = {
    login: vi.fn(),
    logout: vi.fn(),
  };

  const router = {
    navigateByUrl: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    router.navigateByUrl.mockResolvedValue(true);

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
              queryParamMap: convertToParamMap({
                returnUrl: '/owners',
              }),
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

  it('stores the session and redirects to the return URL after a successful login', () => {
    const user = { username: 'admin', role: 'ADMIN' as const };
    authApiService.login.mockReturnValue(of(user));

    component.username.set('  admin  ');
    component.password.set('secret');

    component.submit();

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
    expect(component.submitting()).toBe(false);
    expect(component.error()).toBeNull();
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

  it('clears every visible error on language change while preserving credentials', () => {
    const i18nService = TestBed.inject(I18nService);
    component.username.set('admin');
    component.password.set('secret');
    component.error.set('page error');
    component.usernameError.set('username error');
    component.passwordError.set('password error');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('page error');

    i18nService.toggleLanguage();
    TestBed.tick();
    fixture.detectChanges();

    expect(component.error()).toBeNull();
    expect(component.usernameError()).toBeNull();
    expect(component.passwordError()).toBeNull();
    expect(component.username()).toBe('admin');
    expect(component.password()).toBe('secret');
    expect(fixture.nativeElement.textContent).not.toContain('page error');
    expect(authApiService.login).not.toHaveBeenCalled();
  });

  it('regenerates a repeated login error in the newly selected language', () => {
    const i18nService = TestBed.inject(I18nService);
    authApiService.login.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 401, statusText: 'Unauthorized' })),
    );
    component.username.set('admin');
    component.password.set('wrong-password');

    component.submit();
    const spanishError = component.error();

    i18nService.toggleLanguage();
    TestBed.tick();

    expect(component.error()).toBeNull();
    expect(component.username()).toBe('admin');
    expect(component.password()).toBe('wrong-password');
    expect(authApiService.login).toHaveBeenCalledTimes(1);

    component.submit();
    fixture.detectChanges();

    expect(component.error()).toBe(component.text().auth.login.errors.invalidCredentials);
    expect(component.error()).not.toBe(spanishError);
    expect(authApiService.login).toHaveBeenCalledTimes(2);
  });

  it('uses the current language when a pending login fails after the switch', () => {
    const i18nService = TestBed.inject(I18nService);
    const loginResult = new Subject<never>();
    authApiService.login.mockReturnValue(loginResult);
    component.username.set('admin');
    component.password.set('secret');

    component.submit();
    i18nService.toggleLanguage();
    TestBed.tick();
    loginResult.error(new Error('network failure'));
    fixture.detectChanges();

    expect(component.error()).toBe(component.text().auth.login.errors.loginFailed);
    expect(fixture.nativeElement.textContent).toContain(
      component.text().auth.login.errors.loginFailed,
    );
  });
});
