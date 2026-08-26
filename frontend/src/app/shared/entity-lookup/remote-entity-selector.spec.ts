import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatPaginator } from '@angular/material/paginator';
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
    vi.useRealTimers();
    TestBed.resetTestingModule();
  });

  function setup(required = false) {
    const fixture = TestBed.createComponent(RemoteEntitySelector<Item>);
    fixture.componentRef.setInput('adapter', adapter);
    fixture.componentRef.setInput('label', 'Owner');
    fixture.componentRef.setInput('required', required);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  function type(component: RemoteEntitySelector<Item>, value: string): void {
    component.inputChanged({ target: { value } } as unknown as Event);
  }

  it('trims and debounces text only, clears stale pages immediately, and ignores superseded responses', () => {
    const { fixture, component } = setup();
    type(component, '   ');
    vi.advanceTimersByTime(300);
    expect(requests).toHaveLength(0);

    type(component, ' a ');
    expect(component.items()).toEqual([]);
    vi.advanceTimersByTime(299);
    expect(requests).toHaveLength(0);
    vi.advanceTimersByTime(1);
    expect(requests[0].query).toBe('a');
    type(component, 'ab');
    requests[0].result.next({
      items: [{ id: 'old', label: 'Old' }],
      page: 0,
      pageSize: 5,
      totalElements: 1,
    });
    expect(component.items()).toEqual([]);
    vi.advanceTimersByTime(300);
    requests[1].result.next({
      items: [{ id: 'new', label: 'New' }],
      page: 0,
      pageSize: 5,
      totalElements: 6,
    });
    expect(component.items()[0].id).toBe('new');
    fixture.detectChanges();
    component.pageChanged({ pageIndex: 1 } as never);
    expect(component.items()).toEqual([]);
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(MatPaginator)).componentInstance.disabled).toBe(
      true,
    );
    expect(requests[2].page).toBe(1);
  });

  it('requires explicit selection, invalidates on first edit, exposes raw content, and fully clears', () => {
    const { component } = setup(true);
    const values: Array<Item | null> = [];
    const states: boolean[] = [];
    component.valueChange.subscribe((value) => values.push(value));
    component.stateChange.subscribe((state) => states.push(state.rawContentPresent));
    expect(component.markSubmitted()).toBe(false);
    type(component, 'Exact label');
    expect(component.value()).toBeNull();
    component.select({ id: '1', label: 'Exact label' });
    expect(component.markSubmitted()).toBe(true);
    expect(component.selectedId()).toBe('1');
    type(component, 'Exact label!');
    expect(values.at(-1)).toBeNull();
    expect(states.at(-1)).toBe(true);
    component.clear();
    expect(component.query()).toBe('');
    expect(component.submitted()).toBe(false);
    expect(component.items()).toEqual([]);
    expect(states.at(-1)).toBe(false);
  });

  it('separates loading, empty, failure and retry; clamps pages; resets stored failure on language change', () => {
    const { fixture, component } = setup();
    type(component, 'owner');
    vi.advanceTimersByTime(300);
    expect(component.loading()).toBe(true);
    requests[0].result.error(new Error('offline'));
    expect(component.error()).not.toBeNull();
    component.retry();
    expect(requests).toHaveLength(2);
    requests[1].result.next({ items: [], page: 0, pageSize: 5, totalElements: 0 });
    expect(component.searched()).toBe(true);
    expect(component.loading()).toBe(false);
    component.pageChanged({ pageIndex: 4 } as never);
    requests[2].result.next({ items: [], page: 4, pageSize: 3, totalElements: 7 });
    expect(requests[3].page).toBe(2);
    requests[3].result.error(new Error('offline'));
    TestBed.inject(I18nService).toggleLanguage();
    fixture.detectChanges();
    expect(component.error()).toBeNull();
  });

  it('keeps lightweight initialization distinct and guards it and resolution from later interaction', async () => {
    const { fixture, component } = setup();
    component.trustInitialValue({ id: 'initial', label: 'Initial label only' });
    await Promise.resolve();
    expect(component.selectedId()).toBe('initial');
    expect(component.value()).toBeNull();
    expect(component.selectedLabel()).toBe('Initial label only');
    component.markSubmitted();
    type(component, 'new');
    component.trustInitialValue({ id: 'late', label: 'Late' });
    await Promise.resolve();
    expect(component.selectedId()).toBeNull();
    expect(component.value()).toBeNull();
    component.resolveKnownId('1');
    expect(resolutions[0].id).toBe('1');
    type(component, 'newer');
    resolutions[0].result.next({ id: '1', label: 'Stale resolution' });
    expect(component.value()).toBeNull();
    component.resolveKnownId('2');
    component.markSubmitted();
    resolutions[1].result.next({ id: '2', label: 'Resolved 2' });
    expect(component.value()?.label).toBe('Resolved 2');
    expect(component.selectedId()).toBe('2');
    expect(component.submitted()).toBe(false);
    expect(component.items()).toEqual([]);
    expect(component.total()).toBe(0);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[role="combobox"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.selected')?.textContent).toContain('Resolved 2');
    component.reset();
    expect(component.submitted()).toBe(false);
    expect(component.selectedId()).toBeNull();
  });
});
