import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { EntityDetailUpdate } from '../../../../shared/entity-detail/entity-reference';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { StayStatusVisibilityPreferencesService } from '../../services/stay-status-visibility-preferences.service';
import { StaysOverviewPage } from './stays-overview-page';

describe('StaysOverviewPage', () => {
  const stay: Stay = {
    stayId: 'stay-1',
    startAt: '2099-01-02T10:00:00',
    endAt: '2099-01-09T10:00:00',
    numberOfNights: 7,
    cancelledAt: null,
    createdAt: '2026-01-01T00:00:00',
    updatedAt: '2026-01-01T00:00:00',
    notes: null,
    catIds: ['cat-1'],
    ownerId: 'owner-1',
    ownerName: 'Ada',
    cats: [{ catId: 'cat-1', name: 'Milo' }],
    retainedNightlyRate: '10',
    suggestedAmount: '70',
    agreedAmount: '70',
    totalPaid: '0',
    remainingAmount: '70',
    paymentCondition: 'NO_PAYMENT',
    outstandingCollectionEligible: true,
    payments: [],
  };
  const updates = new Subject<EntityDetailUpdate>();
  const detailDialog = { open: vi.fn(() => updates.asObservable()) };

  beforeEach(async () => {
    vi.resetAllMocks();
    await TestBed.configureTestingModule({
      imports: [StaysOverviewPage],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: StayApiService, useValue: { getStays: () => of([stay]) } },
        { provide: EntityDetailDialogService, useValue: detailDialog },
        {
          provide: StayStatusVisibilityPreferencesService,
          useValue: {
            read: () => ({
              reserved: true,
              'checked-in': true,
              'checked-out': true,
              cancelled: true,
            }),
            store: vi.fn(),
          },
        },
        { provide: ActivatedRoute, useValue: { queryParamMap: of(convertToParamMap({})) } },
      ],
    }).compileComponents();
  });

  it('removes Actions and makes rows pointer and keyboard accessible detail triggers', () => {
    const fixture = TestBed.createComponent(StaysOverviewPage);
    fixture.detectChanges();
    const row = fixture.nativeElement.querySelector('tr[mat-row]') as HTMLElement;
    expect(fixture.componentInstance.displayedColumns).not.toContain('actions');
    expect(row.tabIndex).toBe(0);
    row.click();
    expect(detailDialog.open).toHaveBeenCalledWith({ entityType: 'stay', entityId: 'stay-1' });
    const event = new KeyboardEvent('keydown', { key: ' ', cancelable: true });
    row.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(true);
  });
});
