import { Component, input, output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, DefaultUrlSerializer, Router } from '@angular/router';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { StayPricingPage } from './stay-pricing-page';
import { StayPayments } from '../../components/stay-payments/stay-payments';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';

@Component({ selector: 'app-stay-payments', template: '', standalone: true })
class StayPaymentsStub {
  readonly stay = input.required<Stay>();
  readonly externalMutationLocked = input(false);
  readonly stayChange = output<Stay>();
  readonly mutationLockChange = output<boolean>();
}

describe('StayPricingPage', () => {
  const stay: Stay = {
    stayId: 'stay-1',
    startAt: '2099-01-02T10:00:00',
    endAt: '2099-01-09T10:00:00',
    numberOfNights: 7,
    cancelledAt: null,
    createdAt: '2026-01-01T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
    notes: 'hidden',
    catIds: ['cat-1'],
    ownerId: 'owner-1',
    ownerName: 'Ada',
    cats: [{ catId: 'cat-1', name: 'Milo' }],
    retainedNightlyRate: null,
    suggestedAmount: null,
    agreedAmount: null,
    totalPaid: '0',
    remainingAmount: null,
    paymentCondition: 'NO_PAYMENT',
    outstandingCollectionEligible: false,
    payments: [],
  };
  const api = { getStayById: vi.fn(() => of(stay)) };
  let role: 'ADMIN' | 'STAFF';
  let dialogResult: Subject<Stay | undefined>;
  const dialog = { open: vi.fn() };
  const serializer = new DefaultUrlSerializer();
  const router = {
    getCurrentNavigation: vi.fn(),
    navigateByUrl: vi.fn(),
    navigate: vi.fn(),
    parseUrl: (url: string) => serializer.parse(url),
    serializeUrl: (tree: ReturnType<DefaultUrlSerializer['parse']>) => serializer.serialize(tree),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    role = 'STAFF';
    dialogResult = new Subject();
    dialog.open.mockReturnValue({ afterClosed: () => dialogResult.asObservable() });
    api.getStayById.mockReturnValue(of(stay));
    router.getCurrentNavigation.mockReturnValue(null);
    await TestBed.configureTestingModule({
      imports: [StayPricingPage],
      providers: [
        provideNoopAnimations(),
        { provide: StayApiService, useValue: api },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ id: 'stay-1' }) } },
        },
        { provide: Router, useValue: router },
        { provide: AuthSessionService, useValue: { hasRole: (value: string) => value === role } },
        { provide: MatDialog, useValue: dialog },
      ],
    })
      .overrideComponent(StayPricingPage, {
        remove: { imports: [StayPayments] },
        add: { imports: [StayPaymentsStub] },
      })
      .compileComponents();
  });

  it('shows correction only to ADMIN with a known agreement and replaces authoritative results', () => {
    role = 'ADMIN';
    api.getStayById.mockReturnValue(of({ ...stay, agreedAmount: '20' }));
    const fixture = TestBed.createComponent(StayPricingPage);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector(
      '[data-pricing-action="correct-agreement"]',
    ) as HTMLButtonElement | null;
    expect(button).not.toBeNull();
    button!.click();
    expect(fixture.componentInstance.correctionOpen()).toBe(true);
    const updated = { ...stay, agreedAmount: '21' };
    dialogResult.next(updated);
    expect(fixture.componentInstance.stay()).toBe(updated);
    expect(fixture.componentInstance.correctionOpen()).toBe(false);
  });

  it('serializes correction against payment/removal flows and dismissal changes nothing', () => {
    role = 'ADMIN';
    api.getStayById.mockReturnValue(of({ ...stay, agreedAmount: '20' }));
    const fixture = TestBed.createComponent(StayPricingPage);
    fixture.detectChanges();
    const payments = fixture.debugElement.query(By.directive(StayPaymentsStub)).componentInstance;
    payments.mutationLockChange.emit(true);
    fixture.detectChanges();
    fixture.componentInstance.correctAgreement();
    expect(dialog.open).not.toHaveBeenCalled();
    payments.mutationLockChange.emit(false);
    fixture.componentInstance.correctAgreement();
    fixture.detectChanges();
    expect(payments.externalMutationLocked()).toBe(true);
    dialogResult.next(undefined);
    expect(fixture.componentInstance.stay()?.agreedAmount).toBe('20');
  });

  it('shows context without notes and an explicit empty economic state for a null agreement', () => {
    const fixture = TestBed.createComponent(StayPricingPage);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ada');
    expect(fixture.nativeElement.textContent).toContain('Milo');
    expect(fixture.nativeElement.textContent).not.toContain('hidden');
    expect(fixture.nativeElement.querySelector('app-stay-payments')).toBeNull();
    expect(fixture.nativeElement.querySelector('app-ui-state')).not.toBeNull();
  });

  it('replaces the authoritative displayed stay and uses a reliable captured origin for Back', () => {
    api.getStayById.mockReturnValue(of({ ...stay, agreedAmount: '9999999999999999999' }));
    router.getCurrentNavigation.mockReturnValue({
      extras: { state: { stayPricingOrigin: '/stays?selectedStayId=stay-1' } },
    });
    const fixture = TestBed.createComponent(StayPricingPage);
    const component = fixture.componentInstance;
    fixture.detectChanges();
    const updated = {
      ...stay,
      agreedAmount: '9999999999999999999',
      totalPaid: '1',
      remainingAmount: '9999999999999999998',
      ownerName: 'Grace',
    };
    fixture.debugElement
      .query(By.directive(StayPaymentsStub))
      .componentInstance.stayChange.emit(updated);
    component.back();
    expect(component.stay()).toBe(updated);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/stays?selectedStayId=stay-1');
    expect(fixture.nativeElement.querySelector('app-stay-payments')).not.toBeNull();
  });

  it.each([
    ['absent', null],
    ['network path', '//example.test/stays'],
    ['external URL', 'https://example.test/stays'],
    ['malformed URL', '/%'],
    ['normalized URL', '/stays?'],
  ])('falls back to /stays for %s navigation state', (_label, origin) => {
    router.getCurrentNavigation.mockReturnValue(
      origin === null ? null : { extras: { state: { stayPricingOrigin: origin } } },
    );
    const fixture = TestBed.createComponent(StayPricingPage);
    fixture.componentInstance.back();
    expect(router.navigate).toHaveBeenCalledWith(['/stays']);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
