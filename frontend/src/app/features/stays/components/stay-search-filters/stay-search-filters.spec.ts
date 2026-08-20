import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { CatLookupOption } from '../../../cats/models/cat.model';
import { CatApiService } from '../../../cats/services/cat-api.service';
import { OwnerLookupOption } from '../../../owners/models/owner.model';
import { OwnerApiService } from '../../../owners/services/owner-api.service';
import { RemoteSearchSelectorComponent } from '../../../../shared/remote-search-selector/remote-search-selector';
import { StaySearchFiltersComponent } from './stay-search-filters';

describe('StaySearchFiltersComponent', () => {
  const milo: CatLookupOption = { id: 'cat-1', name: 'Milo', ownerName: 'Ada Lovelace' };
  const grace: OwnerLookupOption = {
    id: 'owner-2',
    fullName: 'Grace Hopper',
    cats: [{ id: 'cat-luna', name: 'Luna' }],
  };

  let component: StaySearchFiltersComponent;
  let fixture: ComponentFixture<StaySearchFiltersComponent>;
  let emittedFilters: unknown[];
  let catApiService: { searchLookupOptions: ReturnType<typeof vi.fn> };
  let ownerApiService: { searchLookupOptions: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    emittedFilters = [];
    catApiService = {
      searchLookupOptions: vi.fn().mockReturnValue(of({ items: [], page: 0, hasNext: false })),
    };
    ownerApiService = {
      searchLookupOptions: vi.fn().mockReturnValue(of({ items: [], page: 0, hasNext: false })),
    };

    await TestBed.configureTestingModule({
      imports: [StaySearchFiltersComponent],
      providers: [
        provideNoopAnimations(),
        { provide: CatApiService, useValue: catApiService },
        { provide: OwnerApiService, useValue: ownerApiService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StaySearchFiltersComponent);
    component = fixture.componentInstance;
    component.filtersChange.subscribe((filters) => emittedFilters.push(filters));
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function setInputValue(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('renders two shared remote search selectors', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('app-remote-search-selector')).toHaveLength(2);
    expect(compiled.querySelectorAll('mat-form-field')).toHaveLength(2);
    expect(compiled.querySelectorAll('mat-autocomplete')).toHaveLength(2);
    expect(compiled.textContent).toContain(component.text().stays.filters.cat);
    expect(compiled.textContent).toContain(component.text().stays.filters.owner);
  });

  it('delegates unmatched cat and owner searches to their lookup APIs', async () => {
    vi.useFakeTimers();
    const inputs = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;

    setInputValue(inputs[0], 'no-cat');
    setInputValue(inputs[1], 'no-owner');
    await vi.advanceTimersByTimeAsync(250);
    fixture.detectChanges();

    expect(catApiService.searchLookupOptions).toHaveBeenCalledWith('no-cat', 0);
    expect(ownerApiService.searchLookupOptions).toHaveBeenCalledWith('no-owner', 0);
    expect(component.selectedCatId()).toBeNull();
    expect(component.selectedOwnerId()).toBeNull();
    vi.useRealTimers();
  });

  it('selects and clears all search filters from one action', () => {
    component.selectCat(milo);
    fixture.detectChanges();

    expect(emittedFilters).toContainEqual({ catId: 'cat-1', ownerId: null });
    expect(
      fixture.nativeElement.querySelector('button[mat-stroked-button]')?.textContent,
    ).toContain(component.text().stays.filters.clear);

    const clearButton = fixture.nativeElement.querySelector(
      'button[mat-stroked-button]',
    ) as HTMLButtonElement;
    clearButton.click();
    fixture.detectChanges();

    expect(component.selectedCatId()).toBeNull();
    expect(component.selectedOwnerId()).toBeNull();
    expect(emittedFilters).toContainEqual({ catId: null, ownerId: null });
  });

  it('selects owner filters and clears any selected cat filter', () => {
    const emitSpy = vi.fn();
    component.filtersChange.subscribe(emitSpy);

    component.selectCat(milo);
    fixture.detectChanges();

    component.selectOwner(grace);
    fixture.detectChanges();

    expect(component.selectedCatId()).toBeNull();
    expect(component.selectedOwner()?.fullName).toBe('Grace Hopper');
    expect(emitSpy).toHaveBeenLastCalledWith({ catId: null, ownerId: 'owner-2' });
  });
});
