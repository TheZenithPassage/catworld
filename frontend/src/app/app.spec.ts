import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';

import { App } from './app';
import { AuthSessionService } from './core/auth/auth-session.service';
import { I18nService } from './core/i18n/i18n.service';
import { ThemeService } from './core/theme/theme.service';

@Component({ template: '' })
class TestRouteComponent {}

describe('App', () => {
  beforeEach(async () => {
    localStorage.removeItem('catworld.theme');
    localStorage.removeItem('catworld.language');
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
          { path: 'login', component: TestRouteComponent },
          { path: 'calendar', component: TestRouteComponent },
          { path: 'stays', component: TestRouteComponent },
        ]),
        provideNoopAnimations(),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    expect(app).toBeTruthy();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.removeItem('catworld.theme');
    localStorage.removeItem('catworld.language');
    delete document.documentElement.dataset['theme'];
    document.documentElement.style.colorScheme = '';
  });

  it('shows language and theme actions in the public shell', () => {
    const fixture = TestBed.createComponent(App);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('mat-toolbar')).toBeNull();
    expect(compiled.querySelector('.public-language-action .language-toggle')).not.toBeNull();
    expect(compiled.querySelector('.public-language-action .theme-toggle')).not.toBeNull();
  });

  it('provides a labeled theme toggle with current state in Spanish and English', () => {
    TestBed.inject(ThemeService).setTheme('light');
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.theme-toggle') as HTMLButtonElement;

    expect(button.getAttribute('aria-label')).toBe('Modo oscuro');
    expect(button.getAttribute('aria-pressed')).toBe('false');
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('true');
    expect(document.documentElement.dataset['theme']).toBe('dark');

    TestBed.inject(I18nService).toggleLanguage();
    fixture.detectChanges();
    expect(button.getAttribute('aria-label')).toBe('Dark mode');
    expect(button.title).toBe('Switch to light mode');
    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-pressed')).toBe('false');
    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it.each(['ADMIN', 'STAFF'] as const)(
    'keeps the theme through login, navigation and logout for %s',
    async (role) => {
      const service = TestBed.inject(ThemeService);
      const auth = TestBed.inject(AuthSessionService);
      const router = TestBed.inject(Router);
      const fixture = TestBed.createComponent(App);
      service.setTheme('dark');
      await router.navigateByUrl('/login');
      auth.login({ username: 'user', role }, { username: 'user', password: 'secret' });
      await router.navigateByUrl('/stays');
      fixture.detectChanges();
      const button = fixture.nativeElement.querySelector(
        '.app-actions .theme-toggle',
      ) as HTMLButtonElement;
      expect(button.getAttribute('aria-pressed')).toBe('true');
      button.click();
      fixture.detectChanges();
      expect(router.url).toBe('/stays');
      expect(auth.authenticated()?.role).toBe(role);
      expect(service.theme()).toBe('light');
      fixture.componentInstance.logout();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('.public-language-action .theme-toggle'),
      ).not.toBeNull();
      expect(service.theme()).toBe('light');
      expect(localStorage.getItem('catworld.theme')).toBe('light');
    },
  );

  it('shows account management navigation to ADMIN', () => {
    const authSessionService = TestBed.inject(AuthSessionService);
    authSessionService.login(
      { username: 'admin', role: 'ADMIN' },
      { username: 'admin', password: 'secret' },
    );
    const fixture = TestBed.createComponent(App);

    fixture.detectChanges();

    const links = Array.from(
      fixture.nativeElement.querySelectorAll('nav a'),
    ) as HTMLAnchorElement[];
    expect(links.some((link) => link.getAttribute('href') === '/accounts')).toBe(true);
    expect(links.some((link) => link.getAttribute('href') === '/nightly-rates')).toBe(true);
    expect(links.some((link) => link.getAttribute('href') === '/sensitive-activity')).toBe(true);
  });

  it('hides account management navigation from STAFF', () => {
    const authSessionService = TestBed.inject(AuthSessionService);
    authSessionService.login(
      { username: 'staff', role: 'STAFF' },
      { username: 'staff', password: 'secret' },
    );
    const fixture = TestBed.createComponent(App);

    fixture.detectChanges();

    const links = Array.from(
      fixture.nativeElement.querySelectorAll('nav a'),
    ) as HTMLAnchorElement[];
    expect(links.some((link) => link.getAttribute('href') === '/accounts')).toBe(false);
    expect(links.some((link) => link.getAttribute('href') === '/nightly-rates')).toBe(true);
    expect(links.some((link) => link.getAttribute('href') === '/sensitive-activity')).toBe(false);
  });

  it('keeps the public shell while an authenticated session remains on the login route', async () => {
    const authSessionService = TestBed.inject(AuthSessionService);
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);

    await router.navigateByUrl('/login?returnUrl=%2Fstays');
    authSessionService.login(
      { username: 'staff', role: 'STAFF' },
      { username: 'staff', password: 'secret' },
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('mat-toolbar')).toBeNull();
    expect(fixture.nativeElement.querySelector('main.public-main')).not.toBeNull();

    await router.navigateByUrl('/stays');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('mat-toolbar')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('main.public-main')).toBeNull();
  });

  it('derives the Calendar header class from the route without leaking it to other routes', async () => {
    const authSessionService = TestBed.inject(AuthSessionService);
    const router = TestBed.inject(Router);
    authSessionService.login(
      { username: 'staff', role: 'STAFF' },
      { username: 'staff', password: 'secret' },
    );
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await router.navigateByUrl('/calendar?month=2099-01');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-header--calendar-route')).not.toBeNull();

    await router.navigateByUrl('/stays');
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.app-header--calendar-route')).toBeNull();
  });
});
