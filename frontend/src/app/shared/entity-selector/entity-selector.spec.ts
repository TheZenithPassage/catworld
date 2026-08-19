import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { EntitySelectorComponent, EntitySelectorOption } from './entity-selector';

describe('EntitySelectorComponent', () => {
  const options: readonly EntitySelectorOption[] = [
    { id: 'owner-1', label: 'José Álvarez' },
    { id: 'owner-2', label: 'Maria Costa' },
    { id: 'owner-3', label: 'Maria Costa' },
  ];

  let fixture: ComponentFixture<EntitySelectorComponent>;
  let component: EntitySelectorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntitySelectorComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(EntitySelectorComponent);
    component = fixture.componentInstance;
    component.label = 'Owner';
    component.options = options;
    fixture.detectChanges();
  });

  function input(): HTMLInputElement {
    return fixture.nativeElement.querySelector('input') as HTMLInputElement;
  }

  function type(value: string): void {
    const searchInput = input();
    searchInput.value = value;
    searchInput.dispatchEvent(new Event('input'));
    fixture.detectChanges();
  }

  it('filters case- and accent-insensitively and emits the selected identifier', () => {
    const emitted: Array<string | null> = [];
    component.valueChange.subscribe((value) => emitted.push(value));

    type('JOSE alv');
    expect(component.filteredOptions.map((option) => option.id)).toEqual(['owner-1']);

    const trigger = fixture.debugElement
      .query(By.directive(MatAutocompleteTrigger))
      .injector.get(MatAutocompleteTrigger);
    trigger.openPanel();
    fixture.detectChanges();
    trigger.autocomplete.options.first._selectViaInteraction();
    fixture.detectChanges();

    expect(emitted).toEqual(['owner-1']);
    expect(component.value).toBe('owner-1');
    expect(input().value).toBe('José Álvarez');
  });

  it('keeps duplicate labels distinct by identifier', () => {
    type('maria');
    expect(component.filteredOptions.map((option) => option.id)).toEqual(['owner-2', 'owner-3']);
  });

  it('clears stale identifiers when selected text is edited or the option disappears', () => {
    const emitted: Array<string | null> = [];
    component.value = 'owner-1';
    component.valueChange.subscribe((value) => emitted.push(value));
    fixture.detectChanges();

    type('José changed');
    expect(component.value).toBeNull();
    expect(emitted).toEqual([null]);

    component.value = 'owner-2';
    component.options = [options[0]];
    expect(component.value).toBeNull();
    expect(component.searchText).toBe('');
    expect(emitted).toEqual([null, null]);
  });

  it('exposes linked combobox/listbox semantics and selects the active option with the keyboard', async () => {
    const emitted: Array<string | null> = [];
    component.valueChange.subscribe((value) => emitted.push(value));
    const searchInput = input();

    expect(searchInput.getAttribute('role')).toBe('combobox');
    expect(searchInput.getAttribute('aria-haspopup')).toBe('listbox');
    const fieldLabel = fixture.nativeElement.querySelector(
      `label[for="${searchInput.id}"]`,
    ) as HTMLLabelElement;
    expect(fieldLabel.textContent).toContain('Owner');
    expect(searchInput.getAttribute('aria-expanded')).toBe('false');

    const trigger = fixture.debugElement
      .query(By.directive(MatAutocompleteTrigger))
      .injector.get(MatAutocompleteTrigger);
    searchInput.focus();
    trigger.openPanel();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(searchInput.getAttribute('aria-expanded')).toBe('true');
    const listboxId = searchInput.getAttribute('aria-controls');
    const listbox = document.getElementById(listboxId!);
    expect(listbox?.getAttribute('role')).toBe('listbox');
    const arrowDown = new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true });
    Object.defineProperty(arrowDown, 'keyCode', { get: () => 40 });
    searchInput.dispatchEvent(arrowDown);
    fixture.detectChanges();
    const activeOptionId = searchInput.getAttribute('aria-activedescendant');
    expect(activeOptionId).toBeTruthy();
    expect(document.getElementById(activeOptionId!)?.getAttribute('role')).toBe('option');
    const enter = new KeyboardEvent('keydown', { key: 'Enter', bubbles: true });
    Object.defineProperty(enter, 'keyCode', { get: () => 13 });
    searchInput.dispatchEvent(enter);
    fixture.detectChanges();

    expect(emitted).toEqual(['owner-1']);
    expect(input().value).toBe('José Álvarez');
  });

  it('dismisses results with Escape without changing the selected identifier', async () => {
    const emitted: Array<string | null> = [];
    component.valueChange.subscribe((value) => emitted.push(value));
    const searchInput = input();
    const trigger = fixture.debugElement
      .query(By.directive(MatAutocompleteTrigger))
      .injector.get(MatAutocompleteTrigger);

    searchInput.focus();
    trigger.openPanel();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(trigger.panelOpen).toBe(true);

    const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true });
    Object.defineProperty(escape, 'keyCode', { get: () => 27 });
    searchInput.dispatchEvent(escape);
    fixture.detectChanges();

    expect(trigger.panelOpen).toBe(false);
    expect(component.value).toBeNull();
    expect(emitted).toEqual([]);
  });

  it('prevents disabled selection and clearing interactions', async () => {
    const emitted: Array<string | null> = [];
    fixture.componentRef.setInput('clearable', true);
    component.value = 'owner-1';
    fixture.componentRef.setInput('disabled', true);
    component.valueChange.subscribe((value) => emitted.push(value));
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const searchInput = input();
    const clear = fixture.nativeElement.querySelector('button') as HTMLButtonElement;

    expect(searchInput.disabled).toBe(true);
    searchInput.click();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(MatAutocompleteTrigger))).toBeNull();
    expect(clear.disabled).toBe(true);
    clear.click();
    fixture.detectChanges();
    expect(component.value).toBe('owner-1');
    expect(input().value).toBe('José Álvarez');
    expect(emitted).toEqual([]);
  });

  it('optionally clears both identifier and visible label', () => {
    const emitted: Array<string | null> = [];
    component.clearable = true;
    component.clearLabel = 'Clear owner';
    component.value = 'owner-1';
    component.valueChange.subscribe((value) => emitted.push(value));
    fixture.detectChanges();

    const clear = fixture.nativeElement.querySelector(
      'button[aria-label="Clear owner"]',
    ) as HTMLButtonElement;
    expect(clear).not.toBeNull();
    clear.click();
    fixture.detectChanges();
    expect(component.value).toBeNull();
    expect(input().value).toBe('');
    expect(emitted).toEqual([null]);
  });

  it('does not expose a clear action unless clearing is enabled with a selection', () => {
    component.value = 'owner-1';
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();

    component.clearable = true;
    component.value = null;
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });

  it('shows the supplied empty-results text', () => {
    component.noResultsText = 'No owners found';
    type('unmatched');
    const trigger = fixture.debugElement
      .query(By.directive(MatAutocompleteTrigger))
      .injector.get(MatAutocompleteTrigger);
    trigger.openPanel();
    fixture.detectChanges();
    expect(trigger.autocomplete.options.first.disabled).toBe(true);
    expect(trigger.autocomplete.options.first.viewValue).toBe('No owners found');
  });
});
