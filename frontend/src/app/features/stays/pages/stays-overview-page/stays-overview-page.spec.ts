import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { BehaviorSubject, EMPTY, of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import { StayApiService } from '../../services/stay-api.service';
import { StayStatusVisibilityPreferencesService } from '../../services/stay-status-visibility-preferences.service';
import { StaysOverviewPage } from './stays-overview-page';
describe('StaysOverviewPage server paging', () => {
  const api = { getStayOverview: vi.fn(), getStayDetail: vi.fn(), getStayById: vi.fn() };
  const visibility = {
    read: () => ({ reserved: true, 'checked-in': true, 'checked-out': false, cancelled: false }),
    store: vi.fn(),
  };
  const queryParams = new BehaviorSubject(convertToParamMap({ selectedStayId: 's', page: '2' }));
  beforeEach(async () => {
    vi.clearAllMocks();
    queryParams.next(convertToParamMap({ selectedStayId: 's', page: '2' }));
    api.getStayOverview.mockReturnValue(of({ items: [], page: 0, pageSize: 10, totalElements: 0 }));
    api.getStayDetail.mockReturnValue(
      of({
        stayId: 's',
        status: 'RESERVED',
        startAt: '2099-01-01T10:00:00',
        endAt: '2099-01-02T10:00:00',
        numberOfNights: 1,
        notes: null,
        owner: { id: 'o', fullName: 'Ada' },
        cats: {
          items: [{ id: 'c', name: 'Milo', ownerId: 'o', ownerName: 'Ada' }],
          totalElements: 1,
        },
      }),
    );
    api.getStayById.mockReturnValue(
      of({
        ownerId: 'o',
        cats: Array.from({ length: 5 }, (_, index) => ({
          catId: `c-${index}`,
          name: `Stay Cat ${index + 1}`,
        })),
        paymentCondition: 'NO_PAYMENT',
        outstandingCollectionEligible: false,
      }),
    );
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
            queryParamMap: queryParams,
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
    expect(api.getStayOverview).toHaveBeenCalledWith(
      0,
      expect.objectContaining({ outstandingOnly: true }),
    );
  });
  it('clamps an empty matching population to page zero and clears the synchronized page', () => {
    api.getStayOverview
      .mockReturnValueOnce(of({ items: [], page: 2, pageSize: 10, totalElements: 0 }))
      .mockReturnValueOnce(of({ items: [], page: 0, pageSize: 10, totalElements: 0 }));
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const f = TestBed.createComponent(StaysOverviewPage);
    f.detectChanges();
    expect(api.getStayOverview.mock.calls[0][0]).toBe(2);
    expect(api.getStayOverview).toHaveBeenLastCalledWith(0, expect.any(Object));
    expect(f.componentInstance.page()).toBe(0);
    expect(f.componentInstance.totalElements()).toBe(0);
    expect(navigate).toHaveBeenLastCalledWith(
      [],
      expect.objectContaining({ queryParams: expect.objectContaining({ page: null }) }),
    );
  });
  it('renders the ordinary empty state when the complete Stay population is empty', () => {
    queryParams.next(convertToParamMap({}));
    const f = TestBed.createComponent(StaysOverviewPage);
    f.detectChanges();
    expect(api.getStayOverview).toHaveBeenCalledWith(0, {
      statuses: ['RESERVED', 'CHECKED_IN', 'CHECKED_OUT', 'CANCELLED'],
      ownerId: null,
      catId: null,
      paymentConditions: ['NO_PAYMENT', 'PARTIAL_PAYMENT', 'FULL_PAYMENT'],
      outstandingOnly: false,
    });
    expect(f.nativeElement.textContent).toContain(f.componentInstance.text().stays.overview.empty);
    expect(f.nativeElement.textContent).not.toContain(
      f.componentInstance.text().stays.overview.emptyFiltered,
    );
  });
  it('renders the filtered empty state when Stays exist outside the active filters', () => {
    queryParams.next(convertToParamMap({}));
    api.getStayOverview.mockImplementation((_page: number, filters: any) =>
      of({
        items: [],
        page: 0,
        pageSize: 10,
        totalElements: filters.statuses.length === 4 ? 1 : 0,
      }),
    );
    const f = TestBed.createComponent(StaysOverviewPage);
    f.detectChanges();
    expect(f.nativeElement.textContent).toContain(
      f.componentInstance.text().stays.overview.emptyFiltered,
    );
    expect(f.nativeElement.textContent).not.toContain(
      f.componentInstance.text().stays.overview.empty,
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
  it('keeps an off-page selected Stay present and actionable without changing the active page', () => {
    api.getStayOverview.mockReturnValue(
      of({
        items: [
          {
            id: 'other',
            startAt: '2099-02-01T10:00:00',
            endAt: '2099-02-02T10:00:00',
            status: 'RESERVED',
            ownerId: 'x',
            ownerName: 'Other',
            cats: [{ id: 'x', name: 'Other Cat' }],
          },
        ],
        page: 2,
        pageSize: 10,
        totalElements: 30,
      }),
    );
    const f = TestBed.createComponent(StaysOverviewPage);
    f.detectChanges();
    const contextual = f.nativeElement.querySelector('.contextual-selection');
    expect(api.getStayDetail).toHaveBeenCalledWith('s');
    expect(api.getStayById).toHaveBeenCalledWith('s');
    expect(f.componentInstance.page()).toBe(2);
    for (let index = 1; index <= 5; index++)
      expect(contextual.textContent).toContain(`Stay Cat ${index}`);
    expect(contextual.textContent).toContain(f.componentInstance.text().stays.status.reserved);
    const open = vi.spyOn(TestBed.inject(EntityDetailDialogService), 'open');
    contextual.click();
    expect(open).toHaveBeenCalledWith({ entityType: 'stay', entityId: 's' });
  });
  it('does not reintroduce an off-page selected Stay hidden by the active status filters', () => {
    api.getStayOverview.mockReturnValue(
      of({
        items: [
          {
            id: 'other',
            startAt: '2099-02-01T10:00:00',
            endAt: '2099-02-02T10:00:00',
            status: 'RESERVED',
            ownerId: 'x',
            ownerName: 'Other',
            cats: [{ id: 'x', name: 'Other Cat' }],
          },
        ],
        page: 2,
        pageSize: 10,
        totalElements: 30,
      }),
    );
    api.getStayDetail.mockReturnValue(
      of({
        stayId: 's',
        status: 'CHECKED_OUT',
        startAt: '2099-01-01T10:00:00',
        endAt: '2099-01-02T10:00:00',
        numberOfNights: 1,
        notes: null,
        owner: { id: 'o', fullName: 'Ada' },
        cats: { items: [], totalElements: 0 },
      }),
    );
    const f = TestBed.createComponent(StaysOverviewPage);
    f.detectChanges();
    expect(api.getStayDetail).toHaveBeenCalledWith('s');
    expect(f.componentInstance.selectedStay()).toBeNull();
    expect(f.nativeElement.querySelector('.contextual-selection')).toBeNull();
  });
  it('cancels pending overview work and blocks query synchronization after destruction', () => {
    const pending = new Subject<any>();
    api.getStayOverview.mockReturnValue(pending);
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const f = TestBed.createComponent(StaysOverviewPage);
    f.detectChanges();
    expect(pending.observed).toBe(true);
    f.destroy();
    expect(pending.observed).toBe(false);
    pending.next({ items: [], page: 2, pageSize: 10, totalElements: 0 });
    f.componentInstance.loadStays(0);
    expect(api.getStayOverview).toHaveBeenCalledTimes(1);
    expect(navigate).not.toHaveBeenCalled();
  });
  it('cancels contextual Stay resolution and detail-close reloads after destruction', () => {
    const detail = new Subject<any>();
    const stay = new Subject<any>();
    const detailClosed = new Subject<any>();
    api.getStayOverview.mockReturnValue(
      of({
        items: [
          {
            id: 'other',
            startAt: '2099-02-01T10:00:00',
            endAt: '2099-02-02T10:00:00',
            status: 'RESERVED',
            ownerId: 'x',
            ownerName: 'Other',
            cats: [{ id: 'x', name: 'Other Cat' }],
          },
        ],
        page: 2,
        pageSize: 10,
        totalElements: 30,
      }),
    );
    api.getStayDetail.mockReturnValue(detail);
    api.getStayById.mockReturnValue(stay);
    const details = TestBed.inject(EntityDetailDialogService);
    vi.spyOn(details, 'open').mockReturnValue(detailClosed);
    const f = TestBed.createComponent(StaysOverviewPage);
    f.detectChanges();
    expect(detail.observed).toBe(true);
    expect(stay.observed).toBe(true);
    f.componentInstance.openDetail(f.componentInstance.stays()[0]);
    api.getStayOverview.mockClear();
    f.destroy();
    expect(detail.observed).toBe(false);
    expect(stay.observed).toBe(false);
    expect(detailClosed.observed).toBe(false);
    detail.next({});
    stay.next({});
    detailClosed.next({});
    expect(f.componentInstance.selectedStay()).toBeNull();
    expect(api.getStayOverview).not.toHaveBeenCalled();
  });
  it('cancels deferred selected-Stay scrolling when destroyed', () => {
    vi.useFakeTimers();
    const scrollIntoView = vi.fn();
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
        page: 2,
        pageSize: 10,
        totalElements: 30,
      }),
    );
    const f = TestBed.createComponent(StaysOverviewPage);
    vi.spyOn(document, 'getElementById').mockReturnValue({
      scrollIntoView,
    } as unknown as HTMLElement);
    f.detectChanges();
    f.destroy();
    vi.runAllTimers();
    expect(scrollIntoView).not.toHaveBeenCalled();
    vi.useRealTimers();
  });
});
