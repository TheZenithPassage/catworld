import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Subject } from 'rxjs';
import { vi } from 'vitest';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';
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
    host.querySelector<HTMLButtonElement>('[data-payment-action="register"]')!.click();
    expect(dialog.open).toHaveBeenCalledWith(
      PaymentActionDialog,
      expect.objectContaining({ data: { stay, mode: 'register', payment: undefined } }),
    );
    expect(host.querySelector('form')).toBeNull();
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
});
