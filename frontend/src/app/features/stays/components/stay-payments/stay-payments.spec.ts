import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { vi } from 'vitest';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { PermanentDeletionConfirmationDialog } from '../../../../shared/permanent-deletion/permanent-deletion-confirmation-dialog';
import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { PaymentActionDialog } from '../payment-action-dialog/payment-action-dialog';
import { StayPayments } from './stay-payments';

describe('StayPayments', () => {
  const payment = {
    paymentId: 'p1',
    amount: '10',
    paymentDate: '2026-08-05',
    note: null,
    state: 'ACTIVE' as const,
    registeredByUsername: 'admin',
    registeredAt: '2026-08-05T09:00:00Z',
    annulledByUsername: null,
    annulledAt: null,
  };
  const annulled = {
    ...payment,
    paymentId: 'p2',
    state: 'ANNULLED' as const,
    annulledByUsername: 'admin',
    annulledAt: '2026-08-06T09:00:00Z',
  };
  const stay: Stay = {
    stayId: 's1',
    startAt: '2099-01-01T10:00:00',
    endAt: '2099-01-02T10:00:00',
    numberOfNights: 1,
    cancelledAt: null,
    createdAt: '2026-08-05T09:00:00Z',
    updatedAt: '2026-08-05T09:00:00Z',
    notes: null,
    catIds: ['c1'],
    ownerId: 'o1',
    ownerName: 'Ada',
    cats: [{ catId: 'c1', name: 'Milo' }],
    retainedNightlyRate: '20',
    suggestedAmount: '20',
    agreedAmount: '20',
    totalPaid: '10',
    remainingAmount: '10',
    paymentCondition: 'PARTIAL_PAYMENT',
    outstandingCollectionEligible: true,
    payments: [payment, annulled],
  };
  const api = {
    registerPayment: vi.fn(),
    editPayment: vi.fn(),
    annulPayment: vi.fn(),
    removePayment: vi.fn(),
  };
  let role: 'ADMIN' | 'STAFF';
  let closed: Subject<unknown>;
  const dialog = { open: vi.fn() };
  beforeEach(async () => {
    vi.resetAllMocks();
    role = 'ADMIN';
    closed = new Subject();
    dialog.open.mockReturnValue({ afterClosed: () => closed.asObservable() });
    await TestBed.configureTestingModule({
      imports: [StayPayments],
      providers: [
        provideNoopAnimations(),
        { provide: StayApiService, useValue: api },
        { provide: AuthSessionService, useValue: { hasRole: (value: string) => value === role } },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();
  });
  function create() {
    const fixture = TestBed.createComponent(StayPayments);
    fixture.componentRef.setInput('stay', stay);
    fixture.detectChanges();
    return fixture;
  }

  it('renders history and launches focused payment dialogs with no inline forms', () => {
    const fixture = create();
    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelectorAll('.payment-row')).toHaveLength(2);
    expect(host.textContent).toContain('10');
    expect(host.textContent).toContain('admin');
    expect(host.textContent).toContain('05/08/2026');
    expect(host.textContent).toMatch(/6 (Aug|ago) 2026/i);
    host.querySelector<HTMLButtonElement>('[data-payment-action="register"]')!.click();
    expect(dialog.open).toHaveBeenCalledWith(
      PaymentActionDialog,
      expect.objectContaining({ data: { stay, mode: 'register', payment: undefined } }),
    );
    expect(host.querySelector('form')).toBeNull();
  });
  it('renders empty history while preserving exact authoritative economics', () => {
    const fixture = create();
    fixture.componentRef.setInput('stay', {
      ...stay,
      payments: [],
      agreedAmount: '9999999999999999999',
      totalPaid: '0',
      remainingAmount: '9999999999999999999',
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('9999999999999999999');
    expect(fixture.nativeElement.querySelector('.empty-history')).not.toBeNull();
  });
  it('emits only complete successful dialog results and unlocks after dismiss', () => {
    const fixture = create();
    const component = fixture.componentInstance;
    const emitted = vi.fn();
    component.stayChange.subscribe(emitted);
    component.startEdit(payment);
    const updated = { ...stay, totalPaid: '12' };
    closed.next(updated);
    expect(emitted).toHaveBeenCalledWith(updated);
    component.startAnnul(payment);
    closed.next(undefined);
    expect(emitted).toHaveBeenCalledTimes(1);
    expect(component.actionDialogOpen()).toBe(false);
  });
  it('preserves role and lifecycle visibility', () => {
    role = 'STAFF';
    const fixture = create();
    expect(fixture.nativeElement.querySelectorAll('[data-payment-action="remove"]')).toHaveLength(
      0,
    );
    fixture.componentRef.setInput('stay', {
      ...stay,
      startAt: '2000-01-01T00:00:00',
      endAt: '2000-01-02T00:00:00',
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-payment-action="register"]')).toBeNull();
  });
  it('uses shared protected deletion for active and annulled payments', () => {
    const component = create().componentInstance;
    component.remove(payment);
    expect(dialog.open).toHaveBeenCalledWith(
      PermanentDeletionConfirmationDialog,
      expect.any(Object),
    );
    closed.next(undefined);
    component.remove(annulled);
    expect(dialog.open).toHaveBeenLastCalledWith(
      PermanentDeletionConfirmationDialog,
      expect.any(Object),
    );
    expect(api.removePayment).not.toHaveBeenCalled();
  });
  it('enforces page-wide single flight and clears stale removal error before payment actions', () => {
    const fixture = create();
    const component = fixture.componentInstance;
    fixture.componentRef.setInput('externalMutationLocked', true);
    fixture.detectChanges();
    component.startRegister();
    expect(dialog.open).not.toHaveBeenCalled();
    fixture.componentRef.setInput('externalMutationLocked', false);
    component.error.set('stale');
    component.removalPayment.set(payment);
    component.removalReason.set('old');
    component.startRegister();
    expect(component.error()).toBeNull();
    expect(component.removalPayment()).toBeNull();
    expect(component.removalReason()).toBe('');
  });
  it('passes localized permanent-removal subject/reason and preserves recovery after failure', () => {
    api.removePayment.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    const fixture = create();
    const component = fixture.componentInstance;
    component.remove(annulled);
    expect(dialog.open).toHaveBeenCalledWith(
      PermanentDeletionConfirmationDialog,
      expect.objectContaining({
        data: expect.objectContaining({ subject: expect.stringContaining('10 · 05/08/2026') }),
      }),
    );
    closed.next({ confirmed: true, reason: 'Duplicate' });
    expect(api.removePayment).toHaveBeenCalledWith('s1', 'p2', { reason: 'Duplicate' });
    expect(component.removalPayment()).toBe(annulled);
    expect(component.removalReason()).toBe('Duplicate');
    expect(component.error()).toBe(component.text().stays.payments.errors.conflict);
  });
  it('emits authoritative removal success and restores focus to a surviving action', async () => {
    const updated = { ...stay, payments: [annulled] };
    api.removePayment.mockReturnValue(of(updated));
    const fixture = create();
    const component = fixture.componentInstance;
    const emitted = vi.fn();
    component.stayChange.subscribe(emitted);
    const trigger = fixture.nativeElement.querySelector(
      '[data-payment-id="p1"][data-payment-action="remove"]',
    ) as HTMLButtonElement;
    trigger.focus();
    component.remove(payment, trigger);
    closed.next({ confirmed: true, reason: 'Mistake' });
    fixture.componentRef.setInput('stay', updated);
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    expect(emitted).toHaveBeenCalledWith(updated);
    expect(document.activeElement).toBe(
      fixture.nativeElement.querySelector('[data-payment-action="register"]'),
    );
  });
  it('restores payment action focus after dismissal and authoritative replacement', async () => {
    const fixture = create();
    const component = fixture.componentInstance;
    const edit = fixture.nativeElement.querySelector(
      '[data-payment-id="p1"][data-payment-action="edit"]',
    ) as HTMLButtonElement;
    component.startEdit(payment, edit);
    closed.next(undefined);
    await new Promise((resolve) => setTimeout(resolve));
    expect(document.activeElement).toBe(edit);
    closed = new Subject();
    dialog.open.mockReturnValue({ afterClosed: () => closed.asObservable() });
    component.startAnnul(payment);
    closed.next({ ...stay, payments: [annulled] });
    fixture.componentRef.setInput('stay', { ...stay, payments: [annulled] });
    fixture.detectChanges();
    await new Promise((resolve) => setTimeout(resolve));
    expect(document.activeElement).toBe(
      fixture.nativeElement.querySelector('[data-payment-action="register"]'),
    );
  });
  it('resets errors on language change and keeps failed-removal recovery dismissible', async () => {
    const fixture = create();
    const component = fixture.componentInstance;
    component.error.set('failure');
    component.removalPayment.set(payment);
    TestBed.inject(I18nService).toggleLanguage();
    expect(component.error()).toBeNull();
    component.abandonRemoval();
    await new Promise((resolve) => setTimeout(resolve));
    expect(component.removalPayment()).toBeNull();
    expect(component.removalReason()).toBe('');
  });
});
