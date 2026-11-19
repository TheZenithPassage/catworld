import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { CalendarDailyAggregate } from './calendar-daily-aggregate';
import { CalendarDailySummaryDialog } from './calendar-daily-summary-dialog';

describe('CalendarDailySummaryDialog', () => {
  const aggregate: CalendarDailyAggregate = {
    date: '2099-01-08',
    count: 3,
    participants: [
      {
        catId: 'cat-2',
        catName: 'Alba',
        ownerId: 'owner-2',
        ownerName: 'Beatriz',
        hasEntry: true,
        hasExit: true,
      },
      {
        catId: 'cat-1',
        catName: 'Milo',
        ownerId: 'owner-1',
        ownerName: 'Ada',
        hasEntry: false,
        hasExit: false,
      },
      {
        catId: 'cat-3',
        catName: 'Zoe',
        ownerId: 'owner-3',
        ownerName: 'Celia',
        hasEntry: false,
        hasExit: true,
      },
    ],
  };

  let fixture: ComponentFixture<CalendarDailySummaryDialog>;

  beforeEach(async () => {
    localStorage.clear();

    await TestBed.configureTestingModule({
      imports: [CalendarDailySummaryDialog],
      providers: [provideNoopAnimations(), { provide: MAT_DIALOG_DATA, useValue: aggregate }],
    }).compileComponents();

    fixture = TestBed.createComponent(CalendarDailySummaryDialog);
    fixture.detectChanges();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  it('shows the local date, total, and every participant in supplied order', () => {
    const element = fixture.nativeElement as HTMLElement;
    const rows = Array.from(element.querySelectorAll('.daily-summary-participant'));

    expect(element.querySelector('.daily-summary-date')?.textContent).toContain('08/01/2099');
    expect(element.querySelector('.daily-summary-total')?.textContent).toContain('3');
    expect(
      rows.map((row) =>
        row.querySelector('.daily-summary-participant__identity')?.textContent.trim(),
      ),
    ).toEqual(['Alba — Beatriz', 'Milo — Ada', 'Zoe — Celia']);
  });

  it('shows combined movement truth and no movement label for a continuing Cat', () => {
    const rows = fixture.nativeElement.querySelectorAll(
      '.daily-summary-participant',
    ) as NodeListOf<HTMLElement>;

    expect(rows[0].querySelectorAll('.daily-summary-movement')).toHaveLength(2);
    expect(rows[0].querySelector('.daily-summary-movement--entry')).not.toBeNull();
    expect(rows[0].querySelector('.daily-summary-movement--exit')).not.toBeNull();
    expect(rows[1].querySelector('.daily-summary-participant__movements')).toBeNull();
    expect(rows[2].querySelectorAll('.daily-summary-movement')).toHaveLength(1);
    expect(rows[2].querySelector('.daily-summary-movement--exit')).not.toBeNull();
  });

  it('keeps header and close action outside the sole participant content region', () => {
    const element = fixture.nativeElement as HTMLElement;
    const content = element.querySelectorAll('mat-dialog-content');
    const header = element.querySelector('.daily-summary-header');
    const actions = element.querySelector('mat-dialog-actions');
    const close = element.querySelector('mat-dialog-actions button');

    expect(content).toHaveLength(1);
    expect(content[0].contains(header)).toBe(false);
    expect(content[0].contains(actions)).toBe(false);
    expect(content[0].querySelectorAll('.daily-summary-participant')).toHaveLength(3);
    expect(close?.getAttribute('aria-label')).toBeTruthy();
    expect(element.querySelector('mat-paginator')).toBeNull();
    expect(element.querySelector('a')).toBeNull();
    expect(element.textContent).not.toContain('2099-01-02T10:00:00');
    expect(element.textContent).not.toContain('RESERVED');
  });
});
