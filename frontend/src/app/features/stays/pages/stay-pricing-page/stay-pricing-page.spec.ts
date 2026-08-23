import { Component, input, output } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, DefaultUrlSerializer, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { StayPricingPage } from './stay-pricing-page';
import { StayPayments } from '../../components/stay-payments/stay-payments';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';

@Component({ selector: 'app-stay-payments', template: '', standalone: true })
class StayPaymentsStub {
  readonly stay = input.required<Stay>();
  readonly stayChange = output<Stay>();
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
        { provide: AuthSessionService, useValue: { hasRole: () => false } },
      ],
    })
      .overrideComponent(StayPricingPage, {
        remove: { imports: [StayPayments] },
        add: { imports: [StayPaymentsStub] },
      })
      .compileComponents();
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
