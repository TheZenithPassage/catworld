import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, RouterLink } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Cat } from '../../models/cat.model';
import { CatApiService } from '../../services/cat-api.service';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { CatsOverviewPage } from './cats-overview-page';

describe('CatsOverviewPage', () => {
  const cats: Cat[] = [
    {
      id: 'cat-1',
      name: 'Milo',
      birthDate: '2020-01-02',
      sex: 'MALE',
      breed: 'Tabby',
      coat: 'Short',
      color: 'Orange',
      foodBrand: 'Chicken',
      litterBrand: 'Fine Sand',
      personality: 'Friendly',
      lastInternalDewormerName: null,
      lastInternalDewormingDate: '2025-01-01',
      lastExternalDewormerName: null,
      lastExternalDewormingDate: null,
      lastTripleFelineDate: '2025-02-03',
      lastRabiesDate: null,
      ownerId: 'owner-1',
      ownerName: 'Ada Lovelace',
      vetId: 'vet-1',
      vetName: 'Dr. Vet',
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
      lastInternalDewormerName: null,
      lastInternalDewormingDate: null,
      lastExternalDewormerName: null,
      lastExternalDewormingDate: null,
      lastTripleFelineDate: null,
      lastRabiesDate: null,
      ownerId: 'owner-2',
      ownerName: 'Grace Hopper',
      vetId: null,
      vetName: null,
    },
  ];

  const catApiService = {
    getCats: vi.fn(),
  };

  let component: CatsOverviewPage;
  let fixture: ComponentFixture<CatsOverviewPage>;

  beforeEach(async () => {
    vi.resetAllMocks();
    catApiService.getCats.mockReturnValue(of(cats));

    await TestBed.configureTestingModule({
      imports: [CatsOverviewPage],
      providers: [
        provideNoopAnimations(),
        provideRouter([
          { path: 'owners', component: CatsOverviewPage },
          { path: 'cats/:id/edit', component: CatsOverviewPage },
        ]),
        { provide: CatApiService, useValue: catApiService },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(CatsOverviewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('clears a visible overview error on language change without reloading cats', () => {
    createComponent();
    const i18nService = TestBed.inject(I18nService);
    const cats = component.cats();
    component.searchText.set('Milo');
    component.error.set('cats error');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('cats error');

    i18nService.toggleLanguage();
    TestBed.tick();
    fixture.detectChanges();

    expect(component.error()).toBeNull();
    expect(component.cats()).toBe(cats);
    expect(component.searchText()).toBe('Milo');
    expect(catApiService.getCats).toHaveBeenCalledOnce();
    expect(fixture.nativeElement.textContent).not.toContain('cats error');
  });

  it('renders cat rows through a Material table with existing columns and actions', () => {
    createComponent();

    const compiled = fixture.nativeElement as HTMLElement;
    const headerText = [...compiled.querySelectorAll('th')]
      .map((header) => header.textContent?.trim())
      .join(' ');

    expect(compiled.querySelector('table[mat-table]')).not.toBeNull();
    expect(headerText).toContain(component.text().cats.overview.table.name);
    expect(headerText).toContain(component.text().cats.overview.table.health);
    expect(compiled.textContent).toContain('Milo');
    expect(compiled.textContent).toContain('Ada Lovelace');
    expect(compiled.textContent).toContain('Chicken');
    expect(compiled.querySelector('a[mat-flat-button]')?.textContent).toContain(
      component.text().cats.overview.create,
    );
    expect(compiled.querySelector('a[mat-stroked-button]')?.textContent).toContain(
      component.text().cats.overview.edit,
    );
  });

  it('preserves owner query-param navigation from the owner cell', () => {
    createComponent();

    const ownerLink = fixture.debugElement
      .query(By.css('.owner-search-link'))
      .injector.get(RouterLink);

    expect(ownerLink.queryParams).toEqual({
      search: 'Ada Lovelace',
      selectedOwnerId: 'owner-1',
    });
  });

  it('filters cats by cat or owner name and shows the filtered-empty state', () => {
    createComponent();

    component.setSearchText('Grace');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Luna');
    expect(fixture.nativeElement.textContent).not.toContain('Milo');

    component.setSearchText('No match');
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      component.text().cats.overview.emptyFiltered,
    );
    expect(fixture.nativeElement.querySelector('table[mat-table]')).toBeNull();
  });

  it('renders empty and error states outside the Material table', async () => {
    catApiService.getCats.mockReturnValueOnce(of([]));
    createComponent();
    expect(fixture.nativeElement.textContent).toContain(component.text().cats.overview.empty);
    expect(fixture.nativeElement.querySelector('table[mat-table]')).toBeNull();

    TestBed.resetTestingModule();
    catApiService.getCats.mockReturnValue(throwError(() => new Error('load failed')));

    await TestBed.configureTestingModule({
      imports: [CatsOverviewPage],
      providers: [
        provideNoopAnimations(),
        provideRouter([]),
        { provide: CatApiService, useValue: catApiService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CatsOverviewPage);
    component = fixture.componentInstance;
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain(
      component.text().cats.overview.errorLoading,
    );
    expect(fixture.nativeElement.textContent).toContain(component.text().cats.overview.retry);
  });
});
