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
  const api = { getOwnerOverview: vi.fn(() => pending.asObservable()), getOwnerLookup: vi.fn() };
  beforeEach(async () => {
    vi.clearAllMocks();
    api.getOwnerLookup.mockReturnValue(
      of({
        id: 'selected',
        fullName: 'Selected Owner',
        currentCats: Array.from({ length: 5 }, (_, index) => ({
          id: `cat-${index}`,
          name: `Context Cat ${index + 1}`,
        })),
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
    first.next({
      items: [{ id: 'old', fullName: 'Old', cats: [] }],
      page: 4,
      pageSize: 10,
      totalElements: 41,
    });
    expect(fixture.componentInstance.owners()).toEqual([]);
    expect(fixture.componentInstance.page()).toBe(0);
    vi.advanceTimersByTime(299);
    expect(api.getOwnerOverview).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(1);
    expect(api.getOwnerOverview).toHaveBeenLastCalledWith(0, 'A');
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
  it('clamps a non-zero page to zero when the matching population becomes empty', () => {
    api.getOwnerOverview
      .mockReturnValueOnce(of({ items: [], page: 0, pageSize: 10, totalElements: 0 }))
      .mockReturnValueOnce(of({ items: [], page: 3, pageSize: 10, totalElements: 0 }))
      .mockReturnValueOnce(of({ items: [], page: 0, pageSize: 10, totalElements: 0 }));
    const fixture = TestBed.createComponent(OwnersOverviewPage);
    fixture.detectChanges();
    fixture.componentInstance.loadOwners(3);
    expect(api.getOwnerOverview).toHaveBeenLastCalledWith(0, '');
    expect(fixture.componentInstance.page()).toBe(0);
    expect(fixture.componentInstance.totalElements()).toBe(0);
  });
  it('cancels pending search and active overview work when destroyed', () => {
    vi.useFakeTimers();
    const initial = new Subject<any>();
    const active = new Subject<any>();
    api.getOwnerOverview.mockReturnValueOnce(initial).mockReturnValueOnce(active);
    const fixture = TestBed.createComponent(OwnersOverviewPage);
    fixture.detectChanges();
    fixture.componentInstance.setSearchText('A');
    fixture.componentInstance.loadOwners(0);
    expect(active.observed).toBe(true);
    fixture.destroy();
    expect(active.observed).toBe(false);
    vi.advanceTimersByTime(300);
    expect(api.getOwnerOverview).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
  it('cancels contextual Owner resolution when destroyed', () => {
    const overview = new Subject<any>();
    const selected = new Subject<any>();
    api.getOwnerOverview.mockReturnValue(overview);
    api.getOwnerLookup.mockReturnValue(selected);
    const fixture = TestBed.createComponent(OwnersOverviewPage);
    fixture.componentInstance.selectedOwnerId.set('selected');
    overview.next({
      items: [{ id: 'other', fullName: 'Other', cats: [] }],
      page: 0,
      pageSize: 10,
      totalElements: 1,
    });
    expect(selected.observed).toBe(true);
    fixture.destroy();
    expect(overview.observed).toBe(false);
    expect(selected.observed).toBe(false);
  });
  it('shows the ordinary empty state when an effective search probes a globally empty population', () => {
    vi.useFakeTimers();
    api.getOwnerOverview
      .mockReturnValueOnce(
        of({
          items: [{ id: 'o', fullName: 'Ada', cats: [] }],
          page: 0,
          pageSize: 10,
          totalElements: 1,
        }),
      )
      .mockReturnValueOnce(of({ items: [], page: 0, pageSize: 10, totalElements: 0 }))
      .mockReturnValueOnce(of({ items: [], page: 0, pageSize: 10, totalElements: 0 }));
    const fixture = TestBed.createComponent(OwnersOverviewPage);
    fixture.detectChanges();
    fixture.componentInstance.setSearchText(' Missing ');
    vi.advanceTimersByTime(300);
    fixture.detectChanges();
    expect(api.getOwnerOverview).toHaveBeenNthCalledWith(2, 0, 'Missing');
    expect(api.getOwnerOverview).toHaveBeenNthCalledWith(3, 0, '');
    expect(fixture.componentInstance.globallyEmpty()).toBe(true);
    expect(fixture.nativeElement.querySelector('app-ui-state').textContent).toContain(
      fixture.componentInstance.text().owners.overview.empty,
    );
    vi.useRealTimers();
  });
  it('shows the filtered empty state when an unfiltered Owner probe finds records', () => {
    vi.useFakeTimers();
    api.getOwnerOverview
      .mockReturnValueOnce(
        of({
          items: [{ id: 'o', fullName: 'Ada', cats: [] }],
          page: 0,
          pageSize: 10,
          totalElements: 1,
        }),
      )
      .mockReturnValueOnce(of({ items: [], page: 0, pageSize: 10, totalElements: 0 }))
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
    fixture.componentInstance.setSearchText('Missing');
    vi.advanceTimersByTime(300);
    fixture.detectChanges();
    expect(fixture.componentInstance.globallyEmpty()).toBe(false);
    expect(fixture.nativeElement.querySelector('app-ui-state').textContent).toContain(
      fixture.componentInstance.text().owners.overview.emptyFiltered,
    );
    vi.useRealTimers();
  });
  it('cancels a stale Owner empty-state probe before a newer search can be overwritten', () => {
    vi.useFakeTimers();
    const staleProbe = new Subject<any>();
    api.getOwnerOverview
      .mockReturnValueOnce(
        of({
          items: [{ id: 'o', fullName: 'Ada', cats: [] }],
          page: 0,
          pageSize: 10,
          totalElements: 1,
        }),
      )
      .mockReturnValueOnce(of({ items: [], page: 0, pageSize: 10, totalElements: 0 }))
      .mockReturnValueOnce(staleProbe)
      .mockReturnValueOnce(
        of({
          items: [{ id: 'n', fullName: 'New', cats: [] }],
          page: 0,
          pageSize: 10,
          totalElements: 1,
        }),
      );
    const fixture = TestBed.createComponent(OwnersOverviewPage);
    fixture.detectChanges();
    fixture.componentInstance.setSearchText('Missing');
    vi.advanceTimersByTime(300);
    expect(staleProbe.observed).toBe(true);
    fixture.componentInstance.setSearchText('New');
    expect(staleProbe.observed).toBe(false);
    vi.advanceTimersByTime(300);
    staleProbe.next({ items: [], page: 0, pageSize: 10, totalElements: 0 });
    expect(fixture.componentInstance.owners()[0].fullName).toBe('New');
    expect(fixture.componentInstance.globallyEmpty()).toBe(false);
    vi.useRealTimers();
  });
  it('treats whitespace-only Owner search text as unfiltered', () => {
    vi.useFakeTimers();
    api.getOwnerOverview.mockReturnValue(
      of({ items: [], page: 0, pageSize: 10, totalElements: 0 }),
    );
    const fixture = TestBed.createComponent(OwnersOverviewPage);
    fixture.detectChanges();
    fixture.componentInstance.setSearchText('   ');
    vi.advanceTimersByTime(300);
    expect(api.getOwnerOverview).toHaveBeenLastCalledWith(0, '');
    expect(api.getOwnerOverview).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.globallyEmpty()).toBe(true);
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
    expect(api.getOwnerLookup).toHaveBeenCalledWith('selected');
    expect(contextual.textContent).toContain('Selected Owner');
    for (let index = 1; index <= 5; index++)
      expect(contextual.textContent).toContain(`Context Cat ${index}`);
    const open = vi.spyOn(TestBed.inject(EntityDetailDialogService), 'open');
    contextual.click();
    expect(open).toHaveBeenCalledWith({ entityType: 'owner', entityId: 'selected' });
  });
});
