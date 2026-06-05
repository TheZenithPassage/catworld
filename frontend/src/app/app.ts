import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { AuthSessionService } from './core/auth/auth-session.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly authSessionService = inject(AuthSessionService);
  private readonly router = inject(Router);

  readonly authenticated = this.authSessionService.authenticated;

  logout(): void {
    this.authSessionService.logout();
    this.router.navigate(['/login']);
  }
}