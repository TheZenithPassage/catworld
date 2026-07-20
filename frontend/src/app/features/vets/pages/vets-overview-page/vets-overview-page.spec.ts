import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { Vet } from '../../models/vet.model';
import { VetApiService } from '../../services/vet-api.service';
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

  it('clears its rendered error when the application language changes', () => {
    createComponent();
    component.error.set('Error in the previous language');
    fixture.detectChanges();

    const i18nService = TestBed.inject(I18nService);
    const initialLanguage = i18nService.language();
    const loadedVets = component.vets();

    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Error in the previous language',
    );

    i18nService.toggleLanguage();
    fixture.detectChanges();

    expect(i18nService.language()).not.toBe(initialLanguage);
    expect(component.error()).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(component.vets()).toBe(loadedVets);
    expect(fixture.nativeElement.querySelector('table[mat-table]')).not.toBeNull();
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
