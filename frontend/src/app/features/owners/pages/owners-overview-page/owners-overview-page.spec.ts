import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router';
import { EMPTY, of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import { OwnerApiService } from '../../services/owner-api.service';
import { OwnersOverviewPage } from './owners-overview-page';

describe('OwnersOverviewPage paging', () => {
  const pending = new Subject<any>();
  const api = { getOwnerOverview: vi.fn(() => pending.asObservable()), getOwnerDetail: vi.fn() };
  beforeEach(async () => {
    vi.clearAllMocks();
    api.getOwnerDetail.mockReturnValue(
      of({
        owner: { id: 'selected', fullName: 'Selected Owner' },
        cats: { items: [{ id: 'cat', name: 'Context Cat' }], totalElements: 1 },
        stays: { items: [], totalElements: 0 },
      }),
    );
    await TestBed.configureTestingModule({
      imports: [OwnersOverviewPage],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: OwnerApiService, useValue: api },
        { provide: EntityDetailDialogService, useValue: { open: () => EMPTY } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { queryParamMap: convertToParamMap({}) } },
        },
      ],
    }).compileComponents();
  });
  it('debounces one-character search, pages immediately, and ignores superseded responses', () => {
    vi.useFakeTimers();
    const first = new Subject<any>();
    const second = new Subject<any>();
    api.getOwnerOverview
      .mockReturnValueOnce(first)
      .mockReturnValueOnce(second)
      .mockReturnValueOnce(of({ items: [], page: 2, pageSize: 10, totalElements: 21 }))
      .mockReturnValueOnce(
        of({
          items: [{ id: 'o', fullName: 'Ada', cats: [] }],
          page: 0,
          pageSize: 10,
          totalElements: 1,
        }),
      );
    const fixture = TestBed.createComponent(OwnersOverviewPage);
    fixture.detectChanges();
    fixture.componentInstance.setSearchText('A');
    vi.advanceTimersByTime(299);
    expect(api.getOwnerOverview).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(api.getOwnerOverview).toHaveBeenLastCalledWith(0, 'A');
    first.next({
      items: [{ id: 'old', fullName: 'Old', cats: [] }],
      page: 0,
      pageSize: 10,
      totalElements: 1,
    });
    expect(fixture.componentInstance.owners()).toEqual([]);
    fixture.componentInstance.changePage({
      pageIndex: 2,
      pageSize: 10,
      length: 21,
      previousPageIndex: 0,
    });
    expect(api.getOwnerOverview).toHaveBeenLastCalledWith(2, 'A');
    fixture.componentInstance.clearSearch();
    expect(api.getOwnerOverview).toHaveBeenLastCalledWith(0, '');
    expect(fixture.componentInstance.owners()[0].fullName).toBe('Ada');
    vi.useRealTimers();
  });
  it('renders only name/current Cats with a direct fixed paginator and keyboard activation', () => {
    api.getOwnerOverview.mockReturnValue(
      of({
        items: [{ id: 'o', fullName: 'Ada', cats: [{ id: 'c', name: 'Milo' }] }],
        page: 0,
        pageSize: 10,
        totalElements: 1,
      }),
    );
    const fixture = TestBed.createComponent(OwnersOverviewPage);
    fixture.detectChanges();
    const card = fixture.nativeElement.querySelector('.overview-card');
    expect(card.textContent).toContain('Ada');
    expect(card.textContent).toContain('Milo');
    expect(fixture.nativeElement.querySelector('mat-paginator')).not.toBeNull();
    const open = vi.spyOn(TestBed.inject(EntityDetailDialogService), 'open');
    fixture.componentInstance.activateOwner(
      { key: 'Enter', preventDefault: vi.fn() } as unknown as KeyboardEvent,
      { id: 'o', fullName: 'Ada', cats: [] },
    );
    fixture.componentInstance.activateOwner(
      { key: ' ', preventDefault: vi.fn() } as unknown as KeyboardEvent,
      { id: 'o', fullName: 'Ada', cats: [] },
    );
    expect(open).toHaveBeenCalledTimes(2);
  });
  it('resolves and activates a selected Owner absent from the active page', () => {
    api.getOwnerOverview.mockReturnValue(
      of({
        items: [{ id: 'other', fullName: 'Other', cats: [] }],
        page: 3,
        pageSize: 10,
        totalElements: 31,
      }),
    );
    const fixture = TestBed.createComponent(OwnersOverviewPage);
    fixture.componentInstance.selectedOwnerId.set('selected');
    fixture.componentInstance.loadOwners(3);
    fixture.detectChanges();
    const contextual = fixture.nativeElement.querySelector('.contextual-selection');
    expect(api.getOwnerDetail).toHaveBeenCalledWith('selected');
    expect(contextual.textContent).toContain('Selected Owner');
    expect(contextual.textContent).toContain('Context Cat');
    const open = vi.spyOn(TestBed.inject(EntityDetailDialogService), 'open');
    contextual.click();
    expect(open).toHaveBeenCalledWith({ entityType: 'owner', entityId: 'selected' });
  });
});
