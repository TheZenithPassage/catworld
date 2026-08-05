import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { vi } from 'vitest';

import { Stay } from '../../models/stay.model';
import { StaySearchFiltersComponent } from './stay-search-filters';

describe('StaySearchFiltersComponent', () => {
  const stays: Stay[] = [
    {
      stayId: 'stay-1',
      startAt: '2099-01-02T10:00:00',
      endAt: '2099-01-09T10:00:00',
      numberOfNights: 7,
      cancelledAt: null,
      createdAt: '2026-07-03T10:00:00',
      updatedAt: '2026-07-03T10:00:00',
      notes: null,
      catIds: ['cat-1'],
      ownerId: 'owner-1',
      ownerName: 'Ada Lovelace',
      cats: [{ catId: 'cat-1', name: 'Milo' }],
      retainedNightlyRate: '50',
      suggestedAmount: '100',
      agreedAmount: '100',
      totalPaid: '0',
      remainingAmount: '100',
      paymentCondition: 'NO_PAYMENT',
      outstandingCollectionEligible: true,
    },
    {
      stayId: 'stay-2',
      startAt: '2099-02-02T10:00:00',
      endAt: '2099-02-09T10:00:00',
      numberOfNights: 7,
      cancelledAt: null,
      createdAt: '2026-07-03T10:00:00',
      updatedAt: '2026-07-03T10:00:00',
      notes: null,
      catIds: ['cat-2'],
      ownerId: 'owner-2',
      ownerName: 'Grace Hopper',
      cats: [{ catId: 'cat-2', name: 'Luna' }],
      retainedNightlyRate: '50',
      suggestedAmount: '100',
      agreedAmount: '100',
      totalPaid: '0',
      remainingAmount: '100',
      paymentCondition: 'NO_PAYMENT',
      outstandingCollectionEligible: true,
    },
  ];

  let component: StaySearchFiltersComponent;
  let fixture: ComponentFixture<StaySearchFiltersComponent>;
  let emittedFilters: unknown[];

  beforeEach(async () => {
    emittedFilters = [];

    await TestBed.configureTestingModule({
      imports: [StaySearchFiltersComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(StaySearchFiltersComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('stays', stays);
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

  function selectedEvent(value: unknown): MatAutocompleteSelectedEvent {
    return { option: { value } } as MatAutocompleteSelectedEvent;
  }

  it('renders Material search fields and autocomplete controls', () => {
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('mat-form-field')).toHaveLength(2);
    expect(compiled.querySelectorAll('mat-autocomplete')).toHaveLength(2);
    expect(compiled.textContent).toContain(component.text().stays.filters.cat);
    expect(compiled.textContent).toContain(component.text().stays.filters.owner);
  });

  it('shows no-match messages for unmatched cat and owner searches', () => {
    const inputs = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;

    setInputValue(inputs[0], 'no-cat');
    expect(fixture.nativeElement.textContent).toContain(component.text().stays.filters.noCatsMatch);

    setInputValue(inputs[1], 'no-owner');
    expect(fixture.nativeElement.textContent).toContain(
      component.text().stays.filters.noOwnersMatch,
    );
  });

  it('selects and clears cat filters while preserving emitted filter values', () => {
    component.onCatSearchChange('mil');
    fixture.detectChanges();

    expect(component.matchingCatOptions()[0].label).toBe('Milo (Ada Lovelace)');

    component.selectCatFromAutocomplete(selectedEvent(component.matchingCatOptions()[0]));
    fixture.detectChanges();

    expect(component.catSearch()).toBe('Milo (Ada Lovelace)');
    expect(emittedFilters).toContainEqual({ catId: 'cat-1', ownerId: null });
    expect(
      fixture.nativeElement.querySelector('button[mat-stroked-button]')?.textContent,
    ).toContain(component.text().stays.filters.clear);

    const clearButton = fixture.nativeElement.querySelector(
      'button[mat-stroked-button]',
    ) as HTMLButtonElement;
    clearButton.click();
    fixture.detectChanges();

    expect(component.catSearch()).toBe('');
    expect(emittedFilters).toContainEqual({ catId: null, ownerId: null });
  });

  it('selects owner filters and clears any selected cat filter', () => {
    const emitSpy = vi.fn();
    component.filtersChange.subscribe(emitSpy);

    component.selectCat(component.catOptions()[0]);
    component.onOwnerSearchChange('grace');
    fixture.detectChanges();

    component.selectOwnerFromAutocomplete(selectedEvent(component.matchingOwnerOptions()[0]));
    fixture.detectChanges();

    expect(component.selectedCatId()).toBeNull();
    expect(component.catSearch()).toBe('');
    expect(component.ownerSearch()).toBe('Grace Hopper (Luna)');
    expect(emitSpy).toHaveBeenLastCalledWith({ catId: null, ownerId: 'owner-2' });
  });
});
