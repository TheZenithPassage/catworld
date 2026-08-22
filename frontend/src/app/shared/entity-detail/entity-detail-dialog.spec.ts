import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { OwnerEditor } from '../../features/owners/components/owner-editor/owner-editor';
import { Owner } from '../../features/owners/models/owner.model';
import { OwnerApiService } from '../../features/owners/services/owner-api.service';
import { EntityDetailDialog } from './entity-detail-dialog';
import { EntityDetailDialogService } from './entity-detail-dialog.service';

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
    expect(fixture.componentInstance.title()).toBe(
      fixture.componentInstance.text().owners.detail.title,
    );

    fixture.componentInstance.showReference({ entityType: 'stay', entityId: 'stay-1' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      fixture.componentInstance.text().owners.detail.unsupportedStay,
    );
    expect(fixture.componentInstance.title()).toBe(
      fixture.componentInstance.text().stays.edit.title,
    );
  });

  it('ignores stale same-type successes and errors after a reference change', async () => {
    const first = new Subject<Owner>();
    const second = new Subject<Owner>();
    const third = new Subject<Owner>();
    const fourth = new Subject<Owner>();
    api.getOwnerById
      .mockImplementationOnce(() => first)
      .mockImplementationOnce(() => second)
      .mockImplementationOnce(() => third)
      .mockImplementationOnce(() => fourth);
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
    fixture.componentInstance.showReference({ entityType: 'owner', entityId: 'owner-2' });
    fixture.detectChanges();
    second.next(secondOwner);
    fixture.detectChanges();
    first.next(owner);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Grace Hopper');
    expect(fixture.nativeElement.textContent).not.toContain('Ada Lovelace');

    const thirdOwner = { ...owner, id: 'owner-3', fullName: 'Third Owner' };
    const fourthOwner = { ...owner, id: 'owner-4', fullName: 'Current Owner' };
    fixture.componentInstance.showReference({ entityType: 'owner', entityId: thirdOwner.id });
    fixture.detectChanges();
    fixture.componentInstance.showReference({ entityType: 'owner', entityId: fourthOwner.id });
    fixture.detectChanges();
    fourth.next(fourthOwner);
    fixture.detectChanges();
    third.error(new Error('late failure'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Current Owner');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('lets the reactive dialog title provide the accessible name', () => {
    const dialog = { open: vi.fn() };
    TestBed.configureTestingModule({
      providers: [EntityDetailDialogService, { provide: MatDialog, useValue: dialog }],
    });
    TestBed.inject(EntityDetailDialogService).open({ entityType: 'owner', entityId: 'owner-1' });
    expect(dialog.open).toHaveBeenCalledWith(
      EntityDetailDialog,
      expect.not.objectContaining({ ariaLabel: expect.anything() }),
    );
  });
});
