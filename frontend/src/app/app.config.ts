import {
  ApplicationConfig,
  inject,
  provideBrowserGlobalErrorListeners,
  provideAppInitializer,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withInMemoryScrolling, withRouterConfig } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DEFAULT_OPTIONS, MatDialogConfig } from '@angular/material/dialog';

import { routes } from './app.routes';
import { authInterceptor } from './core/auth/auth.interceptor';
import { RuntimeConfigService } from './core/config/runtime-config.service';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { appPaginatorIntl } from './shared/pagination/app-paginator-intl';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => inject(RuntimeConfigService).load()),
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withRouterConfig({ canceledNavigationResolution: 'computed' }),
      withInMemoryScrolling({
        scrollPositionRestoration: 'top',
      }),
    ),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    {
      provide: MAT_DIALOG_DEFAULT_OPTIONS,
      useValue: {
        ...new MatDialogConfig(),
        backdropClass: ['cdk-overlay-dark-backdrop', 'catworld-dialog-backdrop'],
      },
    },
    { provide: MatPaginatorIntl, useFactory: appPaginatorIntl },
  ],
};
