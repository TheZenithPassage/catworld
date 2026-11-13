import { OverlayContainer } from '@angular/cdk/overlay';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';

import { routes } from '../../../../app.routes';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { OwnerDetailResponse } from '../../../../shared/entity-detail/relationship.models';
import { AgendaStay, OperationsAgenda } from '../../models/operations-agenda.model';

describe('Operations transfers', () => {
  const agendaUrl = '/api/operations/agenda';
  const transfersUrl = '/operations/transfers';
  const businessDate = '2030-06-01';
  const selectedDate = '2030-06-02';
  const pickup: AgendaStay = {
    stayId: 'pickup-stay',
    ownerId: 'alex',
    ownerName: 'Alex Vega',
    cats: [
      { catId: 'alba', name: 'Alba' },
      { catId: 'nube', name: 'Nube' },
    ],
    startAt: '2030-06-02T08:45:00',
    endAt: '2030-06-03T14:00:00',
  };
  const dropOff: AgendaStay = {
    stayId: 'drop-off-stay',
    ownerId: 'sam',
    ownerName: 'Sam Torres',
    cats: [{ catId: 'miso', name: 'Miso' }],
    startAt: '2030-06-01T10:00:00',
    endAt: '2030-06-02T10:30:00',
  };
  const withoutTransfer: AgendaStay = {
    stayId: 'self-transport-stay',
    ownerId: 'robin',
    ownerName: 'Robin Reyes',
    cats: [{ catId: 'luna', name: 'Luna' }],
    startAt: '2030-06-02T09:00:00',
    endAt: '2030-06-04T11:00:00',
  };
  const upcoming: AgendaStay = {
    stayId: 'upcoming-stay',
    ownerId: 'morgan',
    ownerName: 'Morgan Ríos',
    cats: [{ catId: 'oliva', name: 'Oliva' }],
    startAt: '2030-06-03T11:00:00',
    endAt: '2030-06-05T17:00:00',
  };
  const selectedAgenda: OperationsAgenda = {
    date: selectedDate,
    businessDate,
    movements: [
      { type: 'ARRIVAL', scheduledAt: pickup.startAt, transferRequired: true, stay: pickup },
      {
        type: 'ARRIVAL',
        scheduledAt: withoutTransfer.startAt,
        transferRequired: false,
        stay: withoutTransfer,
      },
      { type: 'DEPARTURE', scheduledAt: dropOff.endAt, transferRequired: true, stay: dropOff },
    ],
    boardingStays: [pickup, dropOff, withoutTransfer],
    upcomingDays: [
      {
        date: '2030-06-03',
        movements: [
          {
            type: 'ARRIVAL',
            scheduledAt: upcoming.startAt,
            transferRequired: true,
            stay: upcoming,
          },
          { type: 'DEPARTURE', scheduledAt: pickup.endAt, transferRequired: false, stay: pickup },
        ],
      },
      {
        date: '2030-06-04',
        movements: [
          {
            type: 'DEPARTURE',
            scheduledAt: withoutTransfer.endAt,
            transferRequired: false,
            stay: withoutTransfer,
          },
        ],
      },
      {
        date: '2030-06-05',
        movements: [
          {
            type: 'DEPARTURE',
            scheduledAt: upcoming.endAt,
            transferRequired: false,
            stay: upcoming,
          },
        ],
      },
      { date: '2030-06-06', movements: [] },
      { date: '2030-06-07', movements: [] },
      { date: '2030-06-08', movements: [] },
      { date: '2030-06-09', movements: [] },
    ],
  };
  const emptyAgenda: OperationsAgenda = {
    date: businessDate,
    businessDate,
    movements: [],
    boardingStays: [],
    upcomingDays: Array.from({ length: 7 }, (_, index) => ({
      date: `2030-06-0${index + 2}`,
      movements: [],
    })),
  };
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideRouter(routes),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
      ],
    });
    TestBed.inject(AuthSessionService).login(
      { username: 'staff', role: 'STAFF' },
      { username: 'staff', password: 'test' },
    );
    TestBed.inject(I18nService).language.set('en');
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    TestBed.inject(MatDialog).closeAll();
    http.verify();
  });

  it('carries the selected agenda date and shows only that day’s required legs in agenda order', async () => {
    const harness = await RouterTestingHarness.create('/');
    http.expectOne(agendaUrl).flush(emptyAgenda);
    harness.detectChanges();

    const agendaDate =
      harness.routeNativeElement!.querySelector<HTMLInputElement>('input[type="date"]')!;
    agendaDate.value = selectedDate;
    agendaDate.dispatchEvent(new Event('change', { bubbles: true }));
    http.expectOne(`${agendaUrl}?date=${selectedDate}`).flush(selectedAgenda);
    harness.detectChanges();

    const link = harness.routeNativeElement!.querySelector<HTMLAnchorElement>(
      `a[href^="${transfersUrl}"]`,
    );
    expect(link?.getAttribute('href')).toBe(`${transfersUrl}?date=${selectedDate}`);

    await harness.navigateByUrl(link!.getAttribute('href')!);
    http.expectOne(`${agendaUrl}?date=${selectedDate}`).flush(selectedAgenda);
    harness.detectChanges();
    const page = harness.routeNativeElement!;
    const rows = [...page.querySelectorAll('li')];
    expect(page.querySelector<HTMLInputElement>('input[type="date"]')?.value).toBe(selectedDate);
    expect(rows).toHaveLength(2);
    expect(rows[0].textContent).toContain('Pickup before check-in');
    expect(rows[0].textContent).toContain('08:45');
    expect(rows[0].textContent).toContain('Alba, Nube');
    expect(rows[0].textContent).toContain('Alex Vega');
    expect(rows[1].textContent).toContain('Drop-off at checkout');
    expect(rows[1].textContent).toContain('10:30');
    expect(rows[1].textContent).toContain('Miso');
    expect(page.textContent).not.toContain('Luna');
    expect(page.textContent).not.toContain('Oliva');
    http.expectNone((request) => request.url.startsWith('/api/owners'));

    rows[0].querySelector('button')!.click();
    harness.detectChanges();
    const detail: OwnerDetailResponse = {
      owner: {
        id: pickup.ownerId,
        fullName: pickup.ownerName,
        primaryPhone: '555-0100',
        address: '42 Example Lane',
        secondaryPhone: null,
        secondaryPhoneName: null,
        instagram: null,
        facebook: null,
        notes: null,
      },
      cats: { totalElements: 0, items: [] },
      stays: { totalElements: 0, items: [] },
    };
    http.expectOne('/api/owners/alex/detail').flush(detail);
    harness.detectChanges();
    const overlay = TestBed.inject(OverlayContainer).getContainerElement();
    expect(overlay.querySelector('[role="dialog"]')?.textContent).toContain('555-0100');
    expect(overlay.querySelector('[role="dialog"]')?.textContent).toContain('42 Example Lane');
  });

  it('retries the selected date after a failure and returns to the server business date', async () => {
    const harness = await RouterTestingHarness.create(transfersUrl);
    http.expectOne(agendaUrl).flush(emptyAgenda);
    harness.detectChanges();
    const page = harness.routeNativeElement!;
    const date = page.querySelector<HTMLInputElement>('input[type="date"]')!;
    expect(date.value).toBe(businessDate);

    date.value = selectedDate;
    date.dispatchEvent(new Event('change', { bubbles: true }));
    await harness.fixture.whenStable();
    http.expectOne(`${agendaUrl}?date=${selectedDate}`).flush(null, {
      status: 500,
      statusText: 'Server error',
    });
    harness.detectChanges();
    const error = page.querySelector('[role="alert"]');
    expect(error?.textContent).toContain('Transfers could not be loaded.');
    error!.querySelector('button')!.click();
    http.expectOne(`${agendaUrl}?date=${selectedDate}`).flush(selectedAgenda);
    harness.detectChanges();
    expect(page.querySelectorAll('li')).toHaveLength(2);

    const today = [...page.querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === 'Today',
    );
    today!.click();
    await harness.fixture.whenStable();
    http.expectOne(agendaUrl).flush(emptyAgenda);
    harness.detectChanges();
    expect(date.value).toBe(businessDate);
    expect(page.textContent).toContain('No transfers scheduled for this day.');
  });
});
