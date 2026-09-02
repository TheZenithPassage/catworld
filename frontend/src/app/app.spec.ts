import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';

import { App } from './app';
import { AuthSessionService } from './core/auth/auth-session.service';

@Component({ template: '' })
class TestRouteComponent {}

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideRouter([
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

  it('shows only the language action in the public shell', () => {
    const fixture = TestBed.createComponent(App);

    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('mat-toolbar')).toBeNull();
    expect(compiled.querySelector('.public-language-action .language-toggle')).not.toBeNull();
  });

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
