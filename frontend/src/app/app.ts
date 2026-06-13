import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthSessionService } from './core/auth/auth-session.service';
import { I18nService } from './core/i18n/i18n.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
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

  logout(): void {
    this.authSessionService.logout();
    this.router.navigate(['/login']);
  }

  toggleLanguage(): void {
    this.i18nService.toggleLanguage();
  }
}
