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
    resolve: vi.fn(),
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
    resolve: vi.fn(),
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
    component.catSelector()?.select(cat);
    fixture.detectChanges();

    expect(emittedFilters).toContainEqual(
      expect.objectContaining({ catId: 'cat-current', ownerId: null }),
    );
  });

  it('applies mutual exclusion only to positive selections and preserves the opposite filter otherwise', () => {
    component.onOwnerStateChange({ value: owner, selectedId: owner.id, rawContentPresent: true });
    const catInput = fixture.nativeElement.querySelectorAll('input')[0] as HTMLInputElement;
    type(catInput, 'mil');
    vi.advanceTimersByTime(300);
    catRequests[0].result.error(new Error('lookup failed'));
    fixture.detectChanges();
    expect(emittedFilters.at(-1)).toMatchObject({ catId: null, ownerId: owner.id });

    component.catSelector()?.retry();
    catRequests[1].result.next({ items: [cat], page: 0, pageSize: 5, totalElements: 10 });
    expect(emittedFilters.at(-1)).toMatchObject({ catId: null, ownerId: owner.id });

    component.onCatStateChange({ value: cat, selectedId: cat.id, rawContentPresent: true });
    expect(component.selectedOwnerId()).toBeNull();
    expect(component.ownerSelector()?.query()).toBe('');
    expect(emittedFilters.at(-1)).toMatchObject({ catId: cat.id, ownerId: null });

    component.onOwnerStateChange({ value: owner, selectedId: owner.id, rawContentPresent: true });
    expect(component.selectedCatId()).toBeNull();
    expect(component.catSelector()?.query()).toBe('');
    expect(emittedFilters.at(-1)).toMatchObject({ catId: null, ownerId: owner.id });
  });

  it('keeps per-field clear behavior and omits a redundant global clear action', () => {
    expect(fixture.nativeElement.querySelector('.filter-actions')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain('Limpiar');

    component.onCatStateChange({ value: cat, selectedId: cat.id, rawContentPresent: true });
    component.catSelector()?.clear();
    expect(emittedFilters.at(-1)).toMatchObject({ catId: null, ownerId: null });

    component.onOwnerStateChange({ value: owner, selectedId: owner.id, rawContentPresent: true });
    component.ownerSelector()?.clear();
    expect(component.selectedOwnerId()).toBeNull();
    expect(component.ownerSelector()?.query()).toBe('');
    expect(emittedFilters.at(-1)).toMatchObject({ catId: null, ownerId: null });
  });
  it('renders one default relationship selector, emits all modes and shows reversed-range feedback', async () => {
    const select = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
    expect(fixture.nativeElement.querySelectorAll('select')).toHaveLength(1);
    expect(select.value).toBe('OVERLAPS');
    expect(Array.from(select.options).map((o) => o.value)).toEqual([
      'OVERLAPS',
      'STAY_WITHIN_RANGE',
      'RANGE_WITHIN_STAY',
    ]);
    for (const mode of ['STAY_WITHIN_RANGE', 'RANGE_WITHIN_STAY', 'OVERLAPS']) {
      select.value = mode;
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(emittedFilters.at(-1)).toMatchObject({ dateMatchMode: mode });
    }
    fixture.componentRef.setInput('dateFilters', {
      dateFrom: '2030-02-01',
      dateTo: '2030-01-01',
      dateMatchMode: 'OVERLAPS',
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain(
      component.text().stays.filters.invalidDateRange,
    );
    fixture.componentRef.setInput('dateFilters', {
      dateFrom: '2030-01-01',
      dateTo: '2030-02-01',
      dateMatchMode: 'OVERLAPS',
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.date-range-error')).toBeNull();
  });
  it.each(['cat', 'owner'] as const)(
    'preserves a deep-linked %s through pending/failed label resolution and temporal edits',
    (kind) => {
      fixture.destroy();
      const pending = new Subject<any>();
      const retry = new Subject<any>();
      const adapter = kind === 'cat' ? catAdapter : ownerAdapter;
      const selected = kind === 'cat' ? cat : owner;
      adapter.resolve.mockReturnValueOnce(pending).mockReturnValueOnce(retry);
      fixture = TestBed.createComponent(StaySearchFiltersComponent);
      component = fixture.componentInstance;
      const expected = {
        catId: kind === 'cat' ? cat.id : null,
        ownerId: kind === 'owner' ? owner.id : null,
      };
      fixture.componentRef.setInput(
        kind === 'cat' ? 'initialCatId' : 'initialOwnerId',
        selected.id,
      );
      fixture.componentRef.setInput('dateFilters', { ...expected, dateMatchMode: 'OVERLAPS' });
      component.filtersChange.subscribe((filters) => emittedFilters.push(filters));
      fixture.detectChanges();
      expect(pending.observed).toBe(true);
      const from = fixture.nativeElement.querySelector('input[type="date"]') as HTMLInputElement;
      type(from, '2030-01-01');
      expect(emittedFilters.at(-1)).toMatchObject({ ...expected, dateFrom: '2030-01-01' });
      pending.error(new Error('label unavailable'));
      fixture.detectChanges();
      const mode = fixture.nativeElement.querySelector('select') as HTMLSelectElement;
      mode.value = 'RANGE_WITHIN_STAY';
      mode.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      expect(emittedFilters.at(-1)).toMatchObject({
        ...expected,
        dateMatchMode: 'RANGE_WITHIN_STAY',
      });
      const selector = kind === 'cat' ? component.catSelector()! : component.ownerSelector()!;
      selector.retry();
      selector.clear();
      retry.next(selected);
      expect(emittedFilters.at(-1)).toMatchObject({ catId: null, ownerId: null });
      expect(retry.observed).toBe(false);
      if (kind === 'cat') component.ownerSelector()!.select(owner);
      else component.catSelector()!.select(cat);
      expect(emittedFilters.at(-1)).toMatchObject({
        catId: kind === 'owner' ? cat.id : null,
        ownerId: kind === 'cat' ? owner.id : null,
      });
    },
  );
});
