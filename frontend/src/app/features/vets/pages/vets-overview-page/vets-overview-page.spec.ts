import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { EMPTY, of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import { VetApiService } from '../../services/vet-api.service';
import { VetsOverviewPage } from './vets-overview-page';
describe('VetsOverviewPage paging', () => {
  const api = { getVetOverview: vi.fn() };
  beforeEach(async () => {
    vi.clearAllMocks();
    api.getVetOverview.mockReturnValue(of({ items: [], page: 0, pageSize: 10, totalElements: 0 }));
    await TestBed.configureTestingModule({
      imports: [VetsOverviewPage],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: VetApiService, useValue: api },
        { provide: EntityDetailDialogService, useValue: { open: () => EMPTY } },
      ],
    }).compileComponents();
  });
  it('debounces search and clamps an impossible page', () => {
    vi.useFakeTimers();
    const impossible = new Subject<any>();
    api.getVetOverview
      .mockReturnValueOnce(of({ items: [], page: 0, pageSize: 10, totalElements: 0 }))
      .mockReturnValueOnce(of({ items: [], page: 0, pageSize: 10, totalElements: 0 }))
      .mockReturnValueOnce(impossible)
      .mockReturnValueOnce(
        of({
          items: [{ id: 'v', name: 'Vet', address: 'Lane' }],
          page: 1,
          pageSize: 10,
          totalElements: 11,
        }),
      );
    const f = TestBed.createComponent(VetsOverviewPage);
    f.detectChanges();
    f.componentInstance.setSearchText('V');
    vi.advanceTimersByTime(300);
    expect(api.getVetOverview).toHaveBeenLastCalledWith(0, 'V');
    f.componentInstance.changePage({
      pageIndex: 4,
      pageSize: 10,
      length: 41,
      previousPageIndex: 0,
    });
    impossible.next({ items: [], page: 4, pageSize: 10, totalElements: 11 });
    expect(api.getVetOverview).toHaveBeenLastCalledWith(1, 'V');
    expect(f.componentInstance.page()).toBe(1);
    vi.useRealTimers();
  });
  it('renders only name and address with direct paginator', () => {
    api.getVetOverview.mockReturnValue(
      of({
        items: [{ id: 'v', name: 'Vet', address: 'Lane' }],
        page: 0,
        pageSize: 10,
        totalElements: 1,
      }),
    );
    const f = TestBed.createComponent(VetsOverviewPage);
    f.detectChanges();
    expect(f.nativeElement.querySelector('.overview-card').textContent).toContain('Vet');
    expect(f.nativeElement.querySelector('.overview-card').textContent).toContain('Lane');
    expect(f.nativeElement.querySelector('mat-paginator')).not.toBeNull();
    const open = vi.spyOn(TestBed.inject(EntityDetailDialogService), 'open');
    f.componentInstance.activateVet(
      { key: ' ', preventDefault: vi.fn() } as unknown as KeyboardEvent,
      { id: 'v', name: 'Vet', address: 'Lane' },
    );
    expect(open).toHaveBeenCalledWith({ entityType: 'vet', entityId: 'v' });
  });
});
