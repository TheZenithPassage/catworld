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
  const api = { correctAgreedAmount: vi.fn(), previewPendingPrice: vi.fn() };
  const pendingStay = { ...stay, agreedAmount: null, pricePending: true };
  const preview = {
    version: 'preview-1',
    previouslyAgreed: false,
    numberOfNights: 2,
    retainedNightlyRate: '50',
    accommodationSuggestedAmount: '100',
    arrivalTransferRequired: true,
    departureTransferRequired: false,
    transferWaived: false,
    retainedTransferRate: '20',
    transferSuggestedAmount: '20',
    suggestedAmount: '120',
  };
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
  it('explains the saved rates and allows accepting the initial suggestion without a reason', async () => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: pendingStay });
    api.previewPendingPrice.mockReturnValue(of(preview));
    api.correctAgreedAmount.mockReturnValue(of({ ...stay, agreedAmount: '120' }));
    const fixture = TestBed.createComponent(AgreedAmountCorrectionDialog);
    await fixture.whenStable();
    const content: HTMLElement = fixture.nativeElement;
    const button = Array.from(content.querySelectorAll('button')).find(
      (element) =>
        element.textContent.trim() ===
        fixture.componentInstance.text().stays.pricing.useSuggestedAmount,
    );
    expect(content.textContent).toContain(
      fixture.componentInstance.text().stays.pricing.arrivalTransfer,
    );
    expect(content.querySelector('textarea[name="correctionReason"]')).toBeNull();
    button!.click();
    fixture.componentInstance.submit();

    expect(api.previewPendingPrice).toHaveBeenCalledWith('s1');
    expect(api.correctAgreedAmount).toHaveBeenCalledWith('s1', {
      agreedAmount: '120',
      reason: null,
      expectedPendingPriceVersion: preview.version,
    });
  });
  it('reloads a stale price breakdown while keeping the manual amount and reason', () => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: pendingStay });
    api.previewPendingPrice
      .mockReturnValueOnce(of(preview))
      .mockReturnValueOnce(of({ ...preview, version: 'preview-2', suggestedAmount: '170' }));
    api.correctAgreedAmount
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 409,
              error: { code: 'STALE_PRICING_CONFIRMATION' },
            }),
        ),
      )
      .mockReturnValueOnce(of({ ...stay, agreedAmount: '150' }));
    const component = TestBed.createComponent(AgreedAmountCorrectionDialog).componentInstance;
    component.amount.set('150');
    component.submit();
    expect(api.correctAgreedAmount).not.toHaveBeenCalled();

    component.reason.set('Rounded amount');
    component.submit();
    expect(api.previewPendingPrice).toHaveBeenCalledTimes(2);
    expect(component.error()).toBe(component.text().stays.pricing.staleUpdate);
    component.submit();
    expect(api.correctAgreedAmount).toHaveBeenLastCalledWith('s1', {
      agreedAmount: '150',
      reason: 'Rounded amount',
      expectedPendingPriceVersion: 'preview-2',
    });
  });
  it('shows the known choice collapsed and confirms an override with the server rate', async () => {
    const cats = [{ catId: 'cat-1', name: 'Milo' }];
    const initial = {
      ...preview,
      suggestedAmount: '144',
      litter: {
        ratePerKg: '24',
        rateUnavailable: false,
        subtotal: '24',
        cats: [
          { catId: 'cat-1', choice: 'HALF', kgPerDay: '0.5', totalKg: '1', suggestedAmount: '24' },
        ],
      },
    };
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: { ...pendingStay, cats } });
    const editedCat = { ...initial.litter.cats[0], choice: 'ONE', kgPerDay: '1', totalKg: '2' };
    api.previewPendingPrice
      .mockReturnValueOnce(of(initial))
      .mockReturnValueOnce(
        of({
          ...initial,
          version: 'preview-2',
          suggestedAmount: '168',
          litter: {
            ...initial.litter,
            subtotal: '48',
            cats: [{ ...editedCat, suggestedAmount: '48' }],
          },
        }),
      );
    api.correctAgreedAmount.mockReturnValue(of(stay));
    const fixture = TestBed.createComponent(AgreedAmountCorrectionDialog);
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    const copy = fixture.componentInstance.text().stays.pricing.litter;
    expect(root.textContent).toContain(copy.choices.HALF);
    expect(root.querySelector('[data-litter-cat="cat-1"]')).toBeNull();
    const change = [...root.querySelectorAll('button')].find(
      (button) => button.textContent.trim() === copy.change,
    );
    change!.click();
    await fixture.whenStable();
    const choice = root.querySelector<HTMLSelectElement>('[data-litter-cat="cat-1"]')!;
    expect(choice?.value).toBe('HALF');
    choice.value = 'ONE';
    choice.dispatchEvent(new Event('change'));
    await fixture.whenStable();

    expect(api.previewPendingPrice).toHaveBeenLastCalledWith('s1', {
      litterChoices: { 'cat-1': 'ONE' },
    });
    expect(api.previewPendingPrice).toHaveBeenCalledTimes(2);
    fixture.componentInstance.amount.set('168');
    fixture.componentInstance.submit();
    expect(api.correctAgreedAmount).toHaveBeenCalledWith('s1', {
      agreedAmount: '168',
      reason: null,
      expectedPendingPriceVersion: 'preview-2',
      litterChoices: { 'cat-1': 'ONE' },
    });
  });
  it('shows an unresolved litter choice while allowing a manual amount', async () => {
    const cats = [{ catId: 'cat-1', name: 'Milo' }];
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: { ...pendingStay, cats } });
    api.previewPendingPrice.mockReturnValue(of({
      ...preview,
      suggestedAmount: null,
      litter: {
        ratePerKg: null,
        rateUnavailable: false,
        subtotal: null,
        cats: [{ catId: 'cat-1', choice: null, kgPerDay: null, totalKg: null, suggestedAmount: null }],
      },
    }));
    api.correctAgreedAmount.mockReturnValue(of(stay));
    const fixture = TestBed.createComponent(AgreedAmountCorrectionDialog);
    await fixture.whenStable();
    const content = fixture.nativeElement as HTMLElement;
    const copy = fixture.componentInstance.text().stays.pricing;
    const select = content.querySelector<HTMLSelectElement>('[data-litter-cat="cat-1"]')!;
    expect(select.selectedOptions[0].textContent).toBe(copy.litter.unconfirmed);
    expect(content.textContent).not.toContain(copy.useSuggestedAmount);
    expect(content.textContent).not.toContain(copy.litter.unavailable);
    fixture.componentInstance.amount.set('130');
    fixture.componentInstance.submit();
    expect(api.correctAgreedAmount).toHaveBeenCalledWith('s1', {
      agreedAmount: '130',
      reason: null,
      expectedPendingPriceVersion: preview.version,
    });
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
