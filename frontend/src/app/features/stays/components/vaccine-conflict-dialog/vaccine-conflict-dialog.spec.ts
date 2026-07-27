import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { VaccineConflictDialogData, VaccineConflictDialog } from './vaccine-conflict-dialog';

describe('VaccineConflictDialog', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  async function renderDialog(
    canOverride: boolean,
    language: 'es' | 'en' = 'en',
  ): Promise<ComponentFixture<VaccineConflictDialog>> {
    const data: VaccineConflictDialogData = {
      canOverride,
      violations: [
        {
          catId: 'cat-1',
          catName: 'Milo',
          vaccineType: 'RABIES',
          reason: 'EXPIRED',
          vaccinatedOn: '2025-07-01',
          expiresOn: '2026-07-01',
        },
        {
          catId: 'cat-2',
          catName: 'Luna',
          vaccineType: 'TRIPLE_FELINE',
          reason: 'MISSING',
          vaccinatedOn: null,
          expiresOn: null,
        },
      ],
    };

    await TestBed.configureTestingModule({
      imports: [VaccineConflictDialog],
      providers: [provideNoopAnimations(), { provide: MAT_DIALOG_DATA, useValue: data }],
    }).compileComponents();

    const i18nService = TestBed.inject(I18nService);
    i18nService.language.set(language);

    const fixture = TestBed.createComponent(VaccineConflictDialog);
    fixture.detectChanges();

    return fixture;
  }

  it('renders every violation with localized cat, vaccine, and reason copy', async () => {
    const fixture = await renderDialog(true);
    const compiled = fixture.nativeElement as HTMLElement;
    const violations = compiled.querySelectorAll('.violation-list li');

    expect(violations).toHaveLength(2);
    expect(violations[0].textContent).toContain('Milo');
    expect(violations[0].textContent).toContain('Rabies');
    expect(violations[0].textContent).toContain('Vaccination expires before the stay ends');
    expect(violations[1].textContent).toContain('Luna');
    expect(violations[1].textContent).toContain('Triple feline');
    expect(violations[1].textContent).toContain('Vaccination date is missing');
  });

  it('offers cancel and continue only when override is allowed', async () => {
    const adminFixture = await renderDialog(true);
    const adminButtons = Array.from(
      (adminFixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).map((button) => button.textContent?.trim());

    expect(adminButtons).toEqual(['Cancel', 'Continue anyway']);

    TestBed.resetTestingModule();

    const staffFixture = await renderDialog(false);
    const staffButtons = Array.from(
      (staffFixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).map((button) => button.textContent?.trim());

    expect(staffButtons).toEqual(['Dismiss']);
  });
});
