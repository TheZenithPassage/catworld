import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { EMPTY, of } from 'rxjs';
import { vi } from 'vitest';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import { StayApiService } from '../../services/stay-api.service';
import { StayStatusVisibilityPreferencesService } from '../../services/stay-status-visibility-preferences.service';
import { StaysOverviewPage } from './stays-overview-page';
describe('StaysOverviewPage server paging', () => {
  const api = { getStayOverview: vi.fn() };
  const visibility = {
    read: () => ({ reserved: true, 'checked-in': true, 'checked-out': false, cancelled: false }),
    store: vi.fn(),
  };
  beforeEach(async () => {
    vi.clearAllMocks();
    api.getStayOverview.mockReturnValue(of({ items: [], page: 0, pageSize: 10, totalElements: 0 }));
    await TestBed.configureTestingModule({
      imports: [StaysOverviewPage],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: StayApiService, useValue: api },
        { provide: StayStatusVisibilityPreferencesService, useValue: visibility },
        { provide: EntityDetailDialogService, useValue: { open: () => EMPTY } },
        {
          provide: ActivatedRoute,
          useValue: {
            queryParamMap: of(convertToParamMap({ selectedStayId: 's', page: '2' })),
            snapshot: { queryParamMap: convertToParamMap({}) },
          },
        },
      ],
    }).compileComponents();
  });
  it('encodes defaults, preserves selected identifier, resets membership filters, and clamps', () => {
    api.getStayOverview
      .mockReturnValueOnce(of({ items: [], page: 2, pageSize: 10, totalElements: 11 }))
      .mockReturnValueOnce(
        of({
          items: [
            {
              id: 's',
              startAt: '2099-01-01T10:00:00',
              endAt: '2099-01-02T10:00:00',
              status: 'RESERVED',
              ownerId: 'o',
              ownerName: 'Ada',
              cats: [{ id: 'c', name: 'Milo' }],
            },
          ],
          page: 1,
          pageSize: 10,
          totalElements: 11,
        }),
      )
      .mockReturnValue(of({ items: [], page: 0, pageSize: 10, totalElements: 0 }));
    const f = TestBed.createComponent(StaysOverviewPage);
    f.detectChanges();
    expect(api.getStayOverview.mock.calls[0][0]).toBe(2);
    expect(api.getStayOverview.mock.calls[0][1].statuses).toEqual(['RESERVED', 'CHECKED_IN']);
    expect(f.componentInstance.page()).toBe(1);
    expect(f.componentInstance.isSelectedStay(f.componentInstance.stays()[0])).toBe(true);
    f.componentInstance.setOutstandingOnly(true);
    expect(api.getStayOverview).toHaveBeenLastCalledWith(
      0,
      expect.objectContaining({ outstandingOnly: true }),
    );
  });
  it('renders approved compact summary with direct paginator and opens via keyboard', () => {
    api.getStayOverview.mockReturnValue(
      of({
        items: [
          {
            id: 's',
            startAt: '2099-01-01T10:00:00',
            endAt: '2099-01-02T10:00:00',
            status: 'RESERVED',
            ownerId: 'o',
            ownerName: 'Ada',
            cats: [{ id: 'c', name: 'Milo' }],
          },
        ],
        page: 0,
        pageSize: 10,
        totalElements: 1,
      }),
    );
    const f = TestBed.createComponent(StaysOverviewPage);
    f.detectChanges();
    const card = f.nativeElement.querySelector('.overview-card');
    expect(card.textContent).toContain('Milo');
    expect(card.textContent).toContain('Ada');
    expect(f.nativeElement.querySelector('mat-paginator')).not.toBeNull();
    const open = vi.spyOn(TestBed.inject(EntityDetailDialogService), 'open');
    f.componentInstance.activateRow(
      { key: 'Enter', preventDefault: vi.fn() } as unknown as KeyboardEvent,
      f.componentInstance.stays()[0],
    );
    expect(open).toHaveBeenCalledWith({ entityType: 'stay', entityId: 's' });
  });
});
