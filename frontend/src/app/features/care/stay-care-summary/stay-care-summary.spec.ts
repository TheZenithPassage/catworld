import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { I18nService } from '../../../core/i18n/i18n.service';
import { StayApiService } from '../../stays/services/stay-api.service';
import { CareApiService } from '../care-api.service';
import { CareRecord } from '../care.models';
import { StayCareSummary } from './stay-care-summary';

describe('StayCareSummary', () => {
  const stays = { getStayDetail: vi.fn() };
  const care = { history: vi.fn() };
  const baseRecord: CareRecord = {
    id: 'meal',
    stayId: 'stay-1',
    catId: 'cat-1',
    catName: 'Mora',
    businessDate: '2026-11-12',
    recordedAt: '2026-11-13T00:15:00Z',
    routineId: 'food',
    routineName: 'Food',
    routineSeedKey: 'FOOD',
    mode: 'EVENT',
    shift: null,
    note: null,
    authorId: 'operator-1',
    authorUsername: 'private-operator',
    annulledAt: null,
    annulledById: null,
    annulledByUsername: null,
  };

  let fixture: ComponentFixture<StayCareSummary>;
  let summary: StayCareSummary;

  beforeEach(async () => {
    vi.resetAllMocks();
    stays.getStayDetail.mockReturnValue(of({ status: 'CHECKED_OUT' }));
    care.history.mockReturnValue(
      of({
        records: [
          baseRecord,
          {
            ...baseRecord,
            id: 'note',
            catId: 'cat-2',
            catName: 'Luna',
            note: 'Observación interna',
          },
          {
            ...baseRecord,
            id: 'annulled',
            note: 'Anotación anulada',
            annulledAt: baseRecord.recordedAt,
          },
        ],
      }),
    );
    await TestBed.configureTestingModule({
      imports: [StayCareSummary],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: 'stay-1' },
        { provide: MatDialogRef, useValue: {} },
        { provide: StayApiService, useValue: stays },
        { provide: CareApiService, useValue: care },
      ],
    }).compileComponents();
    TestBed.inject(I18nService).language.set('es');
  });

  function open() {
    fixture = TestBed.createComponent(StayCareSummary);
    summary = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('only includes expressly selected records and never includes attribution or annulled records', () => {
    open();
    expect(summary.preview()).toBe('');
    expect(summary.groups().map((group) => group.name)).toEqual(['Mora', 'Luna']);
    summary.choose('annulled', true);
    expect(summary.selectedCount()).toBe(0);

    summary.choose('meal', true);
    expect(summary.preview()).toContain('Mora');
    expect(summary.preview()).toContain('21:15');
    expect(summary.preview()).toContain('Comida');
    expect(summary.preview()).not.toContain('Luna');
    expect(summary.preview()).not.toContain('Observación interna');
    expect(summary.preview()).not.toContain('private-operator');
    expect(summary.preview()).not.toContain('Anotación anulada');
  });

  it('preserves manual edits until the user restores the generated text', () => {
    open();
    summary.choose('meal', true);
    summary.edit('Texto revisado');
    summary.choose('note', true);
    expect(summary.selectedCount()).toBe(1);
    expect(summary.preview()).toBe('Texto revisado');

    summary.restorePreview();
    summary.choose('note', true);
    expect(summary.preview()).toContain('Observación interna');
  });

  it('rechecks the stay status before requesting the internal care history', () => {
    stays.getStayDetail.mockReturnValue(of({ status: 'CHECKED_IN' }));
    open();
    expect(summary.state()).toBe('unavailable');
    expect(care.history).not.toHaveBeenCalled();
  });
});
