import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Vet } from '../../models/vet.model';
import { VetApiService } from '../../services/vet-api.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { VetsOverviewPage } from './vets-overview-page';

describe('VetsOverviewPage', () => {
  const vets: Vet[] = [
    {
      id: 'vet-1',
      name: 'Dr. Whiskers',
      address: '2 Clinic Road',
      phoneNumber: '555-4444',
    },
    {
      id: 'vet-2',
      name: 'Dr. Paws',
      address: null,
      phoneNumber: null,
    },
  ];

  const vetApiService = {
    getVets: vi.fn(),
  };

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

  it('clears a visible overview error on language change without reloading vets', () => {
    createComponent();
    const i18nService = TestBed.inject(I18nService);
    const vets = component.vets();
    component.searchText.set('Whiskers');
    component.error.set('vets error');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('vets error');

    i18nService.toggleLanguage();
    TestBed.tick();
    fixture.detectChanges();

    expect(component.error()).toBeNull();
    expect(component.vets()).toBe(vets);
    expect(component.searchText()).toBe('Whiskers');
    expect(vetApiService.getVets).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).not.toContain('vets error');
  });

  it('renders vet rows through a Material table with existing actions', () => {
    createComponent();

    const compiled = fixture.nativeElement as HTMLElement;
    const headerText = [...compiled.querySelectorAll('th')]
      .map((header) => header.textContent?.trim())
      .join(' ');

    expect(compiled.querySelector('table[mat-table]')).not.toBeNull();
    expect(headerText).toContain(component.text().vets.overview.table.name);
    expect(headerText).toContain(component.text().vets.overview.table.actions);
    expect(compiled.textContent).toContain('Dr. Whiskers');
    expect(compiled.textContent).toContain('555-4444');
    expect(compiled.querySelector('a[mat-flat-button]')?.textContent).toContain(
      component.text().vets.overview.create,
    );
    expect(compiled.querySelector('a[mat-stroked-button]')?.textContent).toContain(
      component.text().vets.overview.edit,
    );
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
