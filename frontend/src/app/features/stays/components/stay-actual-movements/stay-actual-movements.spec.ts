import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { StayActualMovements } from './stay-actual-movements';

describe('StayActualMovements', () => {
  const url = '/api/stays/stay-1/actual-movements';
  const close = vi.fn();
  const stay = {
    startAt: '2026-08-05T09:00:00',
    endAt: '2026-08-06T11:00:00',
    cancelled: false,
    arrival: {
      occurredAt: '2026-08-05T12:15:47Z',
      revision: 2,
      recordedBy: 'staff-one',
      correctedBy: 'admin',
      canEdit: true,
    },
    departure: null,
  };

  function setup() {
    close.mockClear();
    TestBed.configureTestingModule({
      imports: [StayActualMovements],
      providers: [
        provideNoopAnimations(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MAT_DIALOG_DATA, useValue: { stayId: 'stay-1', focusType: 'ARRIVAL' } },
        { provide: MatDialogRef, useValue: { close } },
      ],
    });
    TestBed.inject(I18nService).language.set('en');
    const fixture = TestBed.createComponent(StayActualMovements);
    fixture.detectChanges();
    return {
      fixture,
      host: fixture.nativeElement as HTMLElement,
      http: TestBed.inject(HttpTestingController),
    };
  }

  function click(host: HTMLElement, text: string): void {
    [...host.querySelectorAll('button')]
      .find((button) => button.textContent?.trim() === text)!
      .click();
  }

  it('shows scheduled and actual time in Argentina and submits a correction with its loaded revision', () => {
    const { fixture, host, http } = setup();
    http.expectOne(url).flush(stay);
    fixture.detectChanges();
    expect(host.textContent).toContain('09:00');
    expect(host.textContent).toContain('09:15');
    expect(host.textContent).toContain('staff-one');
    expect(host.textContent).toContain('admin');

    click(host, 'Correct time');
    fixture.detectChanges();
    click(host, 'Save time');
    http.expectNone(url + '/ARRIVAL');
    fixture.detectChanges();
    click(host, 'Correct time');
    fixture.detectChanges();
    const input = host.querySelector<HTMLInputElement>('input[type="datetime-local"]')!;
    expect(input.value).toBe('2026-08-05T09:15');
    input.value = '2026-08-05T09:25';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    click(host, 'Save time');
    const request = http.expectOne(url + '/ARRIVAL');
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual({
      expectedRevision: 2,
      occurredAt: '2026-08-05T12:25:00.000Z',
    });
    request.flush({
      ...stay,
      arrival: { ...stay.arrival, occurredAt: '2026-08-05T12:25:00Z', revision: 3 },
    });
    fixture.detectChanges();
    expect(host.textContent).toContain('09:25');
    click(host, 'Close');
    expect(close).toHaveBeenCalledWith(true);
    http.verify();
  });

  it('records an independent departure now and requires a reload after a conflict', () => {
    const { fixture, host, http } = setup();
    http.expectOne(url).flush({ ...stay, arrival: null });
    fixture.detectChanges();
    const departure = host.querySelectorAll('section')[1]!;
    click(departure, 'Record now');
    const request = http.expectOne(url + '/DEPARTURE');
    expect(request.request.body).toEqual({ expectedRevision: 0, occurredAt: null });
    request.flush('Conflict', { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    expect(host.textContent).toContain('Reload');
    expect([...departure.querySelectorAll('button')].every((button) => button.disabled)).toBe(true);
    click(host, 'Reload');
    http.expectOne(url).flush({ ...stay, cancelled: true });
    fixture.detectChanges();
    expect(host.textContent).toContain('This stay was cancelled.');
    expect(host.textContent).toContain('staff-one');
    expect(host.textContent).not.toContain('Record now');
    expect(host.textContent).not.toContain('Correct time');
    http.verify();
  });
});
