import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { AgreedAmountCorrectionDialog } from './agreed-amount-correction-dialog';

describe('AgreedAmountCorrectionDialog', () => {
  const stay = { stayId: 's1', agreedAmount: '20' } as Stay;
  const api = { correctAgreedAmount: vi.fn() };
  const ref = { close: vi.fn(), disableClose: false };
  beforeEach(async () => {
    vi.resetAllMocks();
    ref.disableClose = false;
    await TestBed.configureTestingModule({
      imports: [AgreedAmountCorrectionDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: stay },
        { provide: MatDialogRef, useValue: ref },
        { provide: StayApiService, useValue: api },
      ],
    }).compileComponents();
  });
  it('allows numeric no-op without reason and preserves the exact entered string', () => {
    api.correctAgreedAmount.mockReturnValue(of(stay));
    const component = TestBed.createComponent(AgreedAmountCorrectionDialog).componentInstance;
    component.amount.set('020');
    component.submit();
    expect(api.correctAgreedAmount).toHaveBeenCalledWith('s1', {
      agreedAmount: '020',
      reason: null,
    });
  });
  it('requires reason for real changes and locks duplicate submissions', () => {
    const pending = new Subject<Stay>();
    api.correctAgreedAmount.mockReturnValue(pending);
    const component = TestBed.createComponent(AgreedAmountCorrectionDialog).componentInstance;
    component.amount.set('21');
    component.submit();
    expect(api.correctAgreedAmount).not.toHaveBeenCalled();
    component.reason.set('Signed');
    component.submit();
    component.submit();
    expect(api.correctAgreedAmount).toHaveBeenCalledTimes(1);
    expect(ref.disableClose).toBe(true);
    pending.next({ ...stay, agreedAmount: '21' });
    expect(ref.close).toHaveBeenCalledWith(expect.objectContaining({ agreedAmount: '21' }));
  });
  it.each([
    [403, null, 'permission'],
    [404, undefined, 'missing'],
    [409, null, 'conflict'],
    [409, { detail: 'below active payment total' }, 'activeFloor'],
    [500, null, 'correctionFailed'],
  ])('maps body-safe HTTP %s failures and unlocks retry', (status, body, key) => {
    api.correctAgreedAmount.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status, error: body })),
    );
    const component = TestBed.createComponent(AgreedAmountCorrectionDialog).componentInstance;
    component.amount.set('21');
    component.reason.set('Reason');
    component.submit();
    const errors = {
      ...component.text().stays.payments.errors,
      ...component.text().stays.pricing.errors,
    } as Record<string, string>;
    expect(component.error()).toBe(errors[key]);
    expect(ref.disableClose).toBe(false);
    expect(component.amount()).toBe('21');
  });
  it('preserves failed values and retries to an authoritative success', () => {
    const first = new Subject<Stay>();
    api.correctAgreedAmount
      .mockReturnValueOnce(first)
      .mockReturnValueOnce(of({ ...stay, agreedAmount: '21' }));
    const component = TestBed.createComponent(AgreedAmountCorrectionDialog).componentInstance;
    component.amount.set('21');
    component.reason.set('Signed');
    component.submit();
    first.error(new Error('offline'));
    expect(component.amount()).toBe('21');
    expect(component.reason()).toBe('Signed');
    component.submit();
    expect(api.correctAgreedAmount).toHaveBeenCalledTimes(2);
    expect(ref.close).toHaveBeenCalledWith(expect.objectContaining({ agreedAmount: '21' }));
  });
});
