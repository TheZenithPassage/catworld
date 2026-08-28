import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatAutocomplete } from '@angular/material/autocomplete';
import { MatAutocompleteHarness } from '@angular/material/autocomplete/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Subject } from 'rxjs';

import { I18nService } from '../../core/i18n/i18n.service';
import { EntityLookupAdapter, EntityLookupPage } from './entity-lookup.models';
import { RemoteEntitySelector } from './remote-entity-selector';

interface Item {
  id: string;
  label: string;
  detail?: string;
}

describe('RemoteEntitySelector', () => {
  const requests: Array<{ query: string; page: number; result: Subject<EntityLookupPage<Item>> }> =
    [];
  const resolutions: Array<{ id: string; result: Subject<Item> }> = [];
  const adapter: EntityLookupAdapter<Item> = {
    search: (query, page) => {
      const result = new Subject<EntityLookupPage<Item>>();
      requests.push({ query, page, result });
      return result;
    },
    resolve: (id) => {
      const result = new Subject<Item>();
      resolutions.push({ id, result });
      return result;
    },
    id: (value) => value.id,
    present: (value) => ({ primary: value.label, secondary: value.detail, selected: value.label }),
  };

  beforeEach(() => {
    requests.length = 0;
    resolutions.length = 0;
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [provideNoopAnimations()] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  function setup(required = false) {
    const fixture = TestBed.createComponent(RemoteEntitySelector<Item>);
    fixture.componentRef.setInput('adapter', adapter);
    fixture.componentRef.setInput('label', 'Owner');
    fixture.componentRef.setInput('required', required);
    fixture.detectChanges();
    return {
      fixture,
      component: fixture.componentInstance,
      loader: TestbedHarnessEnvironment.loader(fixture),
    };
  }

  function inputFor(fixture: ComponentFixture<RemoteEntitySelector<Item>>): HTMLInputElement {
    return fixture.nativeElement.querySelector('input') as HTMLInputElement;
  }

  function type(fixture: ComponentFixture<RemoteEntitySelector<Item>>, value: string): void {
    const input = inputFor(fixture);
    input.focus();
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  function respond(
    requestIndex: number,
    items: Item[],
    totalElements = items.length,
    page = requests[requestIndex].page,
  ): void {
    requests[requestIndex].result.next({ items, page, pageSize: 5, totalElements });
  }

  function settleOverlay(fixture: ComponentFixture<RemoteEntitySelector<Item>>): void {
    fixture.detectChanges();
    vi.advanceTimersByTime(0);
    fixture.detectChanges();
  }

  function pressKey(
    fixture: ComponentFixture<RemoteEntitySelector<Item>>,
    key: 'ArrowDown' | 'Enter' | 'Escape',
  ): void {
    const keyCodes = { ArrowDown: 40, Enter: 13, Escape: 27 } as const;
    const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
    Object.defineProperty(event, 'keyCode', { get: () => keyCodes[key] });
    inputFor(fixture).dispatchEvent(event);
    fixture.detectChanges();
  }

  it('uses a Material overlay, skips empty input, debounces page zero and resets stale queries', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { fixture, component, loader } = setup();
    const harness = await loader.getHarness(MatAutocompleteHarness);

    expect(inputFor(fixture).getAttribute('role')).toBe('combobox');
    expect(fixture.nativeElement.querySelector('.results')).toBeNull();
    expect(fixture.nativeElement.querySelector('mat-paginator')).toBeNull();

    type(fixture, '   ');
    vi.advanceTimersByTime(300);
    expect(requests).toHaveLength(0);
    expect(component.searched()).toBe(false);

    type(fixture, ' a ');
    vi.advanceTimersByTime(299);
    expect(requests).toHaveLength(0);
    vi.advanceTimersByTime(1);
    expect(requests[0]).toMatchObject({ query: 'a', page: 0 });
    expect(component.loading()).toBe(true);
    fixture.detectChanges();
    const spinner = fixture.nativeElement.querySelector(
      'mat-progress-spinner.lookup-spinner',
    ) as HTMLElement;
    expect(spinner).not.toBeNull();
    expect(spinner.getAttribute('aria-label')).toBe(component.text().entityLookup.loading);
    expect(fixture.nativeElement.querySelector('.lookup-status')?.textContent?.trim()).toBe('');
    expect(fixture.nativeElement.querySelector('.state')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain(component.text().entityLookup.loading);

    type(fixture, 'ab');
    respond(0, [{ id: 'stale', label: 'Stale result' }]);
    expect(component.items()).toEqual([]);
    vi.advanceTimersByTime(300);
    expect(requests[1]).toMatchObject({ query: 'ab', page: 0 });
    respond(1, [{ id: 'current', label: 'Current result', detail: 'Current context' }]);
    settleOverlay(fixture);

    expect(await harness.isOpen()).toBe(true);
    const options = await harness.getOptions();
    expect(options).toHaveLength(1);
    expect(await options[0].getText()).toContain('Current result');
    expect(await options[0].getText()).toContain('Current context');
    const progress = fixture.nativeElement.querySelector('.progress') as HTMLElement;
    expect(progress.textContent).toContain(component.progressLabel());
    expect(progress.closest('mat-form-field')).not.toBeNull();
    expect(component.selectedId()).toBeNull();
    expect(consoleError).not.toHaveBeenCalled();
  });

  it('requests a later page without debounce and reaches its appended option by keyboard', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const { fixture, component, loader } = setup();
    type(fixture, 'many');
    vi.advanceTimersByTime(300);
    const firstPage = Array.from({ length: 5 }, (_, index) => ({
      id: `${index + 1}`,
      label: `Result ${index + 1}`,
    }));
    respond(0, firstPage, 7);
    settleOverlay(fixture);
    const harness = await loader.getHarness(MatAutocompleteHarness);
    expect(await harness.getOptions()).toHaveLength(5);
    const input = inputFor(fixture);
    input.focus();
    expect(document.activeElement).toBe(input);

    for (let index = 0; index < 5; index++) pressKey(fixture, 'ArrowDown');

    expect(requests[1]).toMatchObject({ query: 'many', page: 1 });
    expect(component.loading()).toBe(true);
    expect(component.items()).toEqual(firstPage);
    expect(await harness.getOptions()).toHaveLength(5);

    respond(
      1,
      [
        { id: '1', label: 'Result 1 repeated after a concurrent mutation' },
        { id: '6', label: 'Result 6' },
      ],
      7,
      1,
    );
    settleOverlay(fixture);
    expect(component.items().map((item) => item.id)).toEqual(['1', '2', '3', '4', '5', '1', '6']);
    expect(await harness.getOptions()).toHaveLength(7);
    expect(consoleError).not.toHaveBeenCalled();

    // Material resets its active option when the QueryList grows. Traverse the
    // accumulated public option list from the beginning to reach the new page.
    for (let index = 0; index < 7; index++) pressKey(fixture, 'ArrowDown');
    input.scrollLeft = 100;
    pressKey(fixture, 'Enter');

    expect(component.selectedId()).toBe('6');
    expect(component.query()).toBe('Result 6');
    expect(await harness.isOpen()).toBe(false);
    await Promise.resolve();
    expect(document.activeElement).not.toBe(input);
    expect(input.selectionStart).toBe(0);
    expect(input.scrollLeft).toBe(0);
  });

  it('loads on public panel scroll and keeps loaded options selectable while the page is pending', async () => {
    const { fixture, component, loader } = setup();
    type(fixture, 'scroll');
    vi.advanceTimersByTime(300);
    const firstPage = Array.from({ length: 5 }, (_, index) => ({
      id: `${index + 1}`,
      label: `Result ${index + 1}`,
    }));
    respond(0, firstPage, 10);
    settleOverlay(fixture);
    const harness = await loader.getHarness(MatAutocompleteHarness);
    expect(await harness.isOpen()).toBe(true);
    component.panelOpened();
    vi.advanceTimersByTime(0);
    fixture.detectChanges();

    const autocomplete = fixture.debugElement.query(By.directive(MatAutocomplete))
      .componentInstance as MatAutocomplete;
    const panel = autocomplete.panel.nativeElement as HTMLElement;
    Object.defineProperties(panel, {
      clientHeight: { configurable: true, value: 200 },
      scrollHeight: { configurable: true, value: 400 },
      scrollTop: { configurable: true, value: 190, writable: true },
    });
    panel.dispatchEvent(new Event('scroll'));

    expect(requests[1]).toMatchObject({ query: 'scroll', page: 1 });
    expect(component.items()).toEqual(firstPage);
    await harness.selectOption({ text: 'Result 1' });
    expect(component.selectedId()).toBe('1');

    respond(1, [{ id: 'late', label: 'Late result' }], 10, 1);
    expect(component.items()).toEqual([]);
  });

  it('requires explicit selection, preserves submit-time required/optional rules, invalidates and clears', () => {
    const { fixture, component } = setup(true);
    const values: Array<Item | null> = [];
    const states: Array<{ selectedId: string | null; rawContentPresent: boolean }> = [];
    component.valueChange.subscribe((value) => values.push(value));
    component.stateChange.subscribe((state) =>
      states.push({ selectedId: state.selectedId, rawContentPresent: state.rawContentPresent }),
    );

    expect(component.markSubmitted()).toBe(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.invalid-indicator')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('mat-error')?.textContent).toContain(
      component.text().entityLookup.required,
    );
    expect(inputFor(fixture).getAttribute('aria-invalid')).toBe('true');

    type(fixture, '   ');
    expect(component.submitted()).toBe(false);
    expect(fixture.nativeElement.querySelector('.invalid-indicator')).toBeNull();
    expect(inputFor(fixture).getAttribute('aria-invalid')).toBe('false');
    vi.advanceTimersByTime(300);
    expect(requests).toHaveLength(0);
    expect(component.markSubmitted()).toBe(false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-error')?.textContent).toContain(
      component.text().entityLookup.unresolved,
    );

    type(fixture, 'Exact label');
    expect(component.submitted()).toBe(false);
    expect(fixture.nativeElement.querySelector('.invalid-indicator')).toBeNull();
    expect(fixture.nativeElement.querySelector('mat-error')).toBeNull();
    vi.advanceTimersByTime(300);
    respond(0, [{ id: '1', label: 'Exact label' }]);
    settleOverlay(fixture);
    expect(component.selectedId()).toBeNull();
    expect(component.markSubmitted()).toBe(false);

    component.select({ id: '1', label: 'Exact label' });
    fixture.detectChanges();
    expect(component.markSubmitted()).toBe(true);
    expect(component.selectedId()).toBe('1');
    const selectedField = fixture.nativeElement.querySelector('mat-form-field') as HTMLElement;
    expect(inputFor(fixture).value).toBe('Exact label');
    expect(inputFor(fixture).title).toBe('Exact label');
    expect(selectedField.classList).toContain('lookup-success');
    expect(fixture.nativeElement.querySelector('.selected')).toBeNull();
    expect(fixture.nativeElement.querySelector('.success-check')).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('.success-check')?.closest('.lookup-status'),
    ).not.toBe(null);
    expect(fixture.nativeElement.querySelector('.success-check')?.closest('.lookup-suffix')).toBe(
      fixture.nativeElement.querySelector('.clear-button')?.closest('.lookup-suffix'),
    );
    expect(fixture.nativeElement.querySelector('.lookup-spinner')).toBeNull();
    expect(fixture.nativeElement.querySelector('.clear-glyph')?.textContent?.trim()).toBe('×');
    expect(fixture.nativeElement.querySelector('mat-icon')).toBeNull();

    type(fixture, 'Exact label!');
    expect(values.at(-1)).toBeNull();
    expect(states.at(-1)).toEqual({ selectedId: null, rawContentPresent: true });
    expect(selectedField.classList).not.toContain('lookup-success');
    expect(fixture.nativeElement.querySelector('.success-check')).toBeNull();
    expect(inputFor(fixture).getAttribute('title')).toBeNull();
    component.clear();
    fixture.detectChanges();
    expect(component.query()).toBe('');
    expect(component.items()).toEqual([]);
    expect(component.total()).toBe(0);
    expect(component.submitted()).toBe(false);
    expect(fixture.nativeElement.querySelector('.invalid-indicator')).toBeNull();
    expect(states.at(-1)).toEqual({ selectedId: null, rawContentPresent: false });

    const optional = setup().component;
    expect(optional.markSubmitted()).toBe(true);
    optional.inputChanged({ target: { value: '   ' } } as unknown as Event);
    expect(optional.markSubmitted()).toBe(false);
    optional.clear();
    expect(optional.markSubmitted()).toBe(true);
  });

  it('keeps loading, no-results and failures distinct and retries outside the listbox immediately', () => {
    const { fixture, component } = setup();
    type(fixture, 'owner');
    vi.advanceTimersByTime(300);
    fixture.detectChanges();
    expect(
      fixture.nativeElement.querySelector('mat-progress-spinner.lookup-spinner'),
    ).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.invalid-indicator')).toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain(component.text().entityLookup.loading);

    requests[0].result.error(new Error('offline'));
    fixture.detectChanges();
    const retry = fixture.nativeElement.querySelector('.retry') as HTMLButtonElement;
    expect(retry).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.error')?.textContent).toContain(
      component.text().entityLookup.loadFailed,
    );
    expect(fixture.nativeElement.querySelector('.invalid-indicator')).toBeNull();
    expect(document.querySelector('[role="listbox"] .retry')).toBeNull();

    retry.click();
    expect(requests).toHaveLength(2);
    expect(requests[1]).toMatchObject({ query: 'owner', page: 0 });
    expect(component.query()).toBe('owner');
    respond(1, [], 0);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.state')).toBeNull();
    expect(fixture.nativeElement.querySelector('mat-error')?.textContent).toContain(
      component.text().entityLookup.noResults,
    );
    expect(inputFor(fixture).getAttribute('aria-invalid')).toBe('true');

    type(fixture, 'language');
    vi.advanceTimersByTime(300);
    requests[2].result.error(new Error('offline'));
    expect(component.error()).not.toBeNull();
    TestBed.inject(I18nService).toggleLanguage();
    fixture.detectChanges();
    expect(component.error()).toBeNull();
  });

  it('keeps trusted and known-id initialization immediate and guarded from later interaction', async () => {
    const { fixture, component } = setup();
    component.trustInitialValue({ id: 'initial', label: 'Initial label only' });
    await Promise.resolve();
    fixture.detectChanges();
    expect(component.selectedId()).toBe('initial');
    expect(component.value()).toBeNull();
    expect(inputFor(fixture).value).toBe('Initial label only');
    expect(fixture.nativeElement.querySelector('mat-form-field').classList).toContain(
      'lookup-success',
    );

    inputFor(fixture).focus();
    vi.advanceTimersByTime(300);
    expect(requests).toHaveLength(0);

    type(fixture, 'new');
    component.trustInitialValue({ id: 'late', label: 'Late' });
    await Promise.resolve();
    expect(component.selectedId()).toBeNull();

    component.resolveKnownId('1');
    expect(resolutions[0].id).toBe('1');
    type(fixture, 'newer');
    resolutions[0].result.next({ id: '1', label: 'Stale resolution' });
    expect(component.value()).toBeNull();

    component.resolveKnownId('2');
    expect(resolutions[1].id).toBe('2');
    component.markSubmitted();
    resolutions[1].result.next({ id: '2', label: 'Resolved 2' });
    expect(component.value()?.label).toBe('Resolved 2');
    expect(component.selectedId()).toBe('2');
    expect(component.submitted()).toBe(false);
    expect(component.items()).toEqual([]);
  });

  it('uses Material Escape behavior without selecting the active option', async () => {
    const { fixture, component, loader } = setup();
    type(fixture, 'escape');
    vi.advanceTimersByTime(300);
    respond(0, [{ id: '1', label: 'Escape result' }]);
    settleOverlay(fixture);
    const harness = await loader.getHarness(MatAutocompleteHarness);
    expect(await harness.isOpen()).toBe(true);

    pressKey(fixture, 'ArrowDown');
    pressKey(fixture, 'Escape');

    expect(await harness.isOpen()).toBe(false);
    expect(component.selectedId()).toBeNull();
    expect(component.query()).toBe('escape');
  });
});
