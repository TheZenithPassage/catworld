import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { OwnerEditor } from '../../features/owners/components/owner-editor/owner-editor';
import { Owner } from '../../features/owners/models/owner.model';
import { OwnerApiService } from '../../features/owners/services/owner-api.service';
import { EntityDetailDialog } from './entity-detail-dialog';

describe('EntityDetailDialog', () => {
  const owner: Owner = {
    id: 'owner-1',
    fullName: 'Ada Lovelace',
    address: null,
    primaryPhone: '555-1111',
    secondaryPhone: null,
    secondaryPhoneName: null,
    instagram: null,
    facebook: null,
  };
  const updated = { ...owner, fullName: 'Ada Byron' };
  const secondOwner = { ...owner, id: 'owner-2', fullName: 'Grace Hopper' };
  const api = {
    getOwnerById: vi.fn((id: string) => of(id === 'owner-2' ? secondOwner : owner)),
    updateOwner: vi.fn(() => of(updated)),
  };

  beforeEach(() => vi.clearAllMocks());
  afterEach(() => TestBed.resetTestingModule());

  it('keeps edit and authoritative save inside the open route-free detail shell', async () => {
    await TestBed.configureTestingModule({
      imports: [EntityDetailDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { entityType: 'owner', entityId: 'owner-1' } },
        { provide: OwnerApiService, useValue: api },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EntityDetailDialog);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ada Lovelace');

    (
      fixture.nativeElement.querySelector(
        'app-owner-detail button[mat-flat-button]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    const editor = fixture.debugElement.query(By.directive(OwnerEditor))
      .componentInstance as OwnerEditor;
    editor.fullName.set('Ada Byron');
    editor.submit();
    fixture.detectChanges();

    expect(api.updateOwner).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Ada Byron');
    expect(fixture.debugElement.query(By.directive(OwnerEditor))).toBeNull();
    expect(fixture.componentInstance.editing()).toBe(false);
  });

  it('owns cancel and reference-change discard transitions and handles Stay explicitly', async () => {
    await TestBed.configureTestingModule({
      imports: [EntityDetailDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { entityType: 'owner', entityId: 'owner-1' } },
        { provide: OwnerApiService, useValue: api },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EntityDetailDialog);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    (
      fixture.nativeElement.querySelector(
        'app-owner-detail button[mat-flat-button]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    let editor = fixture.debugElement.query(By.directive(OwnerEditor))
      .componentInstance as OwnerEditor;
    editor.fullName.set('Unsaved draft');
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector(
        'app-owner-editor button[mat-stroked-button]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(api.updateOwner).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Ada Lovelace');

    (
      fixture.nativeElement.querySelector(
        'app-owner-detail button[mat-flat-button]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    editor = fixture.debugElement.query(By.directive(OwnerEditor)).componentInstance as OwnerEditor;
    expect(editor.fullName()).toBe('Ada Lovelace');

    fixture.componentInstance.showReference({ entityType: 'owner', entityId: 'owner-2' });
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(OwnerEditor))).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Grace Hopper');

    fixture.componentInstance.showReference({ entityType: 'stay', entityId: 'stay-1' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      fixture.componentInstance.text().owners.detail.unsupportedStay,
    );
    expect(fixture.componentInstance.title()).toBe(
      fixture.componentInstance.text().stays.edit.title,
    );
  });
});
