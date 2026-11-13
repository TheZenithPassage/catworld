import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, RouterLink } from '@angular/router';
import { Subject } from 'rxjs';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import { EntityDetailUpdate } from '../../../../shared/entity-detail/entity-reference';
import { DashboardPage } from './dashboard-page';

describe('DashboardPage', () => {
  let component: DashboardPage;
  let fixture: ComponentFixture<DashboardPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
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

describe('DashboardPage agenda', () => {
  it('shows the server business date, loads a selected date and opens the stay from its movement', () => {
    const updates = new Subject<EntityDetailUpdate>();
    const open = vi.fn(() => updates);
    TestBed.configureTestingModule({
      imports: [DashboardPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EntityDetailDialogService, useValue: { open } },
      ],
    });
    TestBed.inject(I18nService).language.set('en');
    const http = TestBed.inject(HttpTestingController);
    const fixture = TestBed.createComponent(DashboardPage);
    const root = fixture.nativeElement as HTMLElement;
    const url = '/api/operations/agenda';
    const stay = {
      stayId: 'stay-1',
      ownerId: 'owner-1',
      ownerName: 'Alex',
      cats: [
        { catId: 'cat-1', name: 'Alba' },
        { catId: 'cat-2', name: 'Nube' },
      ],
      startAt: '2030-06-01T23:00:00',
      endAt: '2030-06-03T08:00:00',
    };
    const initialAgenda = {
      date: '2030-06-01',
      businessDate: '2030-06-01',
      movements: [{ type: 'ARRIVAL', scheduledAt: stay.startAt, transferRequired: true, stay }],
      boardingStays: [stay],
      upcomingDays: [
        { date: '2030-06-02', movements: [] },
        {
          date: '2030-06-03',
          movements: [
            { type: 'DEPARTURE', scheduledAt: stay.endAt, transferRequired: false, stay },
          ],
        },
        { date: '2030-06-04', movements: [] },
        { date: '2030-06-05', movements: [] },
        { date: '2030-06-06', movements: [] },
        { date: '2030-06-07', movements: [] },
        { date: '2030-06-08', movements: [] },
      ],
    };

    fixture.detectChanges();
    http.expectOne(url).flush(initialAgenda);
    fixture.detectChanges();
    const input = root.querySelector<HTMLInputElement>('input[type="date"]')!;
    expect(input.value).toBe('2030-06-01');
    expect(root.querySelector('a[href="/operations/agenda/print?date=2030-06-01"]')).not.toBeNull();
    const movement = [...root.querySelectorAll('button')].find((button) =>
      button.textContent?.includes('23:00'),
    );
    expect(movement?.textContent).toContain('Alba, Nube');
    movement?.click();
    expect(open).toHaveBeenCalledWith({ entityType: 'stay', entityId: 'stay-1' });

    updates.next({ entityType: 'stay', entityId: 'stay-1' });
    fixture.detectChanges();
    expect(root.contains(movement ?? null)).toBe(true);
    http.expectOne(url).flush(initialAgenda);
    fixture.detectChanges();
    expect(root.contains(movement ?? null)).toBe(true);

    input.value = '2030-06-02';
    input.dispatchEvent(new Event('change', { bubbles: true }));
    const otherAgenda = {
      ...initialAgenda,
      date: '2030-06-02',
      movements: [],
      upcomingDays: [...initialAgenda.upcomingDays.slice(1), { date: '2030-06-09', movements: [] }],
    };
    http.expectOne(url + '?date=2030-06-02').flush(otherAgenda);
    fixture.detectChanges();
    expect(input.value).toBe('2030-06-02');
    expect(root.querySelector('a[href="/operations/agenda/print?date=2030-06-02"]')).not.toBeNull();
    expect(root.textContent).toContain('Cats boarding that day');
    http.verify();
  });
});
