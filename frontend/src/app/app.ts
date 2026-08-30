import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatToolbar } from '@angular/material/toolbar';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';

import { AuthSessionService } from './core/auth/auth-session.service';
import { I18nService } from './core/i18n/i18n.service';

interface ShellNavigationItem {
  path: string;
  label: string;
  exact: boolean;
}

@Component({
  selector: 'app-root',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatButton,
    MatIconButton,
    MatMenu,
    MatMenuItem,
    MatMenuTrigger,
    MatToolbar,
  ],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly router = inject(Router);
  private readonly i18nService = inject(I18nService);

  readonly language = this.i18nService.language;
  readonly text = this.i18nService.text;

  readonly authenticated = this.authSessionService.authenticated;
  readonly calendarRoute = signal(this.isCalendarUrl(this.router.url));
  readonly navigationItems = computed<ShellNavigationItem[]>(() => {
    const nav = this.text().app.nav;
    const items: ShellNavigationItem[] = [
      { path: '/', label: nav.dashboard, exact: true },
      { path: '/stays', label: nav.stays, exact: false },
      { path: '/calendar', label: nav.calendar, exact: false },
      { path: '/cats', label: nav.cats, exact: false },
      { path: '/owners', label: nav.owners, exact: false },
      { path: '/vets', label: nav.vets, exact: false },
      { path: '/nightly-rates', label: nav.nightlyRates, exact: false },
    ];

    if (this.authenticated()?.role === 'ADMIN') {
      items.push({ path: '/sensitive-activity', label: nav.sensitiveActivity, exact: false });
      items.push({ path: '/accounts', label: nav.accounts, exact: false });
    }

    return items;
  });

  constructor() {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(),
      )
      .subscribe((event) => this.calendarRoute.set(this.isCalendarUrl(event.urlAfterRedirects)));
  }

  logout(): void {
    this.authSessionService.logout();
    this.router.navigate(['/login']);
  }

  toggleLanguage(): void {
    this.i18nService.toggleLanguage();
  }

  private isCalendarUrl(url: string): boolean {
    return url.split(/[?#]/, 1)[0] === '/calendar';
  }
}
