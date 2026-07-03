import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Owner } from '../../models/owner.model';
import { OwnerApiService } from '../../services/owner-api.service';
import { OwnersOverviewPage } from './owners-overview-page';

describe('OwnersOverviewPage', () => {
  const owners: Owner[] = [
    {
      id: 'owner-1',
      fullName: 'Ada Lovelace',
      address: '1 Cat Lane',
      primaryPhone: '555-1111',
      secondaryPhone: '555-2222',
      secondaryPhoneName: 'Work',
      instagram: 'ada-cats',
      facebook: null,
    },
    {
      id: 'owner-2',
      fullName: 'Grace Hopper',
      address: null,
      primaryPhone: '555-3333',
      secondaryPhone: null,
      secondaryPhoneName: null,
      instagram: null,
      facebook: 'grace-cats',
    },
  ];

  const ownerApiService = {
    getOwners: vi.fn(),
  };

  let component: OwnersOverviewPage;
  let fixture: ComponentFixture<OwnersOverviewPage>;
  let router: Router;
  let queryParams: Record<string, string>;

  beforeEach(async () => {
    vi.resetAllMocks();
    queryParams = { selectedOwnerId: 'owner-1' };
    ownerApiService.getOwners.mockReturnValue(of(owners));

    await TestBed.configureTestingModule({
      imports: [OwnersOverviewPage],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: OwnerApiService, useValue: ownerApiService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              get queryParamMap() {
                return convertToParamMap(queryParams);
              },
            },
          },
        },
      ],
    }).compileComponents();

    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(OwnersOverviewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('renders owner rows through a Material table with existing actions and selected row', () => {
    createComponent();

    const compiled = fixture.nativeElement as HTMLElement;
    const headerText = [...compiled.querySelectorAll('th')]
      .map((header) => header.textContent?.trim())
      .join(' ');

    expect(compiled.querySelector('table[mat-table]')).not.toBeNull();
    expect(headerText).toContain(component.text().owners.overview.table.name);
    expect(headerText).toContain(component.text().owners.overview.table.actions);
    expect(compiled.textContent).toContain('Ada Lovelace');
    expect(compiled.textContent).toContain('555-2222 (Work)');
    expect(compiled.querySelector('#owner-owner-1.selected-row')).not.toBeNull();
    expect(compiled.querySelector('a[mat-flat-button]')?.textContent).toContain(
      component.text().owners.overview.create,
    );
    expect(compiled.querySelector('a[mat-stroked-button]')?.textContent).toContain(
      component.text().owners.overview.edit,
    );
  });

  it('filters owners and clears search while preserving query-param cleanup', () => {
    queryParams = { search: 'Grace', selectedOwnerId: 'owner-2' };
    createComponent();

    expect(fixture.nativeElement.textContent).toContain('Grace Hopper');
    expect(fixture.nativeElement.textContent).not.toContain('Ada Lovelace');

    const clearButton = fixture.nativeElement.querySelector(
      'button[mat-stroked-button]',
    ) as HTMLButtonElement;
    clearButton.click();
    fixture.detectChanges();

    expect(component.searchText()).toBe('');
    expect(component.selectedOwnerId()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith([], {
      relativeTo: TestBed.inject(ActivatedRoute),
      queryParams: {
        search: null,
        selectedOwnerId: null,
      },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  });

  it('renders empty, filtered-empty, and error states outside the Material table', () => {
    ownerApiService.getOwners.mockReturnValueOnce(of([]));
    createComponent();
    expect(fixture.nativeElement.textContent).toContain(component.text().owners.overview.empty);
    expect(fixture.nativeElement.querySelector('table[mat-table]')).toBeNull();

    TestBed.resetTestingModule();
  });

  it('renders a localized error state with retry action when owner loading fails', async () => {
    TestBed.resetTestingModule();
    ownerApiService.getOwners.mockReturnValue(throwError(() => new Error('load failed')));

    await TestBed.configureTestingModule({
      imports: [OwnersOverviewPage],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: OwnerApiService, useValue: ownerApiService },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({}),
            },
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(OwnersOverviewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      component.text().owners.overview.errorLoading,
    );
    expect(fixture.nativeElement.textContent).toContain(component.text().owners.overview.retry);
  });
});
