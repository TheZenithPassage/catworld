import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { I18nService } from '../../../../core/i18n/i18n.service';
import type { StayDetailResponse } from '../../../../shared/entity-detail/relationship.models';
import type { StayActualMovements } from '../../models/stay-movement.model';
import { StayDetail } from './stay-detail';

describe('StayDetail confirmed movements', () => {
  const stayId = 'stay-1';
  const url = '/api/stays/stay-1';
  const owner = { id: 'owner-1', fullName: 'Ana' };
  const cat = { id: 'cat-1', name: 'Milo', ownerId: owner.id, ownerName: owner.fullName };
  const cats = [cat, { ...cat, id: 'cat-2', name: 'Luna' }];
  const movements: StayActualMovements = {
    status: 'RESERVED',
    startAt: '2026-11-12T14:30:00',
    endAt: '2026-11-15T16:30:00',
    serverNow: '2026-11-17T18:00:00Z',
    cancelled: false,
    revision: 3,
    arrival: null,
    departure: null,
    canRecordArrival: true,
    canRecordDeparture: false,
    canResetArrival: false,
    arrivalAllowsNow: false,
    departureAllowsNow: false,
  };
  let fixture: ComponentFixture<StayDetail>;
  let http: HttpTestingController;

  function respondWithStay(state: StayActualMovements): void {
    const detail: StayDetailResponse = {
      stayId,
      startAt: state.startAt,
      endAt: state.endAt,
      status: state.status,
      owner,
      cats: { items: [cat], totalElements: cats.length },
      notes: null,
      numberOfNights: 3,
      canEdit: state.status === 'RESERVED' || state.status === 'CHECKED_IN',
      canCancel: state.status === 'RESERVED',
      actualMovements: state,
    };
    http.expectOne(url + '/detail').flush(detail);
    http.expectOne(url).flush({
      stayId,
      cats: cats.map((cat) => ({ catId: cat.id, name: cat.name })),
      agreedAmount: '30000',
    });
    fixture.detectChanges();
  }

  function button(root: ParentNode, name: string): HTMLButtonElement | undefined {
    return [...root.querySelectorAll('button')].find((item) => item.textContent.trim() === name);
  }

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [StayDetail],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.inject(I18nService).language.set('es');
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(StayDetail);
    fixture.componentRef.setInput('entityId', stayId);
    fixture.componentRef.setInput('editing', false);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
  });

  it('records a forgotten arrival on the scheduled business date and reloads visible permissions', async () => {
    respondWithStay(movements);
    const detail = fixture.nativeElement as HTMLElement;
    const updated = vi.fn();
    fixture.componentInstance.updated.subscribe(updated);
    button(detail, 'Registrar ingreso')!.click();
    http.expectOne(url + '/actual-movements').flush(movements);
    fixture.detectChanges();

    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.textContent).toContain('Milo, Luna');
    expect(dialog.textContent).not.toContain('Ingreso previsto');
    const day = dialog.querySelector<HTMLInputElement>('input[type="date"]')!;
    expect(day.value).toBe('2026-11-12');
    expect(day.min).toBe('2026-11-12');
    expect(day.max).toBe('2026-11-15');
    day.value = '2026-11-14';
    day.dispatchEvent(new Event('input'));
    const confirm = button(dialog, 'Confirmar ingreso')!;
    expect(confirm.disabled).toBe(true);
    const input = dialog.querySelector<HTMLInputElement>('input[type="time"]')!;
    input.value = '13:15';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    confirm.click();

    const request = http.expectOne({ url: url + '/actual-movements/ARRIVAL', method: 'PUT' });
    const occurredAt = '2026-11-14T16:15:00.000Z';
    expect(request.request.body).toEqual({ expectedRevision: 3, occurredAt });
    const checkedIn: StayActualMovements = {
      ...movements,
      status: 'CHECKED_IN',
      revision: 4,
      arrival: { occurredAt, revision: 1, recordedBy: 'staff', correctedBy: null, canEdit: true },
      canRecordArrival: false,
      canRecordDeparture: true,
      canResetArrival: true,
    };
    request.flush(checkedIn);
    await vi.waitFor(() =>
      expect(updated).toHaveBeenCalledWith({ entityType: 'stay', entityId: stayId }),
    );
    respondWithStay(checkedIn);

    expect(detail.textContent).toMatch(/Ingreso previsto.*14:30.*Ingreso real.*13:15/s);
    const arrival = [...detail.querySelectorAll('button')].find((candidate) =>
      candidate.textContent?.includes('13:15'),
    )!;
    arrival.click();
    fixture.detectChanges();
    const movementInfo = [...document.querySelectorAll('[role="dialog"]')].at(-1)!;
    expect(movementInfo.textContent).toMatch(/Registrado por\s*staff/);
    expect(button(detail, 'Registrar ingreso')).toBeUndefined();
    button(movementInfo, 'Corregir fecha y hora')!.click();
    http.expectOne(url + '/actual-movements').flush(checkedIn);
    fixture.detectChanges();
    const correction = [...document.querySelectorAll('[role="dialog"]')].at(-1)!;
    expect(correction.querySelector<HTMLInputElement>('input[type="date"]')?.value).toBe(
      '2026-11-14',
    );
    expect(correction.querySelector<HTMLInputElement>('input[type="time"]')?.value).toBe('13:15');
    expect(button(movementInfo, 'Deshacer ingreso')).toBeDefined();
    expect(button(detail, 'Registrar salida')).toBeDefined();
    expect(button(detail, 'Cancelar estadía')).toBeUndefined();
  });

  it('shows historical stays without presenting inferred times as real or offering corrections', () => {
    respondWithStay({ ...movements, status: 'CHECKED_OUT', canRecordArrival: false });
    const detail = fixture.nativeElement as HTMLElement;

    expect(detail.textContent?.match(/Sin hora registrada/g)).toHaveLength(2);
    expect(detail.textContent).not.toContain('Registrado por');
    expect(button(detail, 'Corregir fecha y hora')).toBeUndefined();
    expect(button(detail, 'Registrar salida')).toBeUndefined();
  });
});
