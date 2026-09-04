import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { EMPTY, of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import { CatApiService } from '../../services/cat-api.service';
import { CatsOverviewPage } from './cats-overview-page';
describe('CatsOverviewPage paging and photos', () => {
  let callback: IntersectionObserverCallback;
  const observe = vi.fn(),
    disconnect = vi.fn(),
    unobserve = vi.fn();
  const api = { getCatOverview: vi.fn(), getCatPhoto: vi.fn() };
  beforeEach(async () => {
    vi.clearAllMocks();
    api.getCatOverview.mockReturnValue(of({ items: [], page: 0, pageSize: 10, totalElements: 0 }));
    globalThis.IntersectionObserver = class {
      constructor(cb: IntersectionObserverCallback) {
        callback = cb;
      }
      observe = observe;
      disconnect = disconnect;
      unobserve = unobserve;
    } as any;
    vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:cat');
    vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    await TestBed.configureTestingModule({
      imports: [CatsOverviewPage],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: CatApiService, useValue: api },
        { provide: EntityDetailDialogService, useValue: { open: () => EMPTY } },
      ],
    }).compileComponents();
  });
  it('debounces remote search and loads a Blob only when visible', () => {
    vi.useFakeTimers();
    const photo = new Subject<Blob>();
    api.getCatOverview.mockReturnValue(
      of({
        items: [{ id: 'c', name: 'Milo', ownerId: 'o', ownerName: 'Ada', hasPhoto: true }],
        page: 0,
        pageSize: 10,
        totalElements: 1,
      }),
    );
    api.getCatPhoto.mockReturnValue(photo);
    const f = TestBed.createComponent(CatsOverviewPage);
    f.detectChanges();
    vi.runAllTimers();
    f.detectChanges();
    vi.runAllTimers();
    expect(observe).toHaveBeenCalled();
    const target = f.nativeElement.querySelector('[data-cat-photo="true"]');
    callback(
      [{ isIntersecting: true, target } as IntersectionObserverEntry],
      {} as IntersectionObserver,
    );
    expect(api.getCatPhoto).toHaveBeenCalledWith('c');
    photo.next(new Blob(['x']));
    expect(f.componentInstance.photos()['c']).toBe('blob:cat');
    f.componentInstance.setSearchText('A');
    vi.advanceTimersByTime(300);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:cat');
    expect(api.getCatOverview).toHaveBeenLastCalledWith(0, 'A');
    vi.useRealTimers();
  });
  it('keeps nested Owner activation from opening the Cat', async () => {
    vi.useFakeTimers();
    api.getCatOverview.mockReturnValue(
      of({
        items: [{ id: 'c', name: 'Milo', ownerId: 'o', ownerName: 'Ada', hasPhoto: false }],
        page: 0,
        pageSize: 10,
        totalElements: 1,
      }),
    );
    const details = TestBed.inject(EntityDetailDialogService);
    const spy = vi.spyOn(details, 'open');
    const f = TestBed.createComponent(CatsOverviewPage);
    f.detectChanges();
    vi.runAllTimers();
    f.detectChanges();
    const ownerLink = f.nativeElement.querySelector('.owner-search-link') as HTMLAnchorElement;
    ownerLink.dispatchEvent(new MouseEvent('click', { bubbles: true, ctrlKey: true }));
    expect(spy).not.toHaveBeenCalled();
    expect(f.nativeElement.querySelector('mat-paginator')).not.toBeNull();
    f.componentInstance.activateCat(
      { key: 'Enter', preventDefault: vi.fn() } as unknown as KeyboardEvent,
      { id: 'c', name: 'Milo', ownerId: 'o', ownerName: 'Ada', hasPhoto: false },
    );
    expect(spy).toHaveBeenCalledWith({ entityType: 'cat', entityId: 'c' });
    vi.useRealTimers();
  });
});
