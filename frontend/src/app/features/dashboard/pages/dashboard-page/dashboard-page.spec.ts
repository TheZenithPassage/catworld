import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, RouterLink } from '@angular/router';

import { DashboardPage } from './dashboard-page';

describe('DashboardPage', () => {
  let component: DashboardPage;
  let fixture: ComponentFixture<DashboardPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [provideNoopAnimations(), provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('renders dashboard card navigation with Material card presentation', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const cardLinks = [...fixture.debugElement.queryAll(By.css('.dashboard-card'))].map((link) =>
      link.injector.get(RouterLink),
    );

    expect(compiled.querySelectorAll('.dashboard-card mat-card')).toHaveLength(5);
    expect(compiled.textContent).toContain(component.text().dashboard.links.stays.title);
    expect(compiled.textContent).toContain(component.text().dashboard.links.calendar.title);
    expect(cardLinks.map((link) => link.href)).toEqual([
      '/stays',
      '/calendar',
      '/cats',
      '/owners',
      '/vets',
    ]);
  });

  it('renders quick actions as Material route controls with existing labels', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const quickActions = [...fixture.debugElement.queryAll(By.css('.action-links a'))].map((link) =>
      link.injector.get(RouterLink),
    );

    expect(compiled.querySelectorAll('.action-links a[mat-flat-button]')).toHaveLength(1);
    expect(compiled.querySelectorAll('.action-links a[mat-stroked-button]')).toHaveLength(3);
    expect(compiled.textContent).toContain(component.text().dashboard.quickActions.createStay);
    expect(compiled.textContent).toContain(component.text().dashboard.quickActions.createOwner);
    expect(quickActions.map((link) => link.href)).toEqual([
      '/stays/new',
      '/owners/new',
      '/cats/new',
      '/vets/new',
    ]);
  });
});
