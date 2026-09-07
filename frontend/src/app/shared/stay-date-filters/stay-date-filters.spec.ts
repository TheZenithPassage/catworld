import { Component, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSelect } from '@angular/material/select';
import { MatSelectHarness } from '@angular/material/select/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { I18nService } from '../../core/i18n/i18n.service';
import { StayDateFiltersComponent } from './stay-date-filters';
import { StayDateFilters, DATE_MATCH_MODES } from './stay-date-filter.model';

@Component({
  imports: [StayDateFiltersComponent],
  template: '<app-stay-date-filters [filters]="draft()" (filtersChange)="draft.set($event)" />',
})
class DateHost {
  readonly draft = signal<StayDateFilters>({ dateMatchMode: 'OVERLAPS' });
  readonly dates = viewChild.required(StayDateFiltersComponent);
}

describe('shared Stay date interaction without page or entity state', () => {
  async function setup(language: 'en' | 'es' = 'en') {
    TestBed.configureTestingModule({ imports: [DateHost], providers: [provideNoopAnimations()] });
    TestBed.inject(I18nService).language.set(language);
    const fixture = TestBed.createComponent(DateHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const inputs = fixture.nativeElement.querySelectorAll('input') as NodeListOf<HTMLInputElement>;
    let invalid = [false, false];
    inputs.forEach((input, i) =>
      Object.defineProperty(input, 'validity', {
        configurable: true,
        get: () => ({ valid: !invalid[i], badInput: invalid[i] }),
      }),
    );
    const enter = async (i: number, value: string, bad = false) => {
      invalid[i] = bad;
      inputs[i].value = value;
      inputs[i].dispatchEvent(new Event('input'));
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    const select = fixture.debugElement.query(By.directive(MatSelect))
      .componentInstance as MatSelect;
    const harness = await TestbedHarnessEnvironment.loader(fixture).getHarness(MatSelectHarness);
    const mode = async (value: string) => {
      await harness.open();
      const options = await harness.getOptions();
      await options[DATE_MATCH_MODES.indexOf(value as (typeof DATE_MATCH_MODES)[number])].click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();
    };
    return { fixture, host: fixture.componentInstance, inputs, enter, select, mode, harness };
  }
  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  it('implements availability, preserves mode through bad input and reversal, and resets only on intentional clearing', async () => {
    const { fixture, host, enter, select, mode } = await setup();
    expect(select.disabled).toBe(true);
    expect(select.value).toBe('OVERLAPS');
    expect(select.options.map((o) => o.viewValue)).toEqual([
      'Overlaps the period',
      'Starts and ends within the period',
      'Covers the entire period',
    ]);
    await enter(0, '2030-01-10');
    expect(select.disabled).toBe(false);
    await mode('RANGE_WITHIN_STAY');
    await enter(0, '', true);
    expect(select.disabled).toBe(true);
    expect(host.draft().dateMatchMode).toBe('RANGE_WITHIN_STAY');
    expect(fixture.nativeElement.querySelector('.date-explanation')).toBeNull();
    expect(fixture.nativeElement.querySelector('mat-error')).toBeNull();
    expect(host.dates().validate()).toBe(false);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('mat-error')?.textContent).toContain(
      'complete, valid date',
    );
    await enter(0, '2030-01-10');
    expect(select.disabled).toBe(false);
    expect(select.value).toBe('RANGE_WITHIN_STAY');
    expect(fixture.nativeElement.querySelector('mat-error')).toBeNull();
    await enter(1, '2030-01-09');
    expect(select.disabled).toBe(true);
    expect(host.draft().dateMatchMode).toBe('RANGE_WITHIN_STAY');
    await enter(1, '2030-01-10');
    expect(select.disabled).toBe(false);
    await enter(0, '');
    expect(select.disabled).toBe(false);
    await enter(1, '');
    expect(select.disabled).toBe(true);
    expect(host.draft().dateMatchMode).toBe('OVERLAPS');
    expect(host.dates().validate()).toBe(true);
  });

  it('shows reversed ranges only after submit on the To Material field and clears the error on correction', async () => {
    const { fixture, host, enter, select } = await setup();
    await enter(0, '2030-02-01');
    await enter(1, '2030-01-01');
    expect(select.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('mat-error')).toBeNull();
    expect(host.dates().validate()).toBe(false);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const fields = fixture.nativeElement.querySelectorAll('mat-form-field');
    expect(fields[0].querySelector('mat-error')).toBeNull();
    expect(fields[1].querySelector('mat-error')?.textContent).toContain(
      'To must not be earlier than From',
    );
    await enter(1, '2030-02-02');
    expect(fields[1].querySelector('mat-error')).toBeNull();
  });

  it.each(['en', 'es'] as const)(
    'explains all nine relationships in %s with localized years',
    async (language) => {
      const { fixture, enter, mode, harness } = await setup(language);
      const expected =
        language === 'en'
          ? [
              [
                'Includes stays present for at least one day between 10 Jan 2030 and 20 Jan 2030.',
                'Includes stays that start on 10 Jan 2030 or later and end on 20 Jan 2030 or earlier.',
                'Includes stays that start on 10 Jan 2030 or earlier and end on 20 Jan 2030 or later.',
              ],
              [
                'Includes stays that end on 10 Jan 2030 or later.',
                'Includes stays that start on 10 Jan 2030 or later.',
                'Includes only stays that are present on 10 Jan 2030.',
              ],
              [
                'Includes stays that start on 20 Jan 2030 or earlier.',
                'Includes stays that end on 20 Jan 2030 or earlier.',
                'Includes only stays that are present on 20 Jan 2030.',
              ],
            ]
          : [
              [
                'Incluye estancias presentes al menos un día entre 10 ene 2030 y 20 ene 2030.',
                'Incluye estancias que empiezan el 10 ene 2030 o después y terminan el 20 ene 2030 o antes.',
                'Incluye estancias que empiezan el 10 ene 2030 o antes y terminan el 20 ene 2030 o después.',
              ],
              [
                'Incluye estancias que terminan el 10 ene 2030 o después.',
                'Incluye estancias que empiezan el 10 ene 2030 o después.',
                'Incluye solo estancias presentes el 10 ene 2030.',
              ],
              [
                'Incluye estancias que empiezan el 20 ene 2030 o antes.',
                'Incluye estancias que terminan el 20 ene 2030 o antes.',
                'Incluye solo estancias presentes el 20 ene 2030.',
              ],
            ];
      for (const [row, [from, to]] of [
        ['2030-01-10', '2030-01-20'],
        ['2030-01-10', ''],
        ['', '2030-01-20'],
      ].entries()) {
        await enter(0, from);
        await enter(1, to);
        await harness.open();
        expect(
          Array.from(document.querySelectorAll('mat-option .date-explanation')).map((element) =>
            element.textContent!.trim(),
          ),
        ).toEqual(expected[row]);
        await harness.close();
        for (const [column, value] of DATE_MATCH_MODES.entries()) {
          await mode(value);
          expect(await harness.getValueText()).toBe(
            TestBed.inject(I18nService).text().stays.filters.dateModes[value],
          );
        }
      }
    },
  );
});
