import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

import { API_BASE_URL } from '../config/api.config';
import { I18nService } from '../i18n/i18n.service';
import { ACCOUNT_DELETION_FORBIDDEN_REASON } from './auth-redirect-reason';
import { AuthSessionService } from './auth-session.service';
import { DEMO_GENERATION_HEADER } from './auth.model';
import { DEMO_RESET_URL, DEMO_STATUS_URL } from './demo-api.service';

export const authInterceptor: HttpInterceptorFn = (request, next) => {
  const authSessionService = inject(AuthSessionService);
  const router = inject(Router);
  const browserWindow = inject(DOCUMENT).defaultView;
  const i18n = inject(I18nService);

  const isApiRequest = request.url.startsWith(`${API_BASE_URL}/`);
  const isLoginRequest = request.url.endsWith('/auth/login');
  const isPublicDemoRequest = request.url === DEMO_STATUS_URL || request.url === DEMO_RESET_URL;
  const isSessionRequest = isApiRequest && !isLoginRequest && !isPublicDemoRequest;
  const accountManagementBaseUrl = `${API_BASE_URL}/users`;
  const isAccountManagementRequest =
    request.url === accountManagementBaseUrl ||
    request.url.startsWith(`${accountManagementBaseUrl}/`);
  const isAccountDeletionRequest =
    request.method === 'DELETE' && request.url.startsWith(`${accountManagementBaseUrl}/`);
  const hasAuthorizationHeader = request.headers.has('Authorization');

  const authorizationHeader = authSessionService.getAuthorizationHeader();
  const demoGeneration = authSessionService.getDemoGeneration();

  const authenticatedRequest =
    isSessionRequest && !hasAuthorizationHeader && authorizationHeader
      ? request.clone({
          setHeaders: {
            Authorization: authorizationHeader,
            ...(demoGeneration ? { [DEMO_GENERATION_HEADER]: demoGeneration } : {}),
          },
        })
      : request;

  return next(authenticatedRequest).pipe(
    catchError((error: unknown) => {
      if (
        isSessionRequest &&
        demoGeneration &&
        authenticatedRequest.headers.has(DEMO_GENERATION_HEADER) &&
        error instanceof HttpErrorResponse &&
        error.status === 409 &&
        error.error?.error === 'DEMO_RELOAD_REQUIRED' &&
        browserWindow?.confirm(i18n.text().auth.demo.reloadRequired)
      ) {
        browserWindow.location.reload();
      }

      if (
        error instanceof HttpErrorResponse &&
        isSessionRequest &&
        (error.status === 401 || (error.status === 403 && isAccountManagementRequest))
      ) {
        authSessionService.logout();
        router.navigate(['/login'], {
          queryParams: {
            returnUrl: router.url,
            ...(error.status === 403 && isAccountDeletionRequest
              ? { reason: ACCOUNT_DELETION_FORBIDDEN_REASON }
              : {}),
          },
        });
      }

      return throwError(() => error);
    }),
  );
};
