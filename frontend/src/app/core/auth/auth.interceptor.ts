import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { AuthSessionService } from './auth-session.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authSessionService = inject(AuthSessionService);
  const router = inject(Router);

  const isApiRequest = request.url.startsWith(API_BASE_URL);
  const isLoginRequest = request.url.endsWith('/auth/login');
  const accountManagementBaseUrl = `${API_BASE_URL}/users`;
  const isAccountManagementRequest =
    request.url === accountManagementBaseUrl ||
    request.url.startsWith(`${accountManagementBaseUrl}/`);
  const hasAuthorizationHeader = request.headers.has('Authorization');

  const authorizationHeader = authSessionService.getAuthorizationHeader();

  const authenticatedRequest =
    isApiRequest && !isLoginRequest && !hasAuthorizationHeader && authorizationHeader
      ? request.clone({
          setHeaders: {
            Authorization: authorizationHeader,
          },
        })
      : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (
        error instanceof HttpErrorResponse &&
        isApiRequest &&
        !isLoginRequest &&
        (error.status === 401 || (error.status === 403 && isAccountManagementRequest))
      ) {
        authSessionService.logout();
        router.navigate(['/login'], {
          queryParams: {
            returnUrl: router.url,
          },
        });
      }

      return throwError(() => error);
    }),
  );
};
