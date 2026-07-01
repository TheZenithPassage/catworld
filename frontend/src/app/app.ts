import { Component, computed, inject } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatToolbar } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

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
  readonly navigationItems = computed<ShellNavigationItem[]>(() => {
    const nav = this.text().app.nav;
    const items: ShellNavigationItem[] = [
      { path: '/', label: nav.dashboard, exact: true },
      { path: '/stays', label: nav.stays, exact: false },
      { path: '/calendar', label: nav.calendar, exact: false },
      { path: '/cats', label: nav.cats, exact: false },
      { path: '/owners', label: nav.owners, exact: false },
      { path: '/vets', label: nav.vets, exact: false },
    ];

    if (this.authenticated()?.role === 'ADMIN') {
      items.push({ path: '/accounts', label: nav.accounts, exact: false });
    }

    return items;
  });

  logout(): void {
    this.authSessionService.logout();
    this.router.navigate(['/login']);
  }

  toggleLanguage(): void {
    this.i18nService.toggleLanguage();
  }
}
