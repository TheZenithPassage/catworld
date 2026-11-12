import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { AuthSessionService } from '../../core/auth/auth-session.service';
import { I18nService } from '../../core/i18n/i18n.service';
import { CarePage } from './care-page';
import { CareHistoryPage } from './care-history-page';
import { CareDay, CareHistory, CareRecord } from './care.models';

describe('Care screens', () => {
  const today = '2026-08-05';
  const yesterday = '2026-08-04';
  const cat = {
    catId: 'mora',
    stayId: 'stay-1',
    catName: 'Mora',
    foodBrand: 'Example kibble',
    litterBrand: 'Example pellets',
    stayStartAt: '2026-08-04T12:00:00',
    stayEndAt: '2026-08-07T18:00:00',
    records: [],
  };
  const day: CareDay = {
    date: today,
    businessToday: today,
    cats: [cat],
    routines: [{ id: 'water', name: 'Water', seedKey: 'WATER', mode: 'DAILY', active: true }],
  };
  const record: CareRecord = {
    id: 'record-1',
    stayId: cat.stayId,
    catId: cat.catId,
    catName: cat.catName,
    businessDate: today,
    recordedAt: '2026-08-06T01:30:00Z',
    routineId: 'water',
    routineName: 'Water',
    routineSeedKey: 'WATER',
    mode: 'DAILY',
    shift: null,
    note: null,
    authorId: 'staff-id',
    authorUsername: 'staff',
    annulledAt: null,
    annulledById: null,
    annulledByUsername: null,
  };

  let http: HttpTestingController;
  let i18n: I18nService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        provideRouter([
          { path: 'care/stays/:stayId', component: CareHistoryPage },
          { path: 'care', component: CarePage },
        ]),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    i18n = TestBed.inject(I18nService);
    i18n.language.set('es');
    TestBed.inject(AuthSessionService).login(
      { username: 'staff', role: 'STAFF' },
      { username: 'staff', password: 'unused-test-password' },
    );
  });

  afterEach(() => http.verify());

  it('logs a daily routine for the server date and localizes its seeded label', async () => {
    const harness = await RouterTestingHarness.create('/care');
    http.expectOne((request) => request.url.endsWith('/care/day')).flush(day);
    harness.detectChanges();
    const element = harness.routeNativeElement!;
    expect(element.textContent).toContain('Sin registro');
    expect(element.textContent).toContain('Example kibble');
    expect(element.textContent).toContain('Example pellets');
    expect(element.querySelector('[href="/care/routines"]')).toBeNull();
    const mark = element.querySelector<HTMLButtonElement>('[aria-label="Agua · Registrar"]')!;
    mark.click();

    const save = http.expectOne((request) => request.url.endsWith('/care/records'));
    expect(save.request.body).toEqual({
      stayId: cat.stayId,
      catId: cat.catId,
      businessDate: today,
      routineId: 'water',
      expectedMode: 'DAILY',
      shift: null,
    });
    save.flush(record);
    harness.detectChanges();

    const marked = element.querySelector<HTMLButtonElement>('[aria-label="Agua · Registrado"]');
    expect(marked?.disabled).toBe(true);
    i18n.language.set('en');
    harness.detectChanges();
    expect(element.querySelector('[aria-label="Water · Logged"]')).not.toBeNull();
  });

  it('shows a past date and its history link without exposing entry controls', async () => {
    const harness = await RouterTestingHarness.create('/care?date=' + yesterday);
    http
      .expectOne(
        (request) => request.url.endsWith('/care/day') && request.params.get('date') === yesterday,
      )
      .flush({ ...day, date: yesterday });
    harness.detectChanges();
    const element = harness.routeNativeElement!;

    expect(element.querySelector<HTMLInputElement>('input[type="date"]')?.value).toBe(yesterday);
    expect(element.querySelector('time')?.dateTime).toBe(yesterday);
    expect(element.querySelector('textarea')).toBeNull();
    expect(element.querySelector('[aria-label="Agua · Registrar"]')).toBeNull();
    expect(element.querySelector('[href^="/care/stays/stay-1"]')).not.toBeNull();
  });

  it('allows staff to void their own history entry and shows attribution afterward', async () => {
    const history: CareHistory = {
      stayId: cat.stayId,
      startAt: cat.stayStartAt,
      endAt: cat.stayEndAt,
      actorId: 'staff-id',
      records: [
        record,
        { ...record, id: 'record-2', authorId: 'another-id', authorUsername: 'another' },
      ],
    };
    const harness = await RouterTestingHarness.create('/care/stays/stay-1?cat=mora');
    http.expectOne((request) => request.url.endsWith('/care/stays/stay-1/records')).flush(history);
    harness.detectChanges();
    const element = harness.routeNativeElement!;
    const findVoidButtons = () =>
      [...element.querySelectorAll('button')].filter(
        (button) => button.textContent.trim() === 'Anular',
      );

    expect(findVoidButtons()).toHaveLength(1);
    findVoidButtons()[0].click();
    harness.detectChanges();
    findVoidButtons()[0].click();
    http
      .expectOne((request) => request.url.endsWith('/care/records/record-1/annul'))
      .flush({
        ...record,
        annulledAt: '2026-08-06T01:40:00Z',
        annulledById: 'staff-id',
        annulledByUsername: 'staff',
      });
    harness.detectChanges();

    expect(element.textContent).toContain('Anulado');
    expect(findVoidButtons()).toHaveLength(0);
  });
});
