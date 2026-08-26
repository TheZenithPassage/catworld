import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Observable, Subject } from 'rxjs';
import { vi } from 'vitest';

import { CatLookup } from '../../../cats/models/cat.model';
import { OwnerLookup } from '../../../owners/models/owner.model';
import {
  CatLookupAdapter,
  OwnerLookupAdapter,
} from '../../../../shared/entity-lookup/domain-lookup.adapters';
import { EntityLookupPage } from '../../../../shared/entity-lookup/entity-lookup.models';
import { StaySearchFiltersComponent } from './stay-search-filters';

describe('StaySearchFiltersComponent', () => {
  const cat: CatLookup = {
    id: 'cat-current',
    name: 'Milo',
    ownerId: 'owner-current',
    ownerName: 'Current owner',
  };
  const owner: OwnerLookup = {
    id: 'owner-current',
    fullName: 'Ada Lovelace',
    currentCats: [{ id: 'cat-current', name: 'Milo' }],
  };
  const catRequests: Array<{
    query: string;
    page: number;
    result: Subject<EntityLookupPage<CatLookup>>;
  }> = [];
  const ownerRequests: Array<{
    query: string;
    page: number;
    result: Subject<EntityLookupPage<OwnerLookup>>;
  }> = [];

  const catAdapter = {
    search: (query: string, page: number): Observable<EntityLookupPage<CatLookup>> => {
      const result = new Subject<EntityLookupPage<CatLookup>>();
      catRequests.push({ query, page, result });
      return result;
    },
    id: (value: CatLookup) => value.id,
    present: (value: CatLookup) => ({
      primary: value.name,
      secondary: value.ownerName,
      selected: `${value.name} — ${value.ownerName}`,
    }),
  };
  const ownerAdapter = {
    search: (query: string, page: number): Observable<EntityLookupPage<OwnerLookup>> => {
      const result = new Subject<EntityLookupPage<OwnerLookup>>();
      ownerRequests.push({ query, page, result });
      return result;
    },
    id: (value: OwnerLookup) => value.id,
    present: (value: OwnerLookup) => ({ primary: value.fullName, selected: value.fullName }),
  };

  let component: StaySearchFiltersComponent;
  let fixture: ComponentFixture<StaySearchFiltersComponent>;
  let emittedFilters: unknown[];

  beforeEach(async () => {
    vi.useFakeTimers();
    catRequests.length = 0;
    ownerRequests.length = 0;
    emittedFilters = [];

    await TestBed.configureTestingModule({
      imports: [StaySearchFiltersComponent],
      providers: [
        provideNoopAnimations(),
        { provide: CatLookupAdapter, useValue: catAdapter },
        { provide: OwnerLookupAdapter, useValue: ownerAdapter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StaySearchFiltersComponent);
    component = fixture.componentInstance;
    component.filtersChange.subscribe((filters) => emittedFilters.push(filters));
    fixture.detectChanges();
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  function type(input: HTMLInputElement, value: string): void {
    input.value = value;
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('discovers cats remotely without a stays input and commits only an activated result', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;

    expect(fixture.nativeElement.querySelectorAll('app-remote-entity-selector')).toHaveLength(2);
    expect('stays' in component).toBe(false);

    type(inputs[0], 'mil');
    vi.advanceTimersByTime(300);
    expect(catRequests[0]).toMatchObject({ query: 'mil', page: 0 });
    expect(emittedFilters).toEqual([]);

    catRequests[0].result.next({ items: [cat], page: 0, pageSize: 5, totalElements: 1 });
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.result') as HTMLButtonElement).click();
    fixture.detectChanges();

    expect(emittedFilters).toContainEqual({ catId: 'cat-current', ownerId: null });
  });

  it('applies mutual exclusion only to positive selections and preserves the opposite filter otherwise', () => {
    component.onOwnerStateChange({ value: owner, selectedId: owner.id, rawContentPresent: true });
    const catInput = fixture.nativeElement.querySelectorAll('input')[0] as HTMLInputElement;
    type(catInput, 'mil');
    vi.advanceTimersByTime(300);
    catRequests[0].result.error(new Error('lookup failed'));
    fixture.detectChanges();
    expect(emittedFilters.at(-1)).toEqual({ catId: null, ownerId: owner.id });

    component.catSelector()?.retry();
    catRequests[1].result.next({ items: [cat], page: 0, pageSize: 5, totalElements: 10 });
    component.catSelector()?.pageChanged({ pageIndex: 1, pageSize: 5, length: 10 });
    expect(catRequests[2]).toMatchObject({ query: 'mil', page: 1 });
    expect(emittedFilters.at(-1)).toEqual({ catId: null, ownerId: owner.id });

    component.onCatStateChange({ value: cat, selectedId: cat.id, rawContentPresent: true });
    expect(component.selectedOwnerId()).toBeNull();
    expect(component.ownerSelector()?.query()).toBe('');
    expect(emittedFilters.at(-1)).toEqual({ catId: cat.id, ownerId: null });

    component.onOwnerStateChange({ value: owner, selectedId: owner.id, rawContentPresent: true });
    expect(component.selectedCatId()).toBeNull();
    expect(component.catSelector()?.query()).toBe('');
    expect(emittedFilters.at(-1)).toEqual({ catId: null, ownerId: owner.id });
  });

  it('clears each committed field independently and globally resets all selector state', () => {
    component.onCatStateChange({ value: cat, selectedId: cat.id, rawContentPresent: true });
    component.catSelector()?.clear();
    expect(emittedFilters.at(-1)).toEqual({ catId: null, ownerId: null });

    component.onOwnerStateChange({ value: owner, selectedId: owner.id, rawContentPresent: true });
    type(fixture.nativeElement.querySelectorAll('input')[0], 'unresolved');
    expect(component.hasSearchFilters()).toBe(true);

    component.clearFilters();
    expect(component.selectedCatId()).toBeNull();
    expect(component.selectedOwnerId()).toBeNull();
    expect(component.catSelector()?.query()).toBe('');
    expect(component.ownerSelector()?.query()).toBe('');
    expect(component.catSelector()?.items()).toEqual([]);
    expect(component.ownerSelector()?.error()).toBeNull();
    expect(component.hasSearchFilters()).toBe(false);
    expect(emittedFilters.at(-1)).toEqual({ catId: null, ownerId: null });
  });
});
