import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../../../core/config/api.config';
import { RuntimeConfigService } from '../../../../core/config/runtime-config.service';
import { businessMonth, MonthlyPaymentsPage } from './monthly-payments-page';

describe('MonthlyPaymentsPage', () => {
  it('uses the business month at a UTC month boundary', () => {
    const at = new Date('2026-11-01T01:30:00Z');
    expect(businessMonth(at, 'America/Argentina/Buenos_Aires')).toBe('2026-10');
    expect(businessMonth(at, 'Europe/Madrid')).toBe('2026-11');
  });

  it('loads the selected month and renders actual payment details and the whole-month total', async () => {
    await TestBed.configureTestingModule({
      imports: [MonthlyPaymentsPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    TestBed.inject(RuntimeConfigService).businessTimeZone.set('America/Argentina/Buenos_Aires');
    const fixture = TestBed.createComponent(MonthlyPaymentsPage);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    TestBed.tick();
    http
      .expectOne((req) => req.url.endsWith('/payments/received'))
      .flush({
        payments: { items: [], page: 0, pageSize: 10, totalElements: 0 },
        totalAmount: '0',
      });
    const month = fixture.nativeElement.querySelector('input[type="month"]') as HTMLInputElement;
    month.value = '2020-10';
    month.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    TestBed.tick();
    const request = http.expectOne(
      (req) =>
        req.url === `${API_BASE_URL}/payments/received` && req.params.get('month') === '2020-10',
    );
    request.flush({
      payments: {
        items: [
          {
            id: 'payment-1',
            paymentDate: '2020-10-31',
            amount: '30',
            stayId: 'stay-1',
            ownerName: 'Example Owner',
            cats: ['Luna', 'Mora'],
            note: 'Seña',
          },
        ],
        page: 0,
        pageSize: 10,
        totalElements: 12,
      },
      totalAmount: '9999999999999999999',
    });
    fixture.detectChanges();

    const section = fixture.nativeElement as HTMLElement;
    expect(section.textContent).toContain('31/10/2020');
    expect(section.textContent).toContain('Luna, Mora');
    expect(section.textContent).toContain('Seña');
    expect(section.querySelector('a')?.getAttribute('href')).toBe('/stays/stay-1/pricing');
    expect(section.querySelector('.monthly-total strong')?.textContent?.replace(/\D/g, '')).toBe(
      '9999999999999999999',
    );
    http.verify({ ignoreCancelled: true });
  });
  it('shows the known total and marks a pending price without a zero balance', async () => {
    await TestBed.configureTestingModule({
      imports: [MonthlyPaymentsPage],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    }).compileComponents();
    const fixture = TestBed.createComponent(MonthlyPaymentsPage);
    const http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
    TestBed.tick();
    http
      .expectOne((req) => req.url.endsWith('/payments/received'))
      .flush({
        payments: { items: [], page: 0, pageSize: 10, totalElements: 0 },
        totalAmount: '0',
      });

    fixture.componentInstance.selectView('outstanding');
    fixture.detectChanges();
    TestBed.tick();
    http
      .expectOne((req) => req.url.endsWith('/payments/outstanding'))
      .flush({
        stays: {
          items: [
            {
              stayId: 'stay-1',
              arrival: '2026-11-12T15:30:00',
              ownerName: 'Example Owner',
              cats: ['Mora'],
              agreedAmount: null,
              paidAmount: '30',
              remainingAmount: null,
              notes: 'Traslado de llegada',
            },
          ],
          page: 0,
          pageSize: 10,
          totalElements: 1,
        },
        knownTotal: '0',
        pendingPriceCount: 1,
      });
    fixture.detectChanges();

    const content = fixture.nativeElement as HTMLElement;
    expect(content.textContent).toContain('1 estadía con precio por definir');
    expect(content.textContent).toContain('Precio por definir');
    expect(content.textContent).toContain('15:30');
    expect(content.textContent).toContain('Traslado de llegada');
    expect(content.querySelector('tbody tr')?.textContent).toContain('30');
    expect(content.querySelector('tbody tr')?.textContent).toContain('—');
    http.verify();
  });
});
