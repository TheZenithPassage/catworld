import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogClose } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { I18nService } from '../../core/i18n/i18n.service';
import {
  isPermanentDeletionConfirmed,
  PermanentDeletionConfirmationDialog,
  PermanentDeletionConfirmationDialogData,
} from './permanent-deletion-confirmation-dialog';

describe('PermanentDeletionConfirmationDialog', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
    localStorage.clear();
  });

  async function renderDialog(
    language: 'es' | 'en',
    subject = 'Milo <img src=x>',
  ): Promise<ComponentFixture<PermanentDeletionConfirmationDialog>> {
    const data: PermanentDeletionConfirmationDialogData = { subject };

    await TestBed.configureTestingModule({
      imports: [PermanentDeletionConfirmationDialog],
      providers: [provideNoopAnimations(), { provide: MAT_DIALOG_DATA, useValue: data }],
    }).compileComponents();

    TestBed.inject(I18nService).language.set(language);

    const fixture = TestBed.createComponent(PermanentDeletionConfirmationDialog);
    fixture.detectChanges();

    return fixture;
  }

  it('renders English permanent-deletion copy and plain-text subject context', async () => {
    const fixture = await renderDialog('en');
    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelector('h2')?.textContent?.trim()).toBe('Delete permanently');
    expect(compiled.querySelector('.dialog-description')?.textContent).toContain(
      'You are about to permanently delete',
    );
    expect(compiled.querySelector('.deletion-subject')?.textContent).toBe('Milo <img src=x>');
    expect(compiled.querySelector('.dialog-description')?.textContent).toContain(
      'This action cannot be undone.',
    );
    expect(compiled.querySelector('img')).toBeNull();
  });

  it('renders distinct Spanish cancel and permanent-delete actions', async () => {
    const fixture = await renderDialog('es', 'Milo');
    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button'),
    ).map((button) => button.textContent?.trim());

    expect(buttons).toEqual(['Cancelar', 'Eliminar de forma permanente']);
  });

  it('binds false to cancel and true only to the destructive action', async () => {
    const fixture = await renderDialog('en');
    const results = fixture.debugElement
      .queryAll(By.directive(MatDialogClose))
      .map((button) => button.injector.get(MatDialogClose).dialogResult);

    expect(results).toEqual([false, true]);
    expect(isPermanentDeletionConfirmed(true)).toBe(true);
    expect(isPermanentDeletionConfirmed(false)).toBe(false);
    expect(isPermanentDeletionConfirmed(undefined)).toBe(false);
  });
});
