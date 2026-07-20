import { HttpErrorResponse } from '@angular/common/http';
import { NgModel } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
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
    localStorage.clear();
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
    localStorage.clear();
  });

  async function submitRenderedForm(): Promise<void> {
    fixture.nativeElement
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function setInputValue(name: string, value: string): void {
    const input = getInput(name);
    const ngModel = getInputModel(name);
    const formSignal = (component as unknown as Record<string, { set(value: string): void }>)[name];

    input.value = value;
    ngModel.control.setValue(value);
    ngModel.control.markAsTouched();
    ngModel.control.markAsDirty();
    ngModel.control.updateValueAndValidity();
    formSignal?.set(value);
    fixture.detectChanges();
  }

  function getInput(name: string): HTMLInputElement {
    return fixture.debugElement.query(By.css(`input[name="${name}"]`))
      .nativeElement as HTMLInputElement;
  }

  function getInputModel(name: string): NgModel {
    return fixture.debugElement.query(By.css(`input[name="${name}"]`)).injector.get(NgModel);
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

  it('clears every rendered login error channel when the language changes', async () => {
    fixture.detectChanges();
    setInputValue('username', '   ');
    setInputValue('password', '');
    await submitRenderedForm();

    const spanishErrors = component.text().auth.login.errors;
    component.error.set(spanishErrors.loginFailed);
    component.passwordError.set(spanishErrors.passwordRequired);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      spanishErrors.loginFailed,
    );
    expect(getMaterialErrorText()).toContain(spanishErrors.usernameRequired);
    expect(getMaterialErrorText()).toContain(spanishErrors.passwordRequired);

    TestBed.inject(I18nService).language.set('en');
    fixture.detectChanges();

    expect(component.error()).toBeNull();
    expect(component.usernameError()).toBeNull();
    expect(component.passwordError()).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.querySelectorAll('mat-error')).toHaveLength(0);
  });

  it('clears multiple Spanish validation errors and retriggers the unchanged condition in English', async () => {
    fixture.detectChanges();
    setInputValue('username', '   ');
    setInputValue('password', '');
    await submitRenderedForm();

    const spanishErrors = component.text().auth.login.errors;
    component.passwordError.set(spanishErrors.passwordRequired);
    fixture.detectChanges();

    expect(getMaterialErrorText()).toContain(spanishErrors.usernameRequired);
    expect(getMaterialErrorText()).toContain(spanishErrors.passwordRequired);

    const usernameModel = getInputModel('username');
    const passwordModel = getInputModel('password');

    TestBed.inject(I18nService).language.set('en');
    fixture.detectChanges();

    expect(getMaterialErrorText()).toBe('');
    expect(component.username()).toBe('   ');
    expect(component.password()).toBe('');
    expect(getInput('username').value).toBe('   ');
    expect(getInput('password').value).toBe('');
    expect(usernameModel.touched).toBe(true);
    expect(usernameModel.dirty).toBe(true);
    expect(passwordModel.touched).toBe(true);
    expect(passwordModel.dirty).toBe(true);
    expect(authApiService.login).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();

    await submitRenderedForm();

    const englishErrors = component.text().auth.login.errors;
    expect(component.usernameError()).toBe(englishErrors.usernameRequired);
    expect(component.passwordError()).toBeNull();
    expect(getMaterialErrorText()).toContain(englishErrors.usernameRequired);
    expect(getMaterialErrorText()).not.toContain(spanishErrors.usernameRequired);
    expect(authApiService.login).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('preserves entered credentials and interaction state without retrying or navigating', async () => {
    authApiService.login.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
          }),
      ),
    );
    fixture.detectChanges();
    setInputValue('username', 'admin');
    setInputValue('password', 'wrong-password');
    await submitRenderedForm();

    const spanishError = component.text().auth.login.errors.invalidCredentials;
    const usernameModel = getInputModel('username');
    const passwordModel = getInputModel('password');

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      spanishError,
    );
    expect(authApiService.login).toHaveBeenCalledOnce();
    expect(authSessionService.logout).toHaveBeenCalledOnce();

    TestBed.inject(I18nService).language.set('en');
    fixture.detectChanges();

    expect(component.error()).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(component.username()).toBe('admin');
    expect(component.password()).toBe('wrong-password');
    expect(getInput('username').value).toBe('admin');
    expect(getInput('password').value).toBe('wrong-password');
    expect(usernameModel.touched).toBe(true);
    expect(usernameModel.dirty).toBe(true);
    expect(passwordModel.touched).toBe(true);
    expect(passwordModel.dirty).toBe(true);
    expect(component.submitting()).toBe(false);
    expect(authApiService.login).toHaveBeenCalledOnce();
    expect(authSessionService.logout).toHaveBeenCalledOnce();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).not.toContain(
      component.text().auth.login.errors.invalidCredentials,
    );
  });
});
