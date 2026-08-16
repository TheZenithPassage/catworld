import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { PermanentDeletionConfirmationResult } from '../../../../shared/permanent-deletion/permanent-deletion-confirmation-dialog';
import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { StayPayments } from './stay-payments';

describe('StayPayments', () => {
  let fixture: ComponentFixture<StayPayments>;
  let component: StayPayments;
  let role: 'ADMIN' | 'STAFF';
  let dialogResult: Subject<boolean | PermanentDeletionConfirmationResult | undefined>;

  const stay: Stay = {
    stayId: 'stay-1',
    startAt: '2099-01-01T10:00:00',
    endAt: '2099-01-02T10:00:00',
    numberOfNights: 1,
    cancelledAt: null,
    createdAt: '2026-08-05T09:00:00Z',
    updatedAt: '2026-08-05T09:00:00Z',
    notes: null,
    catIds: ['cat-1'],
    ownerId: 'owner-1',
    ownerName: 'Ada',
    cats: [{ catId: 'cat-1', name: 'Milo' }],
    retainedNightlyRate: '9999999999999999999',
    suggestedAmount: '9999999999999999999',
    agreedAmount: '9999999999999999999',
    totalPaid: '9999999999999999998',
    remainingAmount: '1',
    paymentCondition: 'PARTIAL_PAYMENT',
    outstandingCollectionEligible: true,
    payments: [
      {
        paymentId: 'payment-1',
        amount: '9999999999999999998',
        paymentDate: '2026-08-05',
        note: null,
        state: 'ACTIVE',
        registeredByUsername: 'admin',
        registeredAt: '2026-08-05T09:00:00Z',
        annulledByUsername: null,
        annulledAt: null,
      },
      {
        paymentId: 'payment-2',
        amount: '1',
        paymentDate: '2026-08-04',
        note: 'duplicate',
        state: 'ANNULLED',
        registeredByUsername: 'staff',
        registeredAt: '2026-08-04T09:00:00Z',
        annulledByUsername: 'admin',
        annulledAt: '2026-08-04T10:30:00Z',
      },
    ],
  };

  const api = {
    registerPayment: vi.fn(),
    editPayment: vi.fn(),
    annulPayment: vi.fn(),
    removePayment: vi.fn(),
  };
  const auth = { hasRole: vi.fn((requested: string) => requested === role) };
  const dialog = { open: vi.fn() };

  beforeEach(async () => {
    vi.resetAllMocks();
    role = 'ADMIN';
    dialogResult = new Subject();
    auth.hasRole.mockImplementation((requested: string) => requested === role);
    dialog.open.mockReturnValue({ afterClosed: () => dialogResult.asObservable() });
    await TestBed.configureTestingModule({
      imports: [StayPayments],
      providers: [
        provideNoopAnimations(),
        { provide: StayApiService, useValue: api },
        { provide: AuthSessionService, useValue: auth },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(StayPayments);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('stay', stay);
    fixture.detectChanges();
  });

  afterEach(() => TestBed.resetTestingModule());

  it('renders exact operational history and keeps annulled payments immutable', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.textContent).toContain('9999999999999999999');
    expect(compiled.textContent).toContain('9999999999999999998');
    const rows = compiled.querySelectorAll('.payment-row');
    expect(rows[1].classList).toContain('payment-annulled');
    expect(rows[1].querySelectorAll('button')).toHaveLength(1);
    expect(rows[1].textContent).toContain(component.text().stays.payments.annulledBy);
    expect(rows[1].textContent).toContain(component.text().stays.payments.annulledAt);
    expect(rows[1].textContent).toContain('admin');
    expect(rows[0].textContent).not.toContain(component.text().stays.payments.annulledBy);
    expect(compiled.textContent).not.toContain('entered twice');
  });

  it('localizes payment calendar dates without changing their day', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.language.set('es');
    fixture.componentRef.setInput('stay', {
      ...stay,
      payments: [{ ...stay.payments[0], paymentDate: '2026-08-12' }],
    });
    fixture.detectChanges();

    const paymentDate = () =>
      (fixture.nativeElement as HTMLElement).querySelector('.payment-row dl div:nth-child(2) dd')
        ?.textContent;

    expect(paymentDate()).toContain('12/08/2026');
    expect(paymentDate()).not.toContain('2026-08-12');

    i18n.language.set('en');
    fixture.detectChanges();

    expect(paymentDate()).toContain('12/08/2026');
  });

  it('renders an accessible empty history without changing authoritative economics', () => {
    fixture.componentRef.setInput('stay', { ...stay, payments: [] });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.empty-history')?.textContent).toContain(
      component.text().stays.payments.empty,
    );
    expect(compiled.textContent).toContain('9999999999999999999');
    expect(compiled.textContent).toContain('9999999999999999998');
  });

  it('renders edit and annul forms only inside the selected payment row', () => {
    const secondActivePayment = {
      ...stay.payments[0],
      paymentId: 'payment-2',
      amount: stay.payments[0].amount,
    };
    fixture.componentRef.setInput('stay', {
      ...stay,
      payments: [stay.payments[0], secondActivePayment],
    });
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    compiled
      .querySelector<HTMLButtonElement>('[data-payment-id="payment-2"][data-payment-action="edit"]')
      ?.click();
    fixture.detectChanges();

    expect(compiled.querySelector('.payments-panel > .payment-form')).toBeNull();
    expect(compiled.querySelectorAll('.payment-row .payment-form')).toHaveLength(1);
    expect(
      compiled.querySelector('[data-payment-row-id="payment-2"] > .payment-form'),
    ).not.toBeNull();
    expect(compiled.querySelector('[data-payment-row-id="payment-1"] > .payment-form')).toBeNull();
    const activeEdit = compiled.querySelector<HTMLButtonElement>(
      '[data-payment-id="payment-2"][data-payment-action="edit"]',
    );
    expect(activeEdit?.getAttribute('aria-pressed')).toBe('true');
    expect(activeEdit?.classList).toContain('payment-action-active');
    expect(
      compiled.querySelector('[data-payment-row-id="payment-2"] .payment-form-title')?.textContent,
    ).toContain(component.text().stays.payments.edit);

    compiled
      .querySelector<HTMLButtonElement>(
        '[data-payment-id="payment-1"][data-payment-action="annul"]',
      )
      ?.click();
    fixture.detectChanges();

    expect(compiled.querySelectorAll('.payment-row .payment-form')).toHaveLength(1);
    expect(
      compiled.querySelector('[data-payment-row-id="payment-1"] > .payment-form'),
    ).not.toBeNull();
    expect(compiled.querySelector('[data-payment-row-id="payment-2"] > .payment-form')).toBeNull();
    const activeAnnul = compiled.querySelector<HTMLButtonElement>(
      '[data-payment-id="payment-1"][data-payment-action="annul"]',
    );
    expect(activeAnnul?.getAttribute('aria-pressed')).toBe('true');
    expect(activeAnnul?.classList).toContain('payment-action-active');
    expect(
      compiled.querySelector('[data-payment-row-id="payment-1"] .payment-form-title')?.textContent,
    ).toContain(component.text().stays.payments.annul);
    expect(compiled.querySelectorAll('.payment-row')).toHaveLength(2);
  });

  it('submits an exact whole-unit registration and blocks fractional input', () => {
    api.registerPayment.mockReturnValue(of(stay));
    component.startRegister();
    component.amount.set('1.5');
    component.paymentDate.set('2026-08-05');
    component.submitAction();
    expect(api.registerPayment).not.toHaveBeenCalled();
    component.amount.set('9999999999999999999');
    component.submitAction();
    expect(api.registerPayment).toHaveBeenCalledWith('stay-1', {
      amount: '9999999999999999999',
      paymentDate: '2026-08-05',
      note: null,
    });
  });

  it.each([
    ['', 'amountRequired'],
    ['0', 'invalidAmount'],
    ['1.5', 'invalidAmount'],
    ['10000000000000000000', 'invalidAmount'],
  ] as const)(
    'shows the local amount error for %j without registering',
    async (amount, errorKey) => {
      component.startRegister();
      component.amount.set(amount);
      component.paymentDate.set('2026-08-05');
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      submitPaymentForm();

      expect(visibleFormErrors()).toContain(component.text().stays.payments.errors[errorKey]);
      expect(formField('paymentAmount').classList).toContain('mat-form-field-invalid');
      expect(api.registerPayment).not.toHaveBeenCalled();
    },
  );

  it('shows the required payment date without registering', async () => {
    component.startRegister();
    component.amount.set('1');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    submitPaymentForm();

    expect(visibleFormErrors()).toContain(component.text().stays.payments.errors.dateRequired);
    expect(formField('paymentDate').classList).toContain('mat-form-field-invalid');
    expect(formField('paymentAmount').classList).not.toContain('mat-form-field-invalid');
    expect(api.registerPayment).not.toHaveBeenCalled();
  });

  it.each(['edit', 'annul'] as const)(
    'shows the required reason without calling %s',
    async (action) => {
      if (action === 'edit') {
        component.startEdit(stay.payments[0]);
      } else {
        component.startAnnul(stay.payments[0]);
      }
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      submitPaymentForm();

      expect(visibleFormErrors()).toContain(component.text().stays.payments.errors.reasonRequired);
      expect(formField('paymentReason').classList).toContain('mat-form-field-invalid');
      if (action === 'edit') {
        expect(formField('paymentAmount').classList).not.toContain('mat-form-field-invalid');
      }
      expect(api.editPayment).not.toHaveBeenCalled();
      expect(api.annulPayment).not.toHaveBeenCalled();
    },
  );

  it('serializes every mutation trigger while registration remains pending', () => {
    const registration = new Subject<Stay>();
    api.registerPayment.mockReturnValue(registration.asObservable());
    component.startRegister();
    component.amount.set('1');
    component.paymentDate.set('2026-08-05');
    component.submitAction();
    fixture.detectChanges();

    expect(component.submitting()).toBe(true);
    expect(
      Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
          '[data-payment-action]',
        ),
      ).every((button) => button.disabled),
    ).toBe(true);

    component.startEdit(stay.payments[0]);
    component.startAnnul(stay.payments[0]);
    component.remove(stay.payments[0]);
    component.submitAction();

    expect(component.action()).toBe('register');
    expect(api.registerPayment).toHaveBeenCalledTimes(1);
    expect(api.editPayment).not.toHaveBeenCalled();
    expect(api.annulPayment).not.toHaveBeenCalled();
    expect(api.removePayment).not.toHaveBeenCalled();
    expect(dialog.open).not.toHaveBeenCalled();

    registration.next(stay);
    registration.complete();
    expect(component.submitting()).toBe(false);
  });

  it('retains the active form and entered values when cancellation is attempted while pending', () => {
    const edit = new Subject<Stay>();
    api.editPayment.mockReturnValue(edit.asObservable());
    component.startEdit(stay.payments[0]);
    component.amount.set('9999999999999999999');
    component.reason.set('Correct the payment');
    component.submitAction();
    fixture.detectChanges();

    const cancel = (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      '.payment-form-actions button[type="button"]',
    );
    expect(cancel?.disabled).toBe(true);

    component.cancelAction();
    expect(component.action()).toBe('edit');
    expect(component.selectedPayment()?.paymentId).toBe('payment-1');
    expect(component.amount()).toBe('9999999999999999999');
    expect(component.reason()).toBe('Correct the payment');

    edit.error(new HttpErrorResponse({ status: 409, error: 'stale payment' }));
    fixture.detectChanges();

    expect(component.submitting()).toBe(false);
    expect(component.action()).toBe('edit');
    expect(component.amount()).toBe('9999999999999999999');
    expect(component.reason()).toBe('Correct the payment');
    expect(component.error()).toBe(component.text().stays.payments.errors.conflict);
    expect(cancel?.disabled).toBe(false);
  });

  it('does not open or call a second mutation while removal remains pending', () => {
    const removal = new Subject<Stay>();
    api.removePayment.mockReturnValue(removal.asObservable());
    component.remove(stay.payments[0]);
    fixture.detectChanges();

    expect(component.removalDialogOpen()).toBe(true);
    expect(
      Array.from(
        (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLButtonElement>(
          '[data-payment-action]',
        ),
      ).every((button) => button.disabled),
    ).toBe(true);
    component.remove(stay.payments[1]);
    expect(dialog.open).toHaveBeenCalledTimes(1);

    dialogResult.next({ confirmed: true, reason: 'Entered twice' });
    fixture.detectChanges();

    expect(component.submitting()).toBe(true);
    component.startRegister();
    component.startEdit(stay.payments[0]);
    component.startAnnul(stay.payments[0]);
    component.remove(stay.payments[1]);
    component.submitAction();

    expect(api.removePayment).toHaveBeenCalledTimes(1);
    expect(api.registerPayment).not.toHaveBeenCalled();
    expect(api.editPayment).not.toHaveBeenCalled();
    expect(api.annulPayment).not.toHaveBeenCalled();
    expect(dialog.open).toHaveBeenCalledTimes(1);

    removal.next(stay);
    removal.complete();
    expect(component.submitting()).toBe(false);
  });

  it('preserves entered values and maps a recoverable conflict', () => {
    api.editPayment.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: 'Active payments cannot exceed the agreed amount',
          }),
      ),
    );
    component.startEdit(stay.payments[0]);
    component.amount.set('9999999999999999999');
    component.reason.set('Correction');
    component.submitAction();
    expect(component.amount()).toBe('9999999999999999999');
    expect(component.reason()).toBe('Correction');
    expect(component.error()).toBe(component.text().stays.payments.errors.overpayment);
  });

  it('renders localized backend error categories while preserving edit input', () => {
    const cases = [
      {
        status: 400,
        error: 'invalid payment',
        expected: component.text().stays.payments.errors.validation,
      },
      {
        status: 409,
        error: 'Amount cannot fall below active payments',
        expected: component.text().stays.payments.errors.activeFloor,
      },
      {
        status: 403,
        error: 'forbidden',
        expected: component.text().stays.payments.errors.permission,
      },
      {
        status: 409,
        error: 'stale payment',
        expected: component.text().stays.payments.errors.conflict,
      },
    ];

    for (const errorCase of cases) {
      api.editPayment.mockReturnValue(
        throwError(
          () => new HttpErrorResponse({ status: errorCase.status, error: errorCase.error }),
        ),
      );
      component.startEdit(stay.payments[0]);
      component.amount.set('9999999999999999999');
      component.reason.set('Correction');
      component.submitAction();
      fixture.detectChanges();

      expect(component.amount()).toBe('9999999999999999999');
      expect(component.reason()).toBe('Correction');
      expect((fixture.nativeElement as HTMLElement).textContent).toContain(errorCase.expected);
    }
  });

  it('hides staff mutation actions in a terminal stay', () => {
    role = 'STAFF';
    fixture.destroy();
    fixture = TestBed.createComponent(StayPayments);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('stay', {
      ...stay,
      startAt: '2020-01-01T10:00:00',
      endAt: '2020-01-02T10:00:00',
    });
    fixture.detectChanges();
    expect(component.canMutate()).toBe(false);
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.payment-actions button'),
    ).toHaveLength(0);
  });

  it('keeps terminal payment mutations available to admin', () => {
    fixture.componentRef.setInput('stay', {
      ...stay,
      startAt: '2020-01-01T10:00:00',
      endAt: '2020-01-02T10:00:00',
      cancelledAt: '2020-01-01T12:00:00',
    });
    fixture.detectChanges();

    expect(component.canMutate()).toBe(true);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.payments-header button'),
    ).not.toBeNull();
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll(
        '.payment-row:first-child .payment-actions button',
      ),
    ).toHaveLength(3);
  });

  it('shows allowed staff edit and annul actions without permanent removal', () => {
    role = 'STAFF';
    fixture.destroy();
    fixture = TestBed.createComponent(StayPayments);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('stay', stay);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.payments-header button')).not.toBeNull();
    expect(
      compiled.querySelectorAll('.payment-row:first-child .payment-actions button'),
    ).toHaveLength(2);
    expect(compiled.textContent).not.toContain(component.text().stays.payments.remove);
  });

  it('blocks blank edit and annul reasons and emits each authoritative response', () => {
    const editedStay = { ...stay, totalPaid: '2', remainingAmount: '9999999999999999997' };
    const annulledStay = {
      ...editedStay,
      payments: editedStay.payments.map((payment) =>
        payment.paymentId === 'payment-1' ? { ...payment, state: 'ANNULLED' as const } : payment,
      ),
    };
    const emitted: Stay[] = [];
    component.stayChange.subscribe((value) => emitted.push(value));
    api.editPayment.mockReturnValue(of(editedStay));
    api.annulPayment.mockReturnValue(of(annulledStay));

    component.startEdit(stay.payments[0]);
    component.submitAction();
    expect(api.editPayment).not.toHaveBeenCalled();
    component.reason.set('Correct amount');
    component.amount.set('2');
    component.submitAction();
    expect(api.editPayment).toHaveBeenCalledWith('stay-1', 'payment-1', {
      amount: '2',
      reason: 'Correct amount',
    });
    expect(emitted).toEqual([editedStay]);

    component.startAnnul(stay.payments[0]);
    component.submitAction();
    expect(api.annulPayment).not.toHaveBeenCalled();
    component.reason.set('Entered twice');
    component.submitAction();
    expect(api.annulPayment).toHaveBeenCalledWith('stay-1', 'payment-1', {
      reason: 'Entered twice',
    });
    expect(emitted).toEqual([editedStay, annulledStay]);
  });

  it('does not remove after cancellation and preserves recoverable removal errors', () => {
    component.remove(stay.payments[0]);
    dialogResult.next(false);
    expect(api.removePayment).not.toHaveBeenCalled();

    api.removePayment.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    component.remove(stay.payments[0]);
    dialogResult.next({ confirmed: true, reason: 'Wrong stay' });
    expect(component.error()).toBe(component.text().stays.payments.errors.missing);
    expect(component.stay()).toBe(stay);
    expect(component.removalPayment()).toBe(stay.payments[0]);
    expect(component.removalReason()).toBe('Wrong stay');

    component.retryRemoval();
    expect(dialog.open).toHaveBeenLastCalledWith(
      expect.any(Function),
      expect.objectContaining({ data: expect.objectContaining({ initialReason: 'Wrong stay' }) }),
    );
  });

  it('localizes the payment date in permanent removal confirmation', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.language.set('es');
    component.remove({ ...stay.payments[0], paymentDate: '2026-01-01' });

    expect(dialog.open).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        data: expect.objectContaining({ subject: expect.stringContaining('01/01/2026') }),
      }),
    );
    expect(dialog.open.mock.calls[0][1].data.subject).not.toContain('2026-01-01');
  });

  it('discards failed removal recovery when an already-open edit is submitted', () => {
    const paymentB = { ...stay.payments[0], paymentId: 'payment-b', amount: '1' };
    component.startEdit(paymentB);
    component.amount.set('9999999999999999999');
    component.reason.set('Edit payment B');

    const removal = new Subject<Stay>();
    api.removePayment.mockReturnValue(removal.asObservable());
    component.remove(stay.payments[0]);
    dialogResult.next({ confirmed: true, reason: 'Keep removal A' });
    removal.error(new HttpErrorResponse({ status: 409, error: 'stale payment' }));
    expect(component.removalPayment()?.paymentId).toBe('payment-1');
    expect(component.removalReason()).toBe('Keep removal A');

    const edit = new Subject<Stay>();
    api.editPayment.mockReturnValue(edit.asObservable());
    component.submitAction();
    fixture.detectChanges();

    expect(component.removalPayment()).toBeNull();
    expect(component.removalReason()).toBe('');
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.removal-recovery-actions'),
    ).toBeNull();

    edit.error(new HttpErrorResponse({ status: 403, error: 'forbidden' }));
    fixture.detectChanges();

    expect(component.removalPayment()).toBeNull();
    expect(component.removalReason()).toBe('');
    expect(component.action()).toBe('edit');
    expect(component.amount()).toBe('9999999999999999999');
    expect(component.reason()).toBe('Edit payment B');
    expect(component.error()).toBe(component.text().stays.payments.errors.permission);
    expect(
      (fixture.nativeElement as HTMLElement).querySelector('.removal-recovery-actions'),
    ).toBeNull();
  });

  it.each([
    [400, 'invalid payment', 'validation'],
    [403, 'forbidden', 'permission'],
    [404, 'missing', 'missing'],
    [409, 'stale payment', 'conflict'],
  ] as const)(
    'preserves removal target and reason after HTTP %s',
    (status, backendError, expectedError) => {
      api.removePayment.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status, error: backendError })),
      );
      component.remove(stay.payments[0]);
      dialogResult.next({ confirmed: true, reason: 'Keep this reason' });

      expect(component.removalPayment()?.paymentId).toBe('payment-1');
      expect(component.removalReason()).toBe('Keep this reason');
      expect(component.error()).toBe(component.text().stays.payments.errors[expectedError]);
    },
  );

  it('removes only after an administrator supplies the dialog reason', () => {
    const refreshedStay = { ...stay, totalPaid: '0', payments: [] };
    const emitted: Stay[] = [];
    component.stayChange.subscribe((value) => emitted.push(value));
    api.removePayment.mockReturnValue(of(refreshedStay));
    component.remove(stay.payments[1]);
    dialogResult.next({ confirmed: true, reason: 'duplicate record' });
    expect(api.removePayment).toHaveBeenCalledWith('stay-1', 'payment-2', {
      reason: 'duplicate record',
    });
    expect(emitted).toEqual([refreshedStay]);
    expect(component.removalPayment()).toBeNull();
    expect(component.removalReason()).toBe('');
  });

  it('focuses edit amount and returns focus after cancellation', async () => {
    const editButton = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-payment-action="edit"]',
    ) as HTMLButtonElement;
    editButton.click();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));

    expect(document.activeElement).toBe(
      (fixture.nativeElement as HTMLElement).querySelector('[name="paymentAmount"]'),
    );

    component.cancelAction();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    expect(document.activeElement).toBe(editButton);
  });

  it('keeps edit focus provenance across a failed removal, failure dismissal, success, and cancellation', async () => {
    const paymentB = { ...stay.payments[0], paymentId: 'payment-b', amount: '2' };
    const mixedStay = { ...stay, payments: [stay.payments[0], paymentB] };
    fixture.componentRef.setInput('stay', mixedStay);
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    const editB = compiled.querySelector(
      '[data-payment-id="payment-b"][data-payment-action="edit"]',
    ) as HTMLButtonElement;
    const removeA = compiled.querySelector(
      '[data-payment-id="payment-1"][data-payment-action="remove"]',
    ) as HTMLButtonElement;
    api.removePayment.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409, error: 'stale payment' })),
    );

    editB.click();
    fixture.detectChanges();
    removeA.click();
    dialogResult.next({ confirmed: true, reason: 'Remove payment A' });
    component.cancelAction();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    expect(document.activeElement).toBe(editB);

    dialogResult = new Subject();
    editB.click();
    fixture.detectChanges();
    removeA.click();
    dialogResult.next({ confirmed: true, reason: 'Remove payment A' });
    component.amount.set('9999999999999999999');
    component.reason.set('Edit payment B');
    api.editPayment.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 403, error: 'forbidden' })),
    );
    component.submitAction();
    component.dismissError();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    expect(document.activeElement).toBe(editB);

    api.editPayment.mockReturnValueOnce(of(mixedStay));
    component.submitAction();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    expect(document.activeElement).toBe(editB);
  });

  it('focuses annul reason and returns focus after failure dismissal and success', async () => {
    const annulButton = (fixture.nativeElement as HTMLElement).querySelector(
      '[data-payment-action="annul"]',
    ) as HTMLButtonElement;
    api.annulPayment.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 409, error: 'stale payment' })),
    );
    annulButton.click();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    expect(document.activeElement).toBe(
      (fixture.nativeElement as HTMLElement).querySelector('[name="paymentReason"]'),
    );

    component.reason.set('Preserved');
    component.submitAction();
    component.dismissError();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    expect(document.activeElement).toBe(annulButton);

    const annulledResult = {
      ...stay,
      payments: [{ ...stay.payments[0], state: 'ANNULLED' as const }, stay.payments[1]],
    };
    component.stayChange.subscribe((updatedStay) =>
      fixture.componentRef.setInput('stay', updatedStay),
    );
    api.annulPayment.mockReturnValueOnce(of(annulledResult));
    component.submitAction();
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    expect(document.activeElement).toBe(
      (fixture.nativeElement as HTMLElement).querySelector('[data-payment-row-id="payment-1"]'),
    );
  });

  it('reacts to language changes with an active error and visible timestamp', () => {
    const i18n = TestBed.inject(I18nService);
    i18n.language.set('es');
    api.editPayment.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 403, error: 'forbidden' })),
    );
    component.startEdit(stay.payments[0]);
    component.reason.set('Correction');
    component.submitAction();
    fixture.detectChanges();
    const spanishTimestamp = (fixture.nativeElement as HTMLElement).querySelector(
      '.payment-row dl div:last-child dd',
    )?.textContent;
    expect(component.error()).toBe(component.text().stays.payments.errors.permission);

    i18n.toggleLanguage();
    TestBed.flushEffects();
    fixture.detectChanges();
    const englishTimestamp = (fixture.nativeElement as HTMLElement).querySelector(
      '.payment-row dl div:last-child dd',
    )?.textContent;

    expect(component.error()).toBeNull();
    expect(englishTimestamp).not.toBe(spanishTimestamp);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain('Registered at');
  });

  function submitPaymentForm(): void {
    component.submitAction();
    fixture.detectChanges();
  }

  function visibleFormErrors(): string {
    return Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll<HTMLElement>(
        'mat-error, .mat-mdc-form-field-error',
      ),
    )
      .map((error) => error.textContent?.trim())
      .join(' ');
  }

  function formField(controlName: string): HTMLElement {
    const field = (fixture.nativeElement as HTMLElement)
      .querySelector(`[name="${controlName}"]`)
      ?.closest('mat-form-field');
    if (!(field instanceof HTMLElement)) throw new Error(`Missing form field: ${controlName}`);
    return field;
  }
});
