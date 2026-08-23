import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { PaymentActionDialog, PaymentActionDialogData } from './payment-action-dialog';

describe('PaymentActionDialog', () => {
  const stay = { stayId: 's1', agreedAmount: '20' } as Stay;
  const payment = { paymentId: 'p1', amount: '10' } as PaymentActionDialogData['payment'];
  const api = { registerPayment: vi.fn(), editPayment: vi.fn(), annulPayment: vi.fn() };
  const ref = { close: vi.fn(), disableClose: false };
  async function createFixture(data: PaymentActionDialogData) {
    await TestBed.configureTestingModule({
      imports: [PaymentActionDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: ref },
        { provide: StayApiService, useValue: api },
      ],
    }).compileComponents();
    return TestBed.createComponent(PaymentActionDialog);
  }
  async function create(data: PaymentActionDialogData) {
    return (await createFixture(data)).componentInstance;
  }
  beforeEach(() => {
    vi.resetAllMocks();
    ref.disableClose = false;
  });
  afterEach(() => TestBed.resetTestingModule());
  it.each(['register', 'edit', 'annul'] as const)(
    'rejects invalid %s input without a request',
    async (mode) => {
      const component = await create({ stay, mode, payment });
      component.submit();
      expect(api.registerPayment).not.toHaveBeenCalled();
      expect(api.editPayment).not.toHaveBeenCalled();
      expect(api.annulPayment).not.toHaveBeenCalled();
    },
  );
  it('shapes exact register strings and closes only with the authoritative Stay', async () => {
    api.registerPayment.mockReturnValue(of(stay));
    const component = await create({ stay, mode: 'register' });
    component.amount.set('9999999999999999999');
    component.paymentDate.set('2026-08-23');
    component.note.set('  cash  ');
    component.submit();
    expect(api.registerPayment).toHaveBeenCalledWith('s1', {
      amount: '9999999999999999999',
      paymentDate: '2026-08-23',
      note: 'cash',
    });
    expect(ref.close).toHaveBeenCalledWith(stay);
  });
  it('locks duplicate submits and preserves edit values after failure for retry', async () => {
    const pending = new Subject<Stay>();
    api.editPayment
      .mockReturnValueOnce(pending)
      .mockReturnValueOnce(throwError(() => new Error('offline')));
    const component = await create({ stay, mode: 'edit', payment });
    component.amount.set('11');
    component.reason.set(' correction ');
    component.submit();
    component.submit();
    expect(api.editPayment).toHaveBeenCalledTimes(1);
    expect(ref.disableClose).toBe(true);
    pending.error(new Error('offline'));
    expect(component.amount()).toBe('11');
    expect(component.reason()).toBe(' correction ');
    expect(ref.disableClose).toBe(false);
    component.submit();
    expect(api.editPayment).toHaveBeenCalledTimes(2);
  });
  it('shapes exact edit and annul requests', async () => {
    api.editPayment.mockReturnValue(of(stay));
    let component = await create({ stay, mode: 'edit', payment });
    component.amount.set('00011');
    component.reason.set('  signed edit  ');
    component.submit();
    expect(api.editPayment).toHaveBeenCalledWith('s1', 'p1', {
      amount: '00011',
      reason: 'signed edit',
    });
    TestBed.resetTestingModule();
    vi.resetAllMocks();
    api.annulPayment.mockReturnValue(of(stay));
    component = await create({ stay, mode: 'annul', payment });
    component.reason.set('  duplicate  ');
    component.submit();
    expect(api.annulPayment).toHaveBeenCalledWith('s1', 'p1', { reason: 'duplicate' });
  });
  it.each(['10', '010'])(
    'shows semantic edit no-op for %s and submits a genuine exact change',
    async (amount) => {
      api.editPayment.mockReturnValue(of(stay));
      const component = await create({ stay, mode: 'edit', payment });
      component.amount.set(amount);
      component.reason.set('Reason');
      component.submit();
      expect(component.amountUnchanged()).toBe(true);
      expect(api.editPayment).not.toHaveBeenCalled();
      component.amount.set('011');
      component.submit();
      expect(api.editPayment).toHaveBeenCalledWith('s1', 'p1', { amount: '011', reason: 'Reason' });
    },
  );
  it.each(['10', '010'])(
    'renders the semantic edit no-op error for canonical amount %s',
    async (amount) => {
      const fixture = await createFixture({ stay, mode: 'edit', payment });
      const component = fixture.componentInstance;
      component.amount.set(amount);
      component.reason.set('Reason');
      component.submit();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('mat-error')?.textContent).toContain(
        component.text().stays.payments.errors.amountUnchanged,
      );
      expect(component.amountMatcher.isErrorState(null, null)).toBe(true);
    },
  );
  it.each([
    [403, null, 'permission'],
    [404, undefined, 'missing'],
    [400, {}, 'validation'],
    [409, 'would exceed agreement', 'overpayment'],
    [409, { message: 'below active payment total' }, 'activeFloor'],
    [409, null, 'conflict'],
    [500, null, 'generic'],
  ])('maps HTTP %s errors safely', async (status, body, key) => {
    api.registerPayment.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status, error: body })),
    );
    const component = await create({ stay, mode: 'register' });
    component.amount.set('1');
    component.paymentDate.set('2026-08-23');
    component.submit();
    expect(component.error()).toBe(
      (component.text().stays.payments.errors as Record<string, string>)[key],
    );
    expect(ref.disableClose).toBe(false);
  });
});
