import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatAutocompleteHarness } from '@angular/material/autocomplete/testing';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Subject } from 'rxjs';

import {
  RemoteSearchLookup,
  RemoteSearchPage,
  RemoteSearchSelectorComponent,
} from './remote-search-selector';

interface TestOption {
  id: string;
  label: string;
}

describe('RemoteSearchSelectorComponent', () => {
  const firstOption: TestOption = { id: 'first', label: 'First result' };
  const secondOption: TestOption = { id: 'second', label: 'Second result' };
  const longOption: TestOption = {
    id: 'long',
    label: 'A deliberately long option label that must remain readable instead of being truncated',
  };

  let fixture: ComponentFixture<RemoteSearchSelectorComponent<TestOption>>;
  let component: RemoteSearchSelectorComponent<TestOption>;
  let loader: HarnessLoader;
  let lookup: ReturnType<typeof vi.fn<RemoteSearchLookup<TestOption>>>;
  let responses: Map<string, Subject<RemoteSearchPage<TestOption>>>;

  beforeEach(async () => {
    vi.useFakeTimers();
    responses = new Map();
    lookup = vi.fn((query: string, page: number) => {
      const response = new Subject<RemoteSearchPage<TestOption>>();
      responses.set(`${query}:${page}`, response);
      return response;
    });

    await TestBed.configureTestingModule({
      imports: [RemoteSearchSelectorComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(RemoteSearchSelectorComponent<TestOption>);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('label', 'Find an option');
    fixture.componentRef.setInput('lookup', lookup);
    fixture.componentRef.setInput('optionId', (option: TestOption) => option.id);
    fixture.componentRef.setInput('optionLabel', (option: TestOption) => option.label);
    fixture.detectChanges();
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  afterEach(() => {
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  function input(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input') as HTMLInputElement;
  }

  function enterText(value: string): void {
    const searchInput = input();
    searchInput.focus();
    searchInput.value = value;
    searchInput.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  async function finishDebounce(): Promise<void> {
    await vi.advanceTimersByTimeAsync(250);
    fixture.detectChanges();
  }

  function respond(
    query: string,
    page: number,
    items: readonly TestOption[],
    hasNext = false,
  ): void {
    responses.get(`${query}:${page}`)?.next({ items, hasNext });
    fixture.detectChanges();
  }

  function selectedEvent(option: TestOption): MatAutocompleteSelectedEvent {
    return { option: { value: option } } as MatAutocompleteSelectedEvent;
  }

  function keydown(key: string, keyCode: number): void {
    const event = new KeyboardEvent('keydown', { bubbles: true, key });
    Object.defineProperty(event, 'keyCode', { value: keyCode });
    input().dispatchEvent(event);
    fixture.detectChanges();
  }

  it('waits for three submitted characters and the 250 ms debounce before showing remote state', async () => {
    enterText('ab');
    await vi.advanceTimersByTimeAsync(500);
    fixture.detectChanges();

    expect(lookup).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('.search-state')).toBeNull();
    expect(fixture.nativeElement.querySelector('.clear-selection')).toBeNull();
    expect(document.querySelector('.remote-search-option')).toBeNull();

    enterText('  abc  ');
    await vi.advanceTimersByTimeAsync(249);
    expect(lookup).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1);
    fixture.detectChanges();

    expect(lookup).toHaveBeenCalledOnce();
    expect(lookup).toHaveBeenCalledWith('abc', 0);
    expect(fixture.nativeElement.textContent).toContain(component.text().lookup.loading);

    respond('abc', 0, []);
    expect(fixture.nativeElement.textContent).toContain(component.text().lookup.empty);
  });

  it('ignores stale query and page responses and replaces results during pagination', async () => {
    enterText('first');
    await finishDebounce();
    const staleQueryResponse = responses.get('first:0');

    enterText('second');
    await finishDebounce();
    staleQueryResponse?.next({ items: [firstOption], hasNext: true });
    fixture.detectChanges();

    expect(component.results()).toEqual([]);
    expect(component.loading()).toBe(true);

    respond('second', 0, [secondOption], true);
    expect(component.results()).toEqual([secondOption]);
    expect(fixture.nativeElement.textContent).toContain(component.text().lookup.navigation.next);
    expect(fixture.nativeElement.textContent).not.toContain(
      component.text().lookup.navigation.previous,
    );

    const stalePageResponse = responses.get('second:0');
    component.nextPage();
    fixture.detectChanges();

    expect(lookup).toHaveBeenLastCalledWith('second', 1);
    expect(component.results()).toEqual([]);
    expect(component.page()).toBe(1);

    stalePageResponse?.next({ items: [firstOption], hasNext: false });
    respond('second', 1, [longOption], false);

    expect(component.results()).toEqual([longOption]);
    expect(component.results()).not.toContain(secondOption);
    expect(fixture.nativeElement.textContent).toContain(
      component.text().lookup.navigation.previous,
    );
    expect(fixture.nativeElement.textContent).not.toContain(
      component.text().lookup.navigation.next,
    );
  });

  it('selects only through explicit Material option activation and invalidates on later text edits', async () => {
    const emitted: Array<TestOption | null> = [];
    component.selectionChange.subscribe((selection) => emitted.push(selection));

    enterText('pointer');
    await finishDebounce();
    respond('pointer', 0, [firstOption]);
    await Promise.resolve();
    fixture.detectChanges();

    const autocomplete = await loader.getHarness(MatAutocompleteHarness);
    await autocomplete.selectOption({ text: firstOption.label });

    expect(component.selectedOption()).toBe(firstOption);
    expect(component.selectedId()).toBe(firstOption.id);
    expect(component.selectedLabel()).toBe(firstOption.label);
    expect(emitted).toEqual([firstOption]);

    fixture.componentRef.setInput('initialOption', firstOption);
    fixture.detectChanges();
    enterText(`${firstOption.label}!`);
    fixture.componentRef.setInput('initialOption', null);
    fixture.detectChanges();
    expect(component.selectedOption()).toBeNull();
    expect(component.searchText()).toBe(`${firstOption.label}!`);
    expect(component.isValid()).toBe(false);
    expect(emitted).toEqual([firstOption, null]);

    enterText('keyboard');
    await finishDebounce();
    respond('keyboard', 0, [secondOption]);
    await Promise.resolve();
    fixture.detectChanges();

    keydown('ArrowDown', 40);
    keydown('Enter', 13);

    expect(component.selectedOption()).toBe(secondOption);
    expect(component.selectedId()).toBe(secondOption.id);
    expect(emitted).toEqual([firstOption, null, secondOption]);
  });

  it('keeps required and optional unresolved values invalid while allowing optional empty clearing', async () => {
    fixture.componentRef.setInput('required', true);
    fixture.detectChanges();

    expect(component.isValid()).toBe(false);
    component.markAsTouched();
    fixture.detectChanges();
    expect(component.showSelectionError()).toBe(true);
    expect(fixture.nativeElement.textContent).toContain(component.text().lookup.errors.required);

    enterText('unresolved');
    expect(component.isValid()).toBe(false);
    expect(component.selectionError()).toBe('unresolved');

    component.selectFromAutocomplete(selectedEvent(firstOption));
    expect(component.isValid()).toBe(true);

    fixture.componentRef.setInput('required', false);
    fixture.detectChanges();
    component.clear();
    await Promise.resolve();
    fixture.detectChanges();

    expect(component.searchText()).toBe('');
    expect(component.selectedId()).toBeNull();
    expect(component.page()).toBe(0);
    expect(component.results()).toEqual([]);
    expect(component.isValid()).toBe(true);
    expect(document.activeElement).toBe(input());

    enterText('still unresolved');
    expect(component.isValid()).toBe(false);
    expect(component.selectionError()).toBe('unresolved');
  });

  it('accepts a trusted pre-resolved initial option without searching', () => {
    fixture.componentRef.setInput('initialOption', longOption);
    fixture.detectChanges();

    expect(component.selectedOption()).toBe(longOption);
    expect(component.selectedId()).toBe(longOption.id);
    expect(component.selectedLabel()).toBe(longOption.label);
    expect(component.searchText()).toBe(longOption.label);
    expect(component.isValid()).toBe(true);
    expect(lookup).not.toHaveBeenCalled();
  });
});
