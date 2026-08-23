import { TestBed } from '@angular/core/testing';
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
  const ref = { close: vi.fn() };
  async function create(data: PaymentActionDialogData) {
    await TestBed.configureTestingModule({
      imports: [PaymentActionDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: MatDialogRef, useValue: ref },
        { provide: StayApiService, useValue: api },
      ],
    }).compileComponents();
    return TestBed.createComponent(PaymentActionDialog).componentInstance;
  }
  beforeEach(() => vi.resetAllMocks());
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
    pending.error(new Error('offline'));
    expect(component.amount()).toBe('11');
    component.submit();
    expect(api.editPayment).toHaveBeenCalledTimes(2);
  });
});
