import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonToggleHarness } from '@angular/material/button-toggle/testing';
import { MatPaginatorHarness } from '@angular/material/paginator/testing';
import { By } from '@angular/platform-browser';
import { GuardResult, NavigationEnd, provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { filter, firstValueFrom, Subject } from 'rxjs';
import { vi } from 'vitest';

import { API_BASE_URL } from '../../../../core/config/api.config';
import { RuntimeConfigService } from '../../../../core/config/runtime-config.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { RemoteEntitySelector } from '../../../../shared/entity-lookup/remote-entity-selector';
import { Stay } from '../../../stays/models/stay.model';
import { StayPricingPage } from '../../../stays/pages/stay-pricing-page/stay-pricing-page';
import { businessMonth, MonthlyPaymentsPage } from './monthly-payments-page';

const receipt = {
  id: 'payment-1',
  paymentDate: '2020-10-31',
  amount: '30',
  stayId: 'stay-1',
  ownerName: 'Example Owner',
  cats: ['Luna', 'Mora'],
  note: 'Seña',
};

const stay: Stay = {
  stayId: 'stay-1',
  startAt: '2020-10-30T10:00:00',
  endAt: '2020-11-02T10:00:00',
  numberOfNights: 3,
  cancelledAt: null,
  createdAt: '2020-10-01T10:00:00Z',
  updatedAt: '2020-10-31T10:00:00Z',
  notes: null,
  catIds: ['cat-1', 'cat-2'],
  ownerId: 'owner-1',
  ownerName: 'Example Owner',
  cats: [
    { catId: 'cat-1', name: 'Luna' },
    { catId: 'cat-2', name: 'Mora' },
  ],
  retainedNightlyRate: '20',
  suggestedAmount: '60',
  agreedAmount: '60',
  totalPaid: '30',
  remainingAmount: '30',
  paymentCondition: 'PARTIAL_PAYMENT',
  payments: [
    {
      paymentId: 'payment-1',
      amount: '30',
      paymentDate: '2020-10-31',
      note: 'Seña',
      state: 'ACTIVE',
      registeredByUsername: 'admin',
      registeredAt: '2020-10-31T10:00:00Z',
      annulledByUsername: null,
      annulledAt: null,
    },
  ],
};

describe('MonthlyPaymentsPage', () => {
  let http: HttpTestingController;
  let router: Router;
  let location: Location;
  let canOpenPricing: boolean | Subject<GuardResult>;

  beforeEach(() => {
    canOpenPricing = true;
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([
          { path: 'payments', component: MonthlyPaymentsPage },
          {
            path: 'stays/:id/pricing',
            component: StayPricingPage,
            canActivate: [() => canOpenPricing],
          },
        ]),
        provideLocationMocks(),
      ],
    });
    http = TestBed.inject(HttpTestingController);
    TestBed.inject(I18nService).language.set('es');
    router = TestBed.inject(Router);
    location = TestBed.inject(Location);
    router.setUpLocationChangeListener();
  });

  afterEach(() => {
    try {
      http.verify();
    } finally {
      TestBed.resetTestingModule();
    }
  });

  function expectPayments(tab: 'received' | 'outstanding', month: string, page: number) {
    return http.expectOne(
      (req) =>
        req.url === `${API_BASE_URL}/payments/${tab}` &&
        req.params.get('month') === month &&
        req.params.get('page') === String(page),
    );
  }

  function respondWithOctoberReceipts(requestedPage: number, page = requestedPage): void {
    const items =
      page === 0
        ? Array.from({ length: 10 }, (_, index) => ({ ...receipt, id: `first-page-${index}` }))
        : [receipt];
    expectPayments('received', '2020-10', requestedPage).flush({
      payments: { items, page, pageSize: 10, totalElements: 11 },
      totalAmount: '9999999999999999999',
    });
  }

  const pendingStay = {
    stayId: 'stay-1',
    arrival: '2020-10-30T15:30:00',
    ownerName: 'Example Owner',
    cats: ['Luna', 'Mora'],
    agreedAmount: null,
    paidAmount: '30',
    remainingAmount: null,
    notes: 'Traslado de llegada',
    started: true,
  };

  function respondWithCollections(page: number, all = false): void {
    const items =
      page === 0
        ? Array.from({ length: 10 }, (_, index) => ({
            ...pendingStay,
            stayId: `first-page-${index}`,
            agreedAmount: '60',
            remainingAmount: '30',
          }))
        : [pendingStay];
    const request = all
      ? http.expectOne(
          (req) =>
            req.url === `${API_BASE_URL}/payments/outstanding` &&
            req.params.get('scope') === 'all' &&
            req.params.get('page') === String(page) &&
            !req.params.has('month'),
        )
      : expectPayments('outstanding', '2020-10', page);
    expect(request.request.params.has('pricePendingOnly')).toBe(false);
    request.flush({
      stays: { items, page, pageSize: 10, totalElements: 11 },
      knownTotal: '300',
      pendingPriceCount: 1,
    });
  }

  it.each(['month', 'all'])(
    'opens pending prices across the %s scope and keeps the filter usable after the last confirmation',
    async (scope) => {
      const all = scope === 'all';
      const url = '/payments?month=2020-10&tab=outstanding&page=0' + (all ? '&scope=all' : '');
      const harness = await RouterTestingHarness.create(url);
      respondWithCollections(0, all);
      harness.detectChanges();
      const filterButton = () =>
        harness.routeNativeElement!.querySelector<HTMLButtonElement>('.monthly-total button')!;
      const filteredRequest = () =>
        http.expectOne(
          (req) =>
            req.url === `${API_BASE_URL}/payments/outstanding` &&
            req.params.get('pricePendingOnly') === 'true' &&
            req.params.get('page') === '0' &&
            req.params.get('month') === (all ? null : '2020-10') &&
            req.params.get('scope') === (all ? 'all' : null),
        );

      expect(filterButton().textContent).toContain('1 estadía con precio por definir');
      filterButton().click();
      await harness.fixture.whenStable();
      const filteredUrl = url + '&pricePendingOnly=true';
      expect(router.url).toBe(filteredUrl);
      filteredRequest().flush({
        stays: { items: [pendingStay], page: 0, pageSize: 10, totalElements: 1 },
        knownTotal: '300',
        pendingPriceCount: 1,
      });
      harness.detectChanges();
      expect(filterButton().getAttribute('aria-pressed')).toBe('true');
      expect(
        harness.routeNativeElement!.querySelector('.monthly-total strong')?.textContent,
      ).toContain('300');
      expect(harness.routeNativeElement!.querySelectorAll('tbody tr')).toHaveLength(1);
      await openPricing(harness);
      expect(location.getState()).toMatchObject({ stayPricingOrigin: filteredUrl });
      harness.routeNativeElement!.querySelector<HTMLButtonElement>('.form-back-link')!.click();
      await harness.fixture.whenStable();
      expect(router.url).toBe(filteredUrl);
      filteredRequest().flush({
        stays: { items: [], page: 0, pageSize: 10, totalElements: 0 },
        knownTotal: '360',
        pendingPriceCount: 0,
      });
      harness.detectChanges();
      expect(harness.routeNativeElement!.textContent).toContain(
        'No quedan estadías con precio por definir',
      );
      filterButton().click();
      await harness.fixture.whenStable();
      expect(router.url).toBe(url);
      respondWithCollections(0, all);
    },
  );

  async function openPricing(harness: RouterTestingHarness): Promise<void> {
    const link = harness.routeNativeElement!.querySelector<HTMLAnchorElement>('tbody a')!;
    expect(link.getAttribute('href')).toBe('/stays/stay-1/pricing');
    link.click();
    await harness.fixture.whenStable();
    http.expectOne(`${API_BASE_URL}/stays/stay-1`).flush(stay);
    harness.detectChanges();
  }

  it('uses the business month at a UTC month boundary', () => {
    const at = new Date('2026-11-01T01:30:00Z');
    expect(businessMonth(at, 'America/Argentina/Buenos_Aires')).toBe('2026-10');
    expect(businessMonth(at, 'Europe/Madrid')).toBe('2026-11');
  });

  it('keeps the selected entity and period across tabs and restores the label after pricing', async () => {
    const harness = await RouterTestingHarness.create(
      '/payments?month=2020-10&tab=received&page=1&ownerId=owner-1',
    );
    const owner = { id: 'owner-1', fullName: 'Example Owner', currentCats: [] };
    const cat = { id: 'cat-1', name: 'Luna', ownerId: owner.id, ownerName: owner.fullName };
    const receipts = {
      payments: { items: [receipt], page: 0, pageSize: 10, totalElements: 1 },
      totalAmount: '30',
    };
    const balances = {
      stays: { items: [pendingStay], page: 0, pageSize: 10, totalElements: 1 },
      knownTotal: '0',
      pendingPriceCount: 1,
    };
    const expectAll = (tab: string, entity: 'catId' | 'ownerId', id: string) =>
      http.expectOne(
        (req) =>
          req.url === `${API_BASE_URL}/payments/${tab}` &&
          req.params.get('scope') === 'all' &&
          req.params.get('page') === '0' &&
          req.params.get(entity) === id &&
          !req.params.has(entity === 'catId' ? 'ownerId' : 'catId') &&
          !req.params.has('month'),
      );
    const selectors = () => harness.routeDebugElement!.queryAll(By.directive(RemoteEntitySelector));
    const loader = TestbedHarnessEnvironment.loader(harness.fixture);
    const toggle = async (label: string) =>
      (await loader.getHarness(MatButtonToggleHarness.with({ text: label }))).check();

    http.expectOne(`${API_BASE_URL}/owners/owner-1/lookup`).flush(owner);
    const monthly = expectPayments('received', '2020-10', 1);
    expect(monthly.request.params.get('ownerId')).toBe(owner.id);
    monthly.flush({ ...receipts, payments: { ...receipts.payments, page: 1, totalElements: 11 } });
    harness.detectChanges();
    expect(selectors()[0].nativeElement.querySelector('input').value).toBe(owner.fullName);

    await toggle('Todo el historial');
    expectAll('received', 'ownerId', owner.id).flush(receipts);
    await toggle('Por cobrar');
    expectAll('outstanding', 'ownerId', owner.id).flush(balances);
    const [, catSelector] = selectors();
    const catInput = catSelector.nativeElement.querySelector('input') as HTMLInputElement;
    catInput.value = 'Lu';
    catInput.dispatchEvent(new Event('input'));
    expect(router.parseUrl(router.url).queryParams['ownerId']).toBe(owner.id);
    http.expectNone((req) => req.url.includes('/payments/'));
    catSelector.componentInstance.select(cat);
    await harness.fixture.whenStable();
    expectAll('outstanding', 'catId', cat.id).flush(balances);
    await toggle('Cobrado');
    expectAll('received', 'catId', cat.id).flush(receipts);
    harness.detectChanges();
    const filteredUrl = '/payments?month=2020-10&tab=received&page=0&scope=all&catId=cat-1';
    expect(router.url).toBe(filteredUrl);
    await openPricing(harness);
    expect(location.getState()).toMatchObject({ stayPricingOrigin: filteredUrl });
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.form-back-link')!.click();
    await harness.fixture.whenStable();
    expectAll('received', 'catId', cat.id).flush(receipts);
    http.expectOne(`${API_BASE_URL}/cats/cat-1`).flush(cat);
    harness.detectChanges();
    expect(selectors()[0].nativeElement.querySelector('input').value).toBe('');
    expect(selectors()[1].nativeElement.querySelector('input').value).toBe('Luna — Example Owner');
  });

  it('restores the selected month and page when returning with the pricing Back button', async () => {
    const harness = await RouterTestingHarness.create(
      '/payments?month=2020-11&tab=received&page=2',
    );
    expectPayments('received', '2020-11', 2).flush({
      payments: {
        items: [{ ...receipt, paymentDate: '2020-11-30' }],
        page: 2,
        pageSize: 10,
        totalElements: 21,
      },
      totalAmount: '0',
    });
    harness.detectChanges();

    const month =
      harness.routeNativeElement!.querySelector<HTMLInputElement>('input[type="month"]')!;
    month.value = '2020-10';
    month.dispatchEvent(new Event('change'));
    await harness.fixture.whenStable();
    expect(router.url).toBe('/payments?month=2020-10&tab=received&page=0');
    expect(router.lastSuccessfulNavigation()?.extras.replaceUrl).toBe(true);
    respondWithOctoberReceipts(0);
    harness.detectChanges();

    const paginator = await TestbedHarnessEnvironment.loader(harness.fixture).getHarness(
      MatPaginatorHarness,
    );
    await paginator.goToNextPage();
    const selectedUrl = '/payments?month=2020-10&tab=received&page=1';
    expect(router.url).toBe(selectedUrl);
    expect(router.lastSuccessfulNavigation()?.extras.replaceUrl).toBe(true);
    respondWithOctoberReceipts(1);
    harness.detectChanges();

    const section = harness.routeNativeElement!;
    expect(section.textContent).toContain('31/10/2020');
    expect(section.textContent).toContain('Luna, Mora');
    expect(section.textContent).toContain('Seña');
    expect(section.querySelector('.monthly-total strong')?.textContent?.replace(/\D/g, '')).toBe(
      '9999999999999999999',
    );

    await openPricing(harness);
    expect(location.getState()).toMatchObject({ stayPricingOrigin: selectedUrl });
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.form-back-link')!.click();
    await harness.fixture.whenStable();

    expect(router.url).toBe(selectedUrl);
    respondWithOctoberReceipts(1);
    harness.detectChanges();
    expect(
      harness.routeNativeElement!.querySelector<HTMLInputElement>('input[type="month"]')?.value,
    ).toBe('2020-10');
    expect(harness.routeNativeElement!.querySelector('tbody tr')?.textContent).toContain(
      'Luna, Mora',
    );
  });

  it('replaces an unavailable page and restores the last valid page on browser Back', async () => {
    const harness = await RouterTestingHarness.create(
      '/payments?month=2020-10&tab=received&page=9',
    );
    respondWithOctoberReceipts(9, 1);
    await harness.fixture.whenStable();
    const validUrl = '/payments?month=2020-10&tab=received&page=1';
    expect(router.url).toBe(validUrl);
    http.expectNone((req) => req.url.endsWith('/payments/received'));

    await openPricing(harness);
    expect(location.getState()).toMatchObject({ stayPricingOrigin: validUrl });
    const returned = firstValueFrom(
      router.events.pipe(filter((event) => event instanceof NavigationEnd)),
    );
    location.back();
    await returned;
    await harness.fixture.whenStable();

    expect(router.url).toBe(validUrl);
    respondWithOctoberReceipts(1);
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('tbody tr')?.textContent).toContain(
      'Luna, Mora',
    );
  });

  it('normalizes the page if the API responds during a cancelled navigation', async () => {
    const harness = await RouterTestingHarness.create(
      '/payments?month=2020-10&tab=received&page=9',
    );
    const guard = new Subject<GuardResult>();
    canOpenPricing = guard;
    const pendingNavigation = router.navigateByUrl('/stays/stay-1/pricing');
    await vi.waitFor(() => expect(guard.observed).toBe(true));
    respondWithOctoberReceipts(9, 1);
    guard.next(false);
    expect(await pendingNavigation).toBe(false);
    await harness.fixture.whenStable();

    expect(router.url).toBe('/payments?month=2020-10&tab=received&page=1');
    http.expectNone((req) => req.url.endsWith('/payments/received'));
  });

  it('defaults invalid URL filters to the current business month and first received page', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2026-11-01T01:30:00Z'));
    try {
      TestBed.inject(RuntimeConfigService).businessTimeZone.set('America/Argentina/Buenos_Aires');
      const harness = await RouterTestingHarness.create(
        '/payments?month=2020-13&tab=unknown&page=214748365',
      );
      expectPayments('received', '2026-10', 0).flush({
        payments: { items: [], page: 0, pageSize: 10, totalElements: 0 },
        totalAmount: '0',
      });
      await harness.fixture.whenStable();
      expect(router.url).toBe('/payments?month=2026-10&tab=received&page=0');
    } finally {
      vi.useRealTimers();
    }
  });

  it('restores the outstanding tab after pricing and resets the page when switching tabs', async () => {
    const harness = await RouterTestingHarness.create(
      '/payments?month=2020-10&tab=received&page=1',
    );
    respondWithOctoberReceipts(1);
    const loader = TestbedHarnessEnvironment.loader(harness.fixture);
    const outstanding = await loader.getHarness(
      MatButtonToggleHarness.with({ text: 'Por cobrar' }),
    );
    await outstanding.check();

    expect(router.url).toBe('/payments?month=2020-10&tab=outstanding&page=0');
    expect(router.lastSuccessfulNavigation()?.extras.replaceUrl).toBe(true);
    respondWithCollections(0);
    const paginator = await loader.getHarness(MatPaginatorHarness);
    await paginator.goToNextPage();
    respondWithCollections(1);
    harness.detectChanges();

    const content = harness.routeNativeElement!;
    expect(content.textContent).toContain('1 estadía con precio por definir');
    expect(content.textContent).toContain('Precio por definir');
    expect(content.textContent).toContain('15:30');
    expect(content.textContent).toContain('Traslado de llegada');
    expect(content.querySelector('tbody tr')?.textContent).toContain('30');
    expect(content.querySelector('tbody tr')?.textContent).toContain('—');

    const selectedUrl = '/payments?month=2020-10&tab=outstanding&page=1';
    await openPricing(harness);
    expect(location.getState()).toMatchObject({ stayPricingOrigin: selectedUrl });
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.form-back-link')!.click();
    await harness.fixture.whenStable();

    expect(router.url).toBe(selectedUrl);
    respondWithCollections(1);
    expect(
      await (
        await loader.getHarness(MatButtonToggleHarness.with({ text: 'Por cobrar' }))
      ).isChecked(),
    ).toBe(true);
  });

  it('keeps the all-outstanding scope, selected month and page after visiting a stay', async () => {
    const harness = await RouterTestingHarness.create(
      '/payments?month=2020-10&tab=outstanding&page=0',
    );
    respondWithCollections(0);
    const loader = TestbedHarnessEnvironment.loader(harness.fixture);
    const all = await loader.getHarness(MatButtonToggleHarness.with({ text: 'Todo el historial' }));
    await all.check();
    respondWithCollections(0, true);
    const paginator = await loader.getHarness(MatPaginatorHarness);
    await paginator.goToNextPage();
    respondWithCollections(1, true);
    harness.detectChanges();

    const selectedUrl = '/payments?month=2020-10&tab=outstanding&page=1&scope=all';
    expect(router.url).toBe(selectedUrl);
    expect(harness.routeNativeElement!.querySelector('input[type="month"]')).toBeNull();
    expect(harness.routeNativeElement!.querySelector('tbody tr')?.textContent).toContain(
      'Estadía iniciada',
    );
    await openPricing(harness);
    expect(location.getState()).toMatchObject({ stayPricingOrigin: selectedUrl });
    harness.routeNativeElement!.querySelector<HTMLButtonElement>('.form-back-link')!.click();
    await harness.fixture.whenStable();

    expect(router.url).toBe(selectedUrl);
    respondWithCollections(1, true);
    const month = await loader.getHarness(MatButtonToggleHarness.with({ text: 'Por mes' }));
    await month.check();
    respondWithCollections(0);
    harness.detectChanges();
    expect(
      harness.routeNativeElement!.querySelector<HTMLInputElement>('input[type="month"]')?.value,
    ).toBe('2020-10');
  });

  it('ignores an outstanding response received while the operator switches back to Received', async () => {
    const harness = await RouterTestingHarness.create(
      '/payments?month=2020-10&tab=received&page=1',
    );
    respondWithOctoberReceipts(1);
    harness.detectChanges();
    const received = harness.routeNativeElement!.querySelector<HTMLButtonElement>(
      'mat-button-toggle[value="received"] button',
    )!;
    const outstanding = harness.routeNativeElement!.querySelector<HTMLButtonElement>(
      'mat-button-toggle[value="outstanding"] button',
    )!;

    outstanding.click();
    await harness.fixture.whenStable();
    const slowResponse = expectPayments('outstanding', '2020-10', 0);
    received.click();
    slowResponse.flush({
      stays: { items: [], page: 0, pageSize: 10, totalElements: 0 },
      knownTotal: '0',
      pendingPriceCount: 0,
    });
    await harness.fixture.whenStable();

    expect(router.url).toBe('/payments?month=2020-10&tab=received&page=0');
    respondWithOctoberReceipts(0);
    harness.detectChanges();
    expect(harness.routeNativeElement!.querySelector('tbody tr')?.textContent).toContain(
      'Luna, Mora',
    );
    expect(received.getAttribute('aria-checked')).toBe('true');
  });
});
