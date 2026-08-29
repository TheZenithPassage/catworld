import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { EMPTY, Observable, of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Vet } from '../../models/vet.model';
import { VetApiService } from '../../services/vet-api.service';
import { VetsOverviewPage } from './vets-overview-page';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import type { EntityDetailUpdate } from '../../../../shared/entity-detail/entity-reference';

describe('VetsOverviewPage', () => {
  const vets: Vet[] = [
    {
      id: 'vet-1',
      name: 'Dr. Whiskers',
      address: '2 Clinic Road',
      phoneNumber: '555-4444',
      registrationNumber: 'REG-1',
    },
    {
      id: 'vet-2',
      name: 'Dr. Paws',
      address: null,
      phoneNumber: null,
      registrationNumber: null,
    },
  ];

  const vetApiService = {
    getVets: vi.fn(),
  };
  const details = { open: vi.fn((): Observable<EntityDetailUpdate> => EMPTY) };

  let component: VetsOverviewPage;
  let fixture: ComponentFixture<VetsOverviewPage>;

  beforeEach(async () => {
    vi.resetAllMocks();
    vetApiService.getVets.mockReturnValue(of(vets));

    await TestBed.configureTestingModule({
      imports: [VetsOverviewPage],
      providers: [
        provideNoopAnimations(),
        provideRouter([{ path: 'vets/:id/edit', component: VetsOverviewPage }]),
        { provide: VetApiService, useValue: vetApiService },
        { provide: EntityDetailDialogService, useValue: details },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(VetsOverviewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('renders keyboard-focusable vet rows without an Actions column', () => {
    createComponent();

    const compiled = fixture.nativeElement as HTMLElement;
    const headerText = [...compiled.querySelectorAll('th')]
      .map((header) => header.textContent?.trim())
      .join(' ');

    expect(compiled.querySelector('table[mat-table]')).not.toBeNull();
    expect(headerText).toContain(component.text().vets.overview.table.name);
    expect(headerText).not.toContain(component.text().vets.overview.table.actions);
    expect(compiled.textContent).toContain('Dr. Whiskers');
    expect(compiled.textContent).toContain('555-4444');
    expect(compiled.querySelector('a[mat-flat-button]')?.textContent).toContain(
      component.text().vets.overview.create,
    );
    expect(compiled.querySelector('tr[mat-row][tabindex="0"]')).not.toBeNull();
    expect(compiled.querySelector('a[mat-stroked-button]')).toBeNull();
    const row = compiled.querySelector('tr[mat-row]') as HTMLElement;
    expect(row.getAttribute('aria-label')).toBe(
      `${component.text().vets.detail.openDetails}: Dr. Whiskers`,
    );
    row.click();
    row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    row.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(details.open).toHaveBeenCalledTimes(3);
    expect(details.open).toHaveBeenLastCalledWith({ entityType: 'vet', entityId: 'vet-1' });
  });

  it('filters vets by name and shows the filtered-empty state', () => {
    createComponent();

    component.setSearchText('Paws');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Dr. Paws');
    expect(fixture.nativeElement.textContent).not.toContain('Dr. Whiskers');

    component.setSearchText('No match');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      component.text().vets.overview.emptyFiltered,
    );
    expect(fixture.nativeElement.querySelector('table[mat-table]')).toBeNull();
  });

  it('reloads vets only after the dialog reports a successful update', () => {
    const updates = new Subject<{ entityType: 'vet'; entityId: string }>();
    details.open.mockReturnValueOnce(updates.asObservable());
    createComponent();

    component.openVet(vets[0]);
    expect(vetApiService.getVets).toHaveBeenCalledTimes(1);

    updates.next({ entityType: 'vet', entityId: 'vet-1' });
    expect(vetApiService.getVets).toHaveBeenCalledTimes(2);
  });

  it('renders empty and error states outside the Material table', async () => {
    vetApiService.getVets.mockReturnValueOnce(of([]));
    createComponent();
    expect(fixture.nativeElement.textContent).toContain(component.text().vets.overview.empty);
    expect(fixture.nativeElement.querySelector('table[mat-table]')).toBeNull();

    TestBed.resetTestingModule();
    vetApiService.getVets.mockReturnValue(throwError(() => new Error('load failed')));

    await TestBed.configureTestingModule({
      imports: [VetsOverviewPage],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: VetApiService, useValue: vetApiService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(VetsOverviewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      component.text().vets.overview.errorLoading,
    );
    expect(fixture.nativeElement.textContent).toContain(component.text().vets.overview.retry);
  });
});
