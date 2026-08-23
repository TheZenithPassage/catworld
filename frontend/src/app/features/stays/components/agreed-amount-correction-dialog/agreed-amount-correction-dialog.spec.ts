import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { AgreedAmountCorrectionDialog } from './agreed-amount-correction-dialog';

describe('AgreedAmountCorrectionDialog', () => {
  const stay = { stayId: 's1', agreedAmount: '20' } as Stay;
  const api = { correctAgreedAmount: vi.fn() };
  const ref = { close: vi.fn() };
  beforeEach(async () => {
    vi.resetAllMocks();
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
    pending.next({ ...stay, agreedAmount: '21' });
    expect(ref.close).toHaveBeenCalledWith(expect.objectContaining({ agreedAmount: '21' }));
  });
});
