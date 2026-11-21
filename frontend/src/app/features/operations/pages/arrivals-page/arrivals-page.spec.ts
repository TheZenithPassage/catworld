import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideRouter } from '@angular/router';
import { EMPTY } from 'rxjs';
import { vi } from 'vitest';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import { ArrivalsPage } from './arrivals-page';

describe('ArrivalsPage', () => {
  const cat = {
    id: 'cat-1',
    name: 'Milo',
    foodBrand: null,
    litterBrand: 'Example Litter',
    vaccineWarnings: [
      { vaccineType: 'RABIES', reason: 'MISSING', expiresOn: null },
      { vaccineType: 'TRIPLE_FELINE', reason: 'EXPIRES_DURING_STAY', expiresOn: '2026-11-15' },
    ],
  };
  const stay = {
    id: 'stay-1',
    startAt: '2026-11-13T14:00:00',
    endAt: '2026-11-15T17:00:00',
    owner: { id: 'owner-1', fullName: 'Ana Example' },
  };
  const details = { open: vi.fn(() => EMPTY) };
  let fixture: ComponentFixture<ArrivalsPage>;
  let http: HttpTestingController;
  const storageKey = 'catworld.arrivals.filters';

  function expectArrivals(daysAhead = '7', includeStartedToday = true) {
    return http.expectOne(
      (req) =>
        req.method === 'GET' &&
        req.url === '/api/operations/arrivals' &&
        req.params.get('daysAhead') === daysAhead &&
        req.params.get('includeStartedToday') === String(includeStartedToday),
    );
  }

  beforeEach(() => {
    localStorage.removeItem(storageKey);
    details.open.mockClear();
    TestBed.configureTestingModule({
      imports: [ArrivalsPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EntityDetailDialogService, useValue: details },
      ],
    });
    TestBed.inject(I18nService).language.set('es');
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ArrivalsPage);
  });

  afterEach(() => {
    try {
      fixture.destroy();
      http.verify();
    } finally {
      localStorage.removeItem(storageKey);
      vi.useRealTimers();
      TestBed.resetTestingModule();
    }
  });

  it('loads valid date-range preferences immediately and remembers them when reopened', () => {
    expectArrivals().flush([]);
    fixture.detectChanges();
    const page: HTMLElement = fixture.nativeElement;
    const settings = page.querySelector<HTMLDetailsElement>('details')!;
    const days = page.querySelector<HTMLInputElement>('input[inputmode="numeric"]')!;
    const include = page.querySelector<HTMLInputElement>('input[type="checkbox"]')!;

    expect(settings.open).toBe(false);
    expect(settings.querySelector('summary')?.textContent?.trim()).toBe('Configuración');
    expect(settings.contains(days)).toBe(true);
    expect(settings.contains(include)).toBe(true);
    settings.open = true;
    expect(days.labels?.[0].textContent).toContain('Días a partir de hoy');
    expect(include.labels?.[0].textContent).toContain(
      'Incluir los ingresos de hoy que ya empezaron',
    );
    expect(days.value).toBe('7');
    expect(include.checked).toBe(true);

    days.value = '-1';
    days.dispatchEvent(new Event('input'));
    http.expectNone((req) => req.url === '/api/operations/arrivals');

    days.value = '0';
    days.dispatchEvent(new Event('input'));
    expectArrivals('0').flush([]);
    include.click();
    expectArrivals('0', false).flush([]);
    days.value = '100000000000000000000';
    days.dispatchEvent(new Event('input'));
    expectArrivals('100000000000000000000', false).flush([]);

    fixture.destroy();
    fixture = TestBed.createComponent(ArrivalsPage);
    expectArrivals('100000000000000000000', false).flush([]);
  });

  it('reloads at the next business boundary even when no stays are listed', () => {
    vi.useFakeTimers();
    expectArrivals().flush([], { headers: { 'X-Arrivals-Refresh-After-Ms': '1500' } });

    vi.advanceTimersByTime(1499);
    http.expectNone((req) => req.url === '/api/operations/arrivals');
    vi.advanceTimersByTime(1);
    expectArrivals().flush([{ ...stay, cats: [cat] }]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('article')?.textContent).toContain('Ana Example');
  });

  it('reloads when the page is visible again after a suspended timer', () => {
    expectArrivals().flush([]);
    const visibility = vi.spyOn(document, 'visibilityState', 'get').mockReturnValue('hidden');

    document.dispatchEvent(new Event('visibilitychange'));
    http.expectNone((req) => req.url === '/api/operations/arrivals');
    visibility.mockReturnValue('visible');
    document.dispatchEvent(new Event('visibilitychange'));
    expectArrivals().flush([]);
    visibility.mockRestore();
  });

  it('shows arrival preparation and opens the existing stay detail', () => {
    const complete = {
      ...cat,
      id: 'cat-2',
      name: 'Luna',
      foodBrand: 'Example Food',
      vaccineWarnings: [],
    };
    expectArrivals().flush([{ ...stay, cats: [cat, complete] }]);
    fixture.detectChanges();
    const row = (fixture.nativeElement as HTMLElement).querySelector('article')!;

    expect(row.textContent).toContain('Ana Example');
    expect(row.textContent).toContain('14:00');
    expect(row.textContent).not.toMatch(
      /Example Food|Example Litter|Sin pendientes de preparación/,
    );
    expect(row.querySelector('a')).toBeNull();

    const [milo, luna] = row.querySelectorAll('.cat');
    expect(milo.textContent).toMatch(
      /Milo.*Marca de comida · Por confirmar.*Rabia · Falta la fecha de vacunación/s,
    );
    expect(milo.textContent).toContain('Triple felina · La vacuna vence durante la estadía (15/11/2026)');
    expect(luna.textContent?.trim()).toBe('Luna');

    row.querySelector<HTMLButtonElement>('button[aria-label^="Ver estadía"]')!.click();
    expect(details.open).toHaveBeenCalledWith({ entityType: 'stay', entityId: stay.id });
  });

  it('links each returned profile proposal to its review', () => {
    TestBed.inject(AuthSessionService).login(
      { username: 'admin', role: 'ADMIN' },
      { username: 'admin', password: 'test' },
    );
    const pendingReviews = [{ id: 'proposal-1', submittedAt: '2026-11-12T15:00:00Z' }];
    expectArrivals().flush([
      {
        ...stay,
        cats: [{ ...cat, foodBrand: 'Example Food', vaccineWarnings: [], pendingReviews }],
      },
    ]);
    fixture.detectChanges();

    const link = (fixture.nativeElement as HTMLElement).querySelector('article a')!;
    expect(link.getAttribute('href')).toBe('/cat-intake?reviewId=proposal-1');
    expect(link.textContent).toContain('Revisar propuesta de ficha');
    expect(fixture.nativeElement.textContent).not.toContain('Sin pendientes de preparación');
  });

  it('shows all complete cats as links with a single preparation summary for staff', () => {
    TestBed.inject(AuthSessionService).login(
      { username: 'staff', role: 'STAFF' },
      { username: 'staff', password: 'test' },
    );
    const complete = { ...cat, foodBrand: 'Example Food', vaccineWarnings: [] };
    expectArrivals().flush([
      {
        ...stay,
        cats: [
          {
            ...complete,
            pendingReviews: [{ id: 'hidden-proposal', submittedAt: '2026-11-12T15:00:00Z' }],
          },
          { ...complete, id: 'cat-2', name: 'Luna', litterBrand: 'Usa las de CatWorld' },
        ],
      },
    ]);
    fixture.detectChanges();
    const row = (fixture.nativeElement as HTMLElement).querySelector('article')!;

    expect(row.textContent.match(/Sin pendientes de preparación/g)).toHaveLength(1);
    expect(row.textContent).not.toMatch(/Example Food|Example Litter|Usa las de CatWorld/);
    expect(row.querySelector('a')).toBeNull();
    expect(row.textContent).not.toContain('Compartir ficha');
    row.querySelector<HTMLButtonElement>('li:nth-child(2) button')!.click();
    expect(details.open).toHaveBeenCalledWith({ entityType: 'cat', entityId: 'cat-2' });
  });

  it('opens the owner invitation dialog with the arrival context', () => {
    TestBed.inject(AuthSessionService).login(
      { username: 'admin', role: 'ADMIN' },
      { username: 'admin', password: 'test' },
    );
    const open = vi.spyOn(TestBed.inject(MatDialog), 'open');
    expectArrivals().flush([{ ...stay, cats: [cat] }]);
    fixture.detectChanges();
    const buttons = (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
      'article button',
    );
    const inviteButton = [...buttons].find(
      (button) => button.textContent.trim() === 'Compartir ficha',
    );
    expect(inviteButton).toBeDefined();
    inviteButton!.click();

    expect(open).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        data: { ownerId: stay.owner.id, ownerName: stay.owner.fullName, stayId: stay.id },
      }),
    );
    http
      .expectOne('/api/owners/owner-1/lookup')
      .flush({ ...stay.owner, currentCats: [{ id: cat.id, name: cat.name }] });
    http.expectOne('/api/cat-intake/invitations/active?ownerId=owner-1').flush(null);
  });
});
