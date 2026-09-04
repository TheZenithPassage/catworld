import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, provideRouter, Router } from '@angular/router';
import { EMPTY, Observable, of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Owner } from '../../models/owner.model';
import { OwnerApiService } from '../../services/owner-api.service';
import { OwnersOverviewPage } from './owners-overview-page';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import type { EntityDetailUpdate } from '../../../../shared/entity-detail/entity-reference';
import { CatApiService } from '../../../cats/services/cat-api.service';
import { Cat } from '../../../cats/models/cat.model';

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
      notes: null,
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
      notes: null,
    },
    {
      id: 'owner-3',
      fullName: 'Katherine Johnson',
      address: '3 Orbit Way',
      primaryPhone: '555-4444',
      secondaryPhone: null,
      secondaryPhoneName: null,
      instagram: null,
      facebook: null,
      notes: 'Prefers email',
    },
  ];

  const cats: Cat[] = [
    {
      id: 'cat-1',
      name: 'Milo',
      birthDate: '2020-01-02',
      sex: 'MALE',
      breed: null,
      coat: null,
      color: null,
      foodBrand: null,
      litterBrand: null,
      personality: null,
      notes: null,
      lastInternalDewormerName: null,
      lastInternalDewormingDate: null,
      lastExternalDewormerName: null,
      lastExternalDewormingDate: null,
      lastTripleFelineDate: null,
      lastRabiesDate: null,
      ownerId: 'owner-1',
      ownerName: 'Ada Lovelace',
      vetId: null,
      vetName: null,
      hasPhoto: false,
    },
    {
      id: 'cat-2',
      name: 'Luna',
      birthDate: '2021-03-04',
      sex: 'FEMALE',
      breed: null,
      coat: null,
      color: null,
      foodBrand: null,
      litterBrand: null,
      personality: null,
      notes: null,
      lastInternalDewormerName: null,
      lastInternalDewormingDate: null,
      lastExternalDewormerName: null,
      lastExternalDewormingDate: null,
      lastTripleFelineDate: null,
      lastRabiesDate: null,
      ownerId: 'owner-1',
      ownerName: 'Ada Lovelace',
      vetId: null,
      vetName: null,
      hasPhoto: false,
    },
    {
      id: 'cat-3',
      name: 'Nova',
      birthDate: '2022-05-06',
      sex: 'FEMALE',
      breed: null,
      coat: null,
      color: null,
      foodBrand: null,
      litterBrand: null,
      personality: null,
      notes: null,
      lastInternalDewormerName: null,
      lastInternalDewormingDate: null,
      lastExternalDewormerName: null,
      lastExternalDewormingDate: null,
      lastTripleFelineDate: null,
      lastRabiesDate: null,
      ownerId: 'owner-3',
      ownerName: 'Katherine Johnson',
      vetId: null,
      vetName: null,
      hasPhoto: false,
    },
  ];

  const ownerApiService = {
    getOwners: vi.fn(),
  };
  const catApiService = {
    getCats: vi.fn(),
  };
  const details = { open: vi.fn((): Observable<EntityDetailUpdate> => EMPTY) };

  let component: OwnersOverviewPage;
  let fixture: ComponentFixture<OwnersOverviewPage>;
  let router: Router;
  let queryParams: Record<string, string>;

  beforeEach(async () => {
    vi.resetAllMocks();
    queryParams = { selectedOwnerId: 'owner-1' };
    ownerApiService.getOwners.mockReturnValue(of(owners));
    catApiService.getCats.mockReturnValue(of(cats));

    await TestBed.configureTestingModule({
      imports: [OwnersOverviewPage],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: OwnerApiService, useValue: ownerApiService },
        { provide: CatApiService, useValue: catApiService },
        { provide: EntityDetailDialogService, useValue: details },
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

  it('renders exact zero, one, and multiple-cat owner summaries with keyboard detail access', () => {
    createComponent();

    const compiled = fixture.nativeElement as HTMLElement;
    const headerText = [...compiled.querySelectorAll('th')]
      .map((header) => header.textContent?.trim())
      .join(' ');

    expect(compiled.querySelector('table[mat-table]')).not.toBeNull();
    expect(headerText).toContain(component.text().owners.overview.table.name);
    expect(headerText).toContain(component.text().owners.overview.table.cats);
    expect(headerText).not.toContain(component.text().owners.overview.table.actions);
    expect(compiled.textContent).toContain('Ada Lovelace');
    expect(compiled.textContent).toContain('Milo');
    expect(compiled.textContent).toContain('Luna');
    expect(compiled.textContent).toContain('Nova');
    expect(compiled.textContent).not.toContain('555-1111');
    expect(compiled.textContent).not.toContain('555-2222');
    expect(compiled.textContent).not.toContain('1 Cat Lane');
    expect(compiled.textContent).not.toContain('ada-cats');
    expect(compiled.textContent).not.toContain('Prefers email');
    const ownerRows = [...compiled.querySelectorAll('tr[mat-row]')];
    expect(ownerRows[0].querySelectorAll('.cat-name-list li')).toHaveLength(2);
    expect(ownerRows[1].textContent).toContain(component.text().owners.emptyValue);
    expect(ownerRows[2].querySelectorAll('.cat-name-list li')).toHaveLength(1);
    expect(compiled.querySelector('#owner-owner-1.selected-row')).not.toBeNull();
    expect(compiled.querySelector('a[mat-flat-button]')?.textContent).toContain(
      component.text().owners.overview.create,
    );
    expect(compiled.querySelector('tr[mat-row][tabindex="0"]')).not.toBeNull();
    expect(compiled.querySelector('a[mat-stroked-button]')).toBeNull();
    const row = compiled.querySelector('tr[mat-row]') as HTMLElement;
    expect(row.getAttribute('aria-label')).toBe(
      `${component.text().owners.detail.openDetails}: Ada Lovelace`,
    );
    row.click();
    row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    row.dispatchEvent(new KeyboardEvent('keydown', { key: ' ', bubbles: true }));
    expect(details.open).toHaveBeenCalledTimes(3);
    expect(details.open).toHaveBeenLastCalledWith({ entityType: 'owner', entityId: 'owner-1' });
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

  it('reloads owners only after the dialog reports a successful update', () => {
    const updates = new Subject<{ entityType: 'owner'; entityId: string }>();
    details.open.mockReturnValueOnce(updates.asObservable());
    createComponent();

    component.openOwner(owners[0]);
    expect(ownerApiService.getOwners).toHaveBeenCalledTimes(1);
    expect(catApiService.getCats).toHaveBeenCalledTimes(1);

    updates.next({ entityType: 'owner', entityId: 'owner-1' });
    expect(ownerApiService.getOwners).toHaveBeenCalledTimes(2);
    expect(catApiService.getCats).toHaveBeenCalledTimes(2);
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
        { provide: CatApiService, useValue: catApiService },
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
