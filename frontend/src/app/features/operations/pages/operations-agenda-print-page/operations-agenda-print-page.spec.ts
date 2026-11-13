import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from '../../../../app.routes';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { AgendaStay, OperationsAgenda } from '../../models/operations-agenda.model';

describe('Operations agenda print page', () => {
  const pageUrl = '/operations/agenda/print';
  const apiUrl = '/api/operations/agenda';
  const selectedDate = '2030-06-02';
  const stay: AgendaStay = {
    stayId: 'stay-1',
    ownerId: 'owner-1',
    ownerName: 'Alex',
    cats: [
      { catId: 'cat-1', name: 'Alba' },
      { catId: 'cat-2', name: 'Nube' },
    ],
    startAt: '2030-06-02T08:05:00',
    endAt: '2030-06-02T18:10:00',
  };
  const emptyAgenda: OperationsAgenda = {
    date: selectedDate,
    businessDate: '2030-06-01',
    movements: [],
    boardingStays: [],
    upcomingDays: [],
  };

  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(routes), provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.inject(I18nService).language.set('en');
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    vi.restoreAllMocks();
    try {
      http.verify();
    } finally {
      TestBed.resetTestingModule();
      localStorage.removeItem('catworld.language');
    }
  });

  function signIn(): void {
    TestBed.inject(AuthSessionService).login(
      { username: 'staff', role: 'STAFF' },
      { username: 'staff', password: 'test-password' },
    );
  }

  it('prints only the selected date and labels transfer for the movement that requires it', async () => {
    signIn();
    const print = vi.spyOn(window, 'print').mockImplementation(() => {});
    const harness = await RouterTestingHarness.create(`${pageUrl}?date=${selectedDate}`);
    const page = harness.routeNativeElement!;
    const boardingStay = {
      ...stay,
      stayId: 'stay-2',
      ownerName: 'Morgan',
      startAt: '2030-06-01T12:00:00',
      endAt: '2030-06-03T11:30:00',
    };

    expect(page.textContent).toContain('Loading the agenda');
    expect(page.querySelector('button')).toBeNull();
    http.expectOne(`${apiUrl}?date=${selectedDate}`).flush({
      ...emptyAgenda,
      movements: [
        { type: 'ARRIVAL', scheduledAt: stay.startAt, transferRequired: true, stay },
        { type: 'DEPARTURE', scheduledAt: stay.endAt, transferRequired: false, stay },
      ],
      boardingStays: [boardingStay],
      upcomingDays: [
        {
          date: '2030-06-03',
          movements: [
            {
              type: 'DEPARTURE',
              scheduledAt: boardingStay.endAt,
              transferRequired: true,
              stay: boardingStay,
            },
          ],
        },
      ],
    } satisfies OperationsAgenda);
    harness.detectChanges();

    expect(page.querySelector(`time[datetime="${selectedDate}"]`)?.textContent).toContain(
      '2 June 2030',
    );
    const rows = Array.from(page.querySelectorAll('tbody tr'), (row) =>
      Array.from(row.querySelectorAll('td'), (cell) =>
        cell.textContent?.trim().replace(/\s+/g, ' '),
      ),
    );
    expect(rows).toEqual([
      ['08:05', 'Arrival Transfer', 'Alba, Nube', 'Alex'],
      ['18:10', 'Departure', 'Alba, Nube', 'Alex'],
    ]);
    expect(page.textContent).not.toContain('Morgan');
    expect(page.textContent).not.toContain('11:30');
    expect(print).not.toHaveBeenCalled();
    page.querySelector('button')!.click();
    expect(print).toHaveBeenCalledTimes(1);
  });

  it('keeps the requested date through the login guard', async () => {
    const harness = await RouterTestingHarness.create(`${pageUrl}?date=${selectedDate}`);
    const router = TestBed.inject(Router);
    const redirect = router.parseUrl(router.url);
    expect(router.url).toMatch(/^\/login\?/);
    const returnUrl = redirect.queryParamMap.get('returnUrl');
    expect(returnUrl).toBe(`${pageUrl}?date=${selectedDate}`);
    http.expectNone((request) => request.url === apiUrl);

    signIn();
    await harness.navigateByUrl(returnUrl!);
    http.expectOne(`${apiUrl}?date=${selectedDate}`).flush(emptyAgenda);
  });

  it('returns to the date selected in the dashboard agenda', async () => {
    signIn();
    const harness = await RouterTestingHarness.create('/');
    const router = TestBed.inject(Router);
    http.expectOne(apiUrl).flush({ ...emptyAgenda, date: emptyAgenda.businessDate });
    harness.detectChanges();

    const dashboard = harness.routeNativeElement!;
    const dateInput = dashboard.querySelector<HTMLInputElement>('input[type="date"]')!;
    dateInput.value = selectedDate;
    dateInput.dispatchEvent(new Event('change', { bubbles: true }));
    http.expectOne(`${apiUrl}?date=${selectedDate}`).flush(emptyAgenda);
    harness.detectChanges();

    dashboard.querySelector<HTMLAnchorElement>(`a[href^="${pageUrl}?"]`)!.click();
    await harness.fixture.whenStable();
    expect(router.url).toBe(`${pageUrl}?date=${selectedDate}`);
    http.expectOne(`${apiUrl}?date=${selectedDate}`).flush(emptyAgenda);
    harness.detectChanges();

    harness.routeNativeElement!.querySelector<HTMLAnchorElement>('a')!.click();
    await harness.fixture.whenStable();
    expect(router.url).toBe(`/?date=${selectedDate}`);
    http.expectOne(`${apiUrl}?date=${selectedDate}`).flush(emptyAgenda);
    harness.detectChanges();
    expect(
      harness.routeNativeElement!.querySelector<HTMLInputElement>('input[type="date"]')!.value,
    ).toBe(selectedDate);
  });

  it.each(['tomorrow', '2030-02-30', '9999-12-24'])(
    'loads the business date when the dashboard URL date is %s',
    async (invalidDate) => {
      signIn();
      const harness = await RouterTestingHarness.create(`/?date=${invalidDate}`);
      http.expectOne(apiUrl).flush({ ...emptyAgenda, date: emptyAgenda.businessDate });
      harness.detectChanges();

      const input =
        harness.routeNativeElement!.querySelector<HTMLInputElement>('input[type="date"]');
      expect(input?.value).toBe(emptyAgenda.businessDate);
    },
  );

  it('requires a date and retries a failed request for the same day', async () => {
    signIn();
    const harness = await RouterTestingHarness.create(pageUrl);
    const page = harness.routeNativeElement!;
    expect(page.textContent).toContain('Select a valid date');
    expect(page.querySelector('a')?.getAttribute('href')).toBe('/');
    http.expectNone((request) => request.url === apiUrl);

    await harness.navigateByUrl(`${pageUrl}?date=${selectedDate}`);
    http.expectOne(`${apiUrl}?date=${selectedDate}`).flush(null, {
      status: 503,
      statusText: 'Service Unavailable',
    });
    harness.detectChanges();
    expect(page.textContent).toContain('The agenda could not be loaded.');
    page.querySelector('button')!.click();
    http.expectOne(`${apiUrl}?date=${selectedDate}`).flush(emptyAgenda);
    harness.detectChanges();
    expect(page.textContent).toContain('No arrivals or departures.');
  });
});
