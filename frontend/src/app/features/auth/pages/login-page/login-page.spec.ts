import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthApiService } from '../../../../core/auth/auth-api.service';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
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

  it('renders Material login fields and submit action', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('mat-form-field')).toHaveLength(2);
    expect(compiled.querySelector('input[name="username"]')).not.toBeNull();
    expect(compiled.querySelector('input[name="password"]')).not.toBeNull();
    expect(compiled.querySelector('button[mat-flat-button]')).not.toBeNull();
  });

  it('does not submit when the username is blank', () => {
    component.username.set('   ');
    component.password.set('secret');

    component.submit();

    expect(authApiService.login).not.toHaveBeenCalled();
    expect(component.usernameError()).toBe(component.text().auth.login.errors.usernameRequired);
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
});
