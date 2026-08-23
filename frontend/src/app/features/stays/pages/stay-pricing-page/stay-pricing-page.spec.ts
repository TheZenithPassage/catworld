import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { StayPricingPage } from './stay-pricing-page';

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
  const router = { getCurrentNavigation: vi.fn(), navigateByUrl: vi.fn(), navigate: vi.fn() };

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
      ],
    }).compileComponents();
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
    router.getCurrentNavigation.mockReturnValue({
      extras: { state: { stayPricingOrigin: '/stays?selectedStayId=stay-1' } },
    });
    const fixture = TestBed.createComponent(StayPricingPage);
    const component = fixture.componentInstance;
    const updated = { ...stay, ownerName: 'Grace' };
    component.onStayChanged(updated);
    component.back();
    expect(component.stay()).toBe(updated);
    expect(router.navigateByUrl).toHaveBeenCalledWith('/stays?selectedStayId=stay-1');
  });
});
