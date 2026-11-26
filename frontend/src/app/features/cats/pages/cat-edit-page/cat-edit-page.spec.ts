import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatAutocompleteHarness } from '@angular/material/autocomplete/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { NgModel } from '@angular/forms';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { EMPTY, NEVER, of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Owner, OwnerLookup } from '../../../owners/models/owner.model';
import { OwnerApiService } from '../../../owners/services/owner-api.service';
import { Vet } from '../../../vets/models/vet.model';
import { VetApiService } from '../../../vets/services/vet-api.service';
import { Cat } from '../../models/cat.model';
import { CatApiService } from '../../services/cat-api.service';
import { CatEditor } from '../../components/cat-editor/cat-editor';
import { CatPhotoInput } from '../../components/cat-photo-input/cat-photo-input';
import { CatProfileOptionsService } from '../../../../shared/cat-profile-options/cat-profile-options.service';
import { RemoteEntitySelector } from '../../../../shared/entity-lookup/remote-entity-selector';
import { AuthSessionService } from '../../../../core/auth/auth-session.service';

describe('CatEditor', () => {
  let component: CatEditor;
  let fixture: ComponentFixture<CatEditor>;
  let routeParams: Record<string, string>;

  const owners: Owner[] = [
    {
      id: 'owner-1',
      fullName: 'Ada Lovelace',
      address: null,
      primaryPhone: '555-1111',
      secondaryPhone: null,
      secondaryPhoneName: null,
      instagram: null,
      facebook: null,
      notes: null,
    },
  ];

  const vets: Vet[] = [
    {
      id: 'vet-1',
      name: 'Dr. Vet',
      address: null,
      phoneNumber: null,
      registrationNumber: null,
      notes: null,
    },
  ];

  const cat: Cat = {
    id: 'cat-1',
    updatedAt: '2026-10-05T13:00:00.123456Z',
    name: 'Milo',
    birthDate: '2020-01-02',
    sex: 'MALE',
    breed: 'Tabby',
    coat: null,
    color: 'Orange',
    foodBrand: null,
    litterBrand: null,
    personality: 'Friendly',
    notes: null,
    lastInternalDewormerName: null,
    lastInternalDewormingDate: null,
    lastExternalDewormerName: null,
    lastExternalDewormingDate: null,
    lastTripleFelineDate: '2025-02-03',
    lastRabiesDate: null,
    ownerId: 'owner-1',
    ownerName: 'Ada Lovelace',
    vetId: 'vet-1',
    vetName: 'Dr. Vet',
    hasPhoto: false,
  };

  const catApiService = {
    getCatById: vi.fn(),
    updateCat: vi.fn(),
    listInformationalPhotos: vi.fn(),
    getInformationalPhoto: vi.fn(),
    addInformationalPhoto: vi.fn(),
    deleteInformationalPhoto: vi.fn(),
  };

  const profileOptions = {
    load: vi.fn(),
    loadVarieties: vi.fn(),
    catalog: signal(null),
    varieties: signal([]),
  };

  const ownerApiService = {
    getOwners: vi.fn(),
    searchOwners: vi.fn(),
    getOwnerLookup: vi.fn(),
  };

  const vetApiService = {
    getVets: vi.fn(),
    searchVets: vi.fn(),
    getVetById: vi.fn(),
  };

  const router = {
    navigate: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    router.navigate.mockResolvedValue(true);
    routeParams = { id: 'cat-1' };
    catApiService.getCatById.mockReturnValue(of(cat));
    catApiService.listInformationalPhotos.mockReturnValue(
      of([{ id: 'attachment-1', createdAt: '2026-11-12T08:00:00Z' }]),
    );
    catApiService.getInformationalPhoto.mockReturnValue(
      of(new Blob(['record'], { type: 'image/jpeg' })),
    );
    ownerApiService.getOwners.mockReturnValue(of(owners));
    vetApiService.getVets.mockReturnValue(of(vets));
    window.scrollTo = vi.fn();

    await TestBed.configureTestingModule({
      imports: [CatEditor],
      providers: [
        provideNoopAnimations(),
        { provide: CatProfileOptionsService, useValue: profileOptions },
        {
          provide: CatApiService,
          useValue: { ...catApiService, getFramedCatPhoto: () => EMPTY },
        },
        {
          provide: OwnerApiService,
          useValue: ownerApiService,
        },
        {
          provide: VetApiService,
          useValue: vetApiService,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              get paramMap() {
                return convertToParamMap(routeParams);
              },
            },
          },
        },
        {
          provide: Router,
          useValue: router,
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(CatEditor);
    fixture.componentRef.setInput('entityId', routeParams['id'] ?? '');
    fixture.componentRef.setInput('routed', true);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  async function submitRenderedForm(): Promise<void> {
    fixture.nativeElement
      .querySelector('form')
      ?.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
    await fixture.whenStable();
    fixture.detectChanges();
  }

  function setInputValue(name: string, value: string): void {
    const inputDebugElement = fixture.debugElement.query(By.css(`input[name="${name}"]`));
    const input = inputDebugElement.nativeElement as HTMLInputElement;
    const ngModel = inputDebugElement.injector.get(NgModel);
    const formSignal = (component as unknown as Record<string, { set(value: string): void }>)[name];

    input.value = value;
    ngModel.control.setValue(value);
    ngModel.control.markAsTouched();
    ngModel.control.updateValueAndValidity();
    formSignal?.set(value);
    fixture.detectChanges();
  }

  function getMaterialErrorText(): string {
    return [...fixture.nativeElement.querySelectorAll('mat-error')]
      .map((error) => error.textContent?.trim())
      .join(' ');
  }

  function stageGalleryChanges(): File {
    const gallery = (fixture.nativeElement as HTMLElement).querySelector(
      'app-cat-informational-photo-gallery',
    )!;
    const remove = gallery.querySelector('li button[aria-label]') as HTMLButtonElement;
    remove.click();
    fixture.detectChanges();
    (gallery.querySelector('.confirmation-actions button:last-child') as HTMLButtonElement).click();
    fixture.detectChanges();

    const file = new File(['record'], 'record.jpg', { type: 'image/jpeg' });
    const input = gallery.querySelector('input[type=file]') as HTMLInputElement;
    Object.defineProperty(input, 'files', { value: [file] });
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    return file;
  }

  it('discards confirmed removals and new files on cancel without writing them', async () => {
    createComponent();
    fixture.componentRef.setInput('routed', false);
    fixture.detectChanges();
    await fixture.whenStable();
    stageGalleryChanges();
    const cancelled = vi.fn();
    component.cancelled.subscribe(cancelled);
    (
      fixture.nativeElement.querySelector('.form-actions button[type=button]') as HTMLButtonElement
    ).click();

    expect(cancelled).toHaveBeenCalledOnce();
    expect(catApiService.updateCat).not.toHaveBeenCalled();
    expect(catApiService.addInformationalPhoto).not.toHaveBeenCalled();
    expect(catApiService.deleteInformationalPhoto).not.toHaveBeenCalled();
  });

  it('sends the gallery changes once and retains the draft after a stale save', async () => {
    createComponent();
    await fixture.whenStable();
    const file = stageGalleryChanges();
    component.name.set('Milo edited');
    catApiService.updateCat.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 409, error: { code: 'CAT_EDIT_STALE' } })),
    );

    await submitRenderedForm();
    expect(catApiService.updateCat).toHaveBeenCalledOnce();
    expect(catApiService.updateCat).toHaveBeenCalledWith(
      cat.id,
      expect.objectContaining({
        name: 'Milo edited',
        removedInformationalPhotoIds: ['attachment-1'],
      }),
      null,
      false,
      [file],
    );
    expect(component.staleEdit()).toBe(true);
    expect(component.name()).toBe('Milo edited');
    expect(
      fixture.nativeElement.querySelector('app-cat-informational-photo-gallery li').textContent,
    ).toContain(file.name);
  });

  it('opens an enlarged attachment without replacing the editor and releases images on session loss', async () => {
    const auth = TestBed.inject(AuthSessionService);
    auth.login({ username: 'operator', role: 'STAFF' }, { username: 'operator', password: 'pass' });
    createComponent();
    fixture.componentRef.setInput('routed', false);
    component.name.set('Milo draft');
    fixture.detectChanges();
    await fixture.whenStable();

    const gallery = (fixture.nativeElement as HTMLElement).querySelector(
      'app-cat-informational-photo-gallery',
    )!;
    const file = new File(['record'], 'local-record.jpg', { type: 'image/jpeg' });
    const input = gallery.querySelector('input[type=file]') as HTMLInputElement;
    const revoke = vi.spyOn(URL, 'revokeObjectURL');
    try {
      Object.defineProperty(input, 'files', { value: [file] });
      input.dispatchEvent(new Event('change'));
      fixture.detectChanges();
      const localUrl = gallery.querySelector<HTMLImageElement>('img')!.src;
      (gallery.querySelector('.view-photo') as HTMLButtonElement).click();
      fixture.detectChanges();
      await fixture.whenStable();
      const preview = document.querySelector<HTMLImageElement>('[role="dialog"] .enlarged-photo');
      expect(preview?.src).toMatch(/^blob:/);
      expect(catApiService.getInformationalPhoto).toHaveBeenCalledWith(cat.id, 'attachment-1');
      const previewUrl = preview!.src;

      document
        .querySelector<HTMLButtonElement>('[role="dialog"] mat-dialog-actions button')!
        .click();
      await fixture.whenStable();
      fixture.detectChanges();
      expect(revoke).toHaveBeenCalledWith(previewUrl);
      expect(component.name()).toBe('Milo draft');
      expect(gallery.querySelectorAll('li')).toHaveLength(2);

      (gallery.querySelector('.view-photo') as HTMLButtonElement).click();
      fixture.detectChanges();
      await fixture.whenStable();
      const reopened = document.querySelector<HTMLImageElement>(
        '[role="dialog"] .enlarged-photo',
      )!.src;
      auth.logout();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(document.querySelector('[role="dialog"] .enlarged-photo')).toBeNull();
      expect(revoke).toHaveBeenCalledWith(reopened);
      expect(revoke).toHaveBeenCalledWith(localUrl);
      expect(gallery.querySelectorAll('li')).toHaveLength(0);
    } finally {
      revoke.mockRestore();
    }
  });

  it('loads the cat and renders Material edit fields and actions', async () => {
    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(catApiService.getCatById).toHaveBeenCalledWith('cat-1');
    expect(compiled.querySelectorAll('mat-form-field')).toHaveLength(20);
    expect(compiled.querySelector('textarea[name="notes"]')).not.toBeNull();
    expect(compiled.querySelector('select[name=sex]')).not.toBeNull();
    expect(compiled.querySelector('select[name=coat]')).not.toBeNull();
    expect(compiled.querySelector('select[name=litterChoice]')).not.toBeNull();
    expect(compiled.querySelectorAll('app-remote-entity-selector')).toHaveLength(2);
    expect(ownerApiService.getOwners).not.toHaveBeenCalled();
    expect(vetApiService.getVets).not.toHaveBeenCalled();
    expect(ownerApiService.getOwnerLookup).not.toHaveBeenCalled();
    expect(vetApiService.getVetById).not.toHaveBeenCalled();
    expect((compiled.querySelector('input[name="name"]') as HTMLInputElement).value).toBe('Milo');
    expect(compiled.querySelector('button[mat-flat-button]')).not.toBeNull();
    expect(compiled.querySelector('a[mat-stroked-button]')).not.toBeNull();
  });

  it('initializes routed-free edit from trusted Cat labels without relationship reads', async () => {
    fixture = TestBed.createComponent(CatEditor);
    fixture.componentRef.setInput('entityId', cat.id);
    fixture.componentRef.setInput('entity', cat);
    fixture.componentRef.setInput('routed', false);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const selectors = fixture.debugElement
      .queryAll(By.directive(RemoteEntitySelector))
      .map((element) => element.componentInstance as RemoteEntitySelector<unknown>);

    expect(catApiService.getCatById).not.toHaveBeenCalled();
    expect(ownerApiService.getOwners).not.toHaveBeenCalled();
    expect(vetApiService.getVets).not.toHaveBeenCalled();
    expect(ownerApiService.getOwnerLookup).not.toHaveBeenCalled();
    expect(vetApiService.getVetById).not.toHaveBeenCalled();
    expect(selectors.map((selector) => selector.selectedId())).toEqual(['owner-1', 'vet-1']);
    expect(fixture.nativeElement.querySelector('.page-header')).toBeNull();
  });

  it('loads year-only precision, rejects overlong care instructions and clears them explicitly', async () => {
    const yearOnlyCat = {
      ...cat,
      birthDate: null,
      birthYear: 2020,
      careInstructions: 'Separate meals',
      notes: 'Private note',
    };
    catApiService.getCatById.mockReturnValue(of(yearOnlyCat));
    catApiService.updateCat.mockReturnValue(of(yearOnlyCat));
    createComponent();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(component.yearOnly()).toBe(true);
    expect(component.birthDate()).toBe('');
    expect(component.birthYear()).toBe('2020');
    expect(component.careInstructions()).toBe('Separate meals');

    component.updateCareInstructions('x'.repeat(2001));
    component.submit();
    fixture.detectChanges();
    expect(getMaterialErrorText()).toContain(component.text().cats.form.careInstructionsTooLong);
    expect(catApiService.updateCat).not.toHaveBeenCalled();

    component.updateCareInstructions(' ');
    component.submit();
    expect(catApiService.updateCat).toHaveBeenCalledWith(
      cat.id,
      expect.objectContaining({
        birthDate: null,
        birthYear: 2020,
        careInstructions: null,
        notes: 'Private note',
      }),
      null,
      false,
      [],
    );
  });

  it('keeps a dialog draft after a conflict and reloads the saved cat on request', async () => {
    const refreshed = {
      ...cat,
      name: 'Approved name',
      ownerId: 'owner-2',
      ownerName: 'Approved owner',
      updatedAt: '2026-10-05T13:00:00.654321Z',
    };
    const failedReload = new Subject<Cat>();
    catApiService.getCatById.mockReturnValueOnce(failedReload).mockReturnValueOnce(of(refreshed));
    catApiService.updateCat
      .mockReturnValueOnce(
        throwError(() => new HttpErrorResponse({ status: 409, error: { code: 'CAT_EDIT_STALE' } })),
      )
      .mockReturnValueOnce(of(refreshed));
    fixture = TestBed.createComponent(CatEditor);
    fixture.componentRef.setInput('entityId', cat.id);
    fixture.componentRef.setInput('entity', cat);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const photoInput = fixture.debugElement.query(By.directive(CatPhotoInput))
      .componentInstance as CatPhotoInput;
    const ownerSelector = () =>
      fixture.debugElement.query(By.directive(RemoteEntitySelector))
        .componentInstance as RemoteEntitySelector<OwnerLookup>;
    ownerSelector().select({ id: 'draft-owner', fullName: 'Draft owner', currentCats: [] });
    const draftPhoto = new File(['photo'], 'draft.jpg', { type: 'image/jpeg' });
    photoInput.select(fileChange(draftPhoto));
    component.name.set('Draft name');

    component.submit();
    fixture.detectChanges();

    expect(catApiService.updateCat).toHaveBeenNthCalledWith(
      1,
      cat.id,
      expect.objectContaining({ name: 'Draft name', expectedUpdatedAt: cat.updatedAt }),
      draftPhoto,
      false,
      [],
    );
    expect(component.name()).toBe('Draft name');
    expect(photoInput.mutation().photo).toBe(draftPhoto);
    expect(catApiService.getCatById).not.toHaveBeenCalled();
    const reload = () =>
      fixture.nativeElement.querySelector('[role="alert"] button') as HTMLButtonElement;
    expect(reload().textContent?.trim()).toBe('Recargar ficha');
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);

    reload().click();
    fixture.detectChanges();
    expect(photoInput.mutation().photo).toBe(draftPhoto);
    failedReload.error(new HttpErrorResponse({ status: 500 }));
    fixture.detectChanges();
    expect(component.name()).toBe('Draft name');
    expect(photoInput.mutation().photo).toBe(draftPhoto);
    expect(ownerSelector().selectedId()).toBe('draft-owner');
    expect(reload().textContent?.trim()).toBe('Recargar ficha');

    reload().click();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(catApiService.getCatById.mock.calls).toEqual([[cat.id], [cat.id]]);
    expect(component.name()).toBe('Approved name');
    expect(ownerSelector().selectedId()).toBe('owner-2');
    expect(
      (
        fixture.debugElement.query(By.directive(CatPhotoInput)).componentInstance as CatPhotoInput
      ).mutation().photo,
    ).toBeNull();
    component.submit();
    expect(catApiService.updateCat).toHaveBeenNthCalledWith(
      2,
      cat.id,
      expect.objectContaining({
        name: 'Approved name',
        ownerId: 'owner-2',
        expectedUpdatedAt: refreshed.updatedAt,
      }),
      null,
      false,
      [],
    );
  });

  it('does not update when the name is blank', async () => {
    createComponent();
    fixture.detectChanges();
    setInputValue('name', '   ');
    await submitRenderedForm();

    expect(catApiService.updateCat).not.toHaveBeenCalled();
    expect(component.nameError()).toBe(component.text().cats.edit.errors.nameRequired);
    expect(getMaterialErrorText()).toContain(component.text().cats.edit.errors.nameRequired);
    expect(component.error()).toBeNull();
  });

  it('updates a cat with the current payload shape and emits the authoritative result', () => {
    createComponent();
    catApiService.updateCat.mockReturnValue(of(cat));
    const saved = vi.fn();
    component.saved.subscribe(saved);

    component.name.set('  Milo  ');
    component.deceased.set(true);
    component.birthDate.set('2020-01-02');
    component.sex.set('MALE');
    component.ownerId.set('owner-1');
    component.vetId.set('');
    component.vetRawContentPresent.set(false);
    component.breed.set('');
    component.coat.set('Corto');
    component.color.set(' orange ');
    component.foodBrand.set('  ');
    component.litterBrand.set(' pine ');
    component.personality.set('');
    component.notes.set('  first line\n  second line  ');
    component.lastInternalDewormerName.set(' pill ');
    component.lastInternalDewormingDate.set('');
    component.lastExternalDewormerName.set('');
    component.lastExternalDewormingDate.set('2025-01-01');
    component.lastTripleFelineDate.set('2025-02-03');
    component.lastRabiesDate.set('');

    component.submit();

    expect(catApiService.updateCat).toHaveBeenCalledWith(
      'cat-1',
      {
        name: 'Milo',
        expectedUpdatedAt: cat.updatedAt,
        deceased: true,
        birthDate: '2020-01-02',
        sex: 'MALE',
        breed: null,
        coat: 'Corto',
        color: 'orange',
        foodBrand: null,
        litterBrand: 'pine',
        personality: null,
        notes: 'first line\n  second line',
        lastInternalDewormerName: 'pill',
        lastInternalDewormingDate: null,
        lastExternalDewormerName: null,
        lastExternalDewormingDate: '2025-01-01',
        lastTripleFelineDate: '2025-02-03',
        lastRabiesDate: null,
        ownerId: 'owner-1',
        vetId: null,
      },
      null,
      false,
      [],
    );
    expect(saved).toHaveBeenCalledWith(cat);
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.submitting()).toBe(false);
  });

  it('preserves historical coat, markings and own litter when editing another field', async () => {
    const saved: Cat = {
      ...cat,
      coat: 'Semilargo',
      color: '  White  ',
      litterBrand: 'Pine pellets',
    };
    catApiService.getCatById.mockReturnValue(of(saved));
    catApiService.updateCat.mockReturnValue(of(saved));
    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector<HTMLSelectElement>('[name=coat]')?.value).toBe('Semilargo');
    expect(root.querySelector<HTMLSelectElement>('[name=litterChoice]')?.value).toBe('own');
    const litter = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      MatAutocompleteHarness.with({ selector: '[name=litterBrand]' }),
    );
    expect(await litter.getValue()).toBe('Pine pellets');
    component.name.set('New name');
    component.submit();
    expect(catApiService.updateCat.mock.lastCall?.[1]).toEqual(
      expect.objectContaining({ coat: 'Semilargo', color: '  White  ' }),
    );
    expect(catApiService.updateCat.mock.lastCall?.[1]).not.toHaveProperty('litterBrand');
  });

  it('shows a localized Material error and does not update for overlong notes', async () => {
    createComponent();
    component.notes.set('x'.repeat(10001));
    component.submit();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(catApiService.updateCat).not.toHaveBeenCalled();
    expect(getMaterialErrorText()).toContain(component.text().cats.edit.errors.notesTooLong);
  });

  it('shows and clears the notes boundary error immediately without updating', async () => {
    createComponent();

    component.updateNotes('x'.repeat(10000));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(getMaterialErrorText()).not.toContain(component.text().cats.edit.errors.notesTooLong);

    component.updateNotes('x'.repeat(10001));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(getMaterialErrorText()).toContain(component.text().cats.edit.errors.notesTooLong);

    component.updateNotes('x'.repeat(10000));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(getMaterialErrorText()).not.toContain(component.text().cats.edit.errors.notesTooLong);
    expect(catApiService.updateCat).not.toHaveBeenCalled();
  });

  it('submits unchanged, removal, replacement, and restored saved-photo intents', () => {
    catApiService.getCatById.mockReturnValue(of({ ...cat, hasPhoto: true }));
    catApiService.updateCat.mockReturnValue(EMPTY);
    createComponent();
    const photoInput = fixture.debugElement.query(By.directive(CatPhotoInput))
      .componentInstance as CatPhotoInput;
    const photo = new File(['photo'], 'replacement.jpg', { type: 'image/jpeg' });

    component.submit();
    expect(catApiService.updateCat.mock.calls.at(-1)?.slice(2, 4)).toEqual([null, false]);
    photoInput.markSavedPhotoForRemoval();
    component.submit();
    expect(catApiService.updateCat.mock.calls.at(-1)?.slice(2, 4)).toEqual([null, true]);
    photoInput.undoRemoval();
    photoInput.select(fileChange(photo));
    component.submit();
    expect(catApiService.updateCat.mock.calls.at(-1)?.slice(2, 4)).toEqual([photo, false]);
    photoInput.removeSelection();
    component.submit();
    expect(catApiService.updateCat.mock.calls.at(-1)?.slice(2, 4)).toEqual([null, false]);
  });

  it('retains a staged replacement when returning to edit from catalog confirmation', async () => {
    createComponent();
    const input = fixture.debugElement.query(By.directive(CatPhotoInput))
      .componentInstance as CatPhotoInput;
    const photo = new File(['photo'], 'replacement.jpg', { type: 'image/jpeg' });
    input.restore(photo);
    component.breed.set('Unlisted breed');
    catApiService.updateCat
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 409,
              error: {
                code: 'CAT_CATALOG_TEXT_CONFIRMATION_REQUIRED',
                fields: { breed: 'Unlisted breed' },
              },
            }),
        ),
      )
      .mockReturnValueOnce(EMPTY);

    component.submit();
    component.submit();
    await fixture.whenStable();
    const dialog = document.querySelector('mat-dialog-container')!;
    expect(dialog.textContent).toContain('Unlisted breed');
    dialog.querySelector<HTMLButtonElement>('mat-dialog-actions button:first-child')!.click();
    await fixture.whenStable();

    expect(component.breed()).toBe('Unlisted breed');
    expect(input.mutation().photo).toBe(photo);
    expect(catApiService.updateCat).toHaveBeenCalledTimes(1);
    component.submit();
    expect(catApiService.updateCat).toHaveBeenCalledTimes(2);
    expect(catApiService.updateCat.mock.lastCall?.[1]).not.toHaveProperty('confirmedCatalogText');
  });

  it('preserves a saved photo after rejecting an oversized replacement and retains fields', () => {
    catApiService.getCatById.mockReturnValue(of({ ...cat, hasPhoto: true }));
    catApiService.updateCat.mockReturnValue(NEVER);
    createComponent();
    const photoInput = fixture.debugElement.query(By.directive(CatPhotoInput))
      .componentInstance as CatPhotoInput;
    const oversized = new File(['bad'], 'replacement.png', { type: 'image/png' });
    Object.defineProperty(oversized, 'size', { value: 32 * 1024 * 1024 + 1 });
    photoInput.select(fileChange(oversized));
    component.name.set('Retained name');

    component.submit();

    expect(catApiService.updateCat).toHaveBeenCalledWith(
      'cat-1',
      expect.objectContaining({ name: 'Retained name' }),
      null,
      false,
      [],
    );
    expect(component.name()).toBe('Retained name');
    expect(photoInput.mutation()).toEqual({ photo: null, removePhoto: false });
    expect(photoInput.selectionError()).toBe(component.text().cats.photo.errors.localFileTooLarge);
    expect(photoInput.valid()).toBe(true);
  });

  it('keeps an accepted replacement after rejecting another candidate and allows its removal', () => {
    catApiService.updateCat.mockReturnValue(NEVER);
    createComponent();
    const photoInput = fixture.debugElement.query(By.directive(CatPhotoInput))
      .componentInstance as CatPhotoInput;
    const photo = new File(['photo'], 'replacement.jpg', { type: 'image/jpeg' });
    photoInput.select(fileChange(photo));
    photoInput.select(fileChange(new File(['bad'], 'replacement.gif', { type: 'image/gif' })));
    component.name.set('Retained name');

    component.submit();

    expect(catApiService.updateCat).toHaveBeenCalledWith(
      'cat-1',
      expect.objectContaining({ name: 'Retained name' }),
      photo,
      false,
      [],
    );
    expect(component.name()).toBe('Retained name');
    expect(photoInput.mutation().photo).toBe(photo);
    expect(photoInput.previewUrl()).not.toBeNull();
    expect(photoInput.valid()).toBe(true);

    photoInput.removeSelection();
    expect(photoInput.mutation()).toEqual({ photo: null, removePhoto: false });
    expect(photoInput.selectionError()).toBeNull();
  });

  it('shows load errors through shared Material error state', () => {
    catApiService.getCatById.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
          }),
      ),
    );

    createComponent();
    fixture.detectChanges();

    expect(component.catLoaded()).toBe(false);
    expect(component.error()).toBe(component.text().cats.edit.errors.loadFormDataFailed);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      component.text().cats.edit.errors.loadFormDataFailed,
    );
  });

  it('shows update errors through shared Material error state', () => {
    createComponent();
    catApiService.updateCat.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: { ownerId: 'raw backend validation text' },
            status: 400,
          }),
      ),
    );

    component.name.set('Milo');
    component.birthDate.set('2020-01-02');
    component.sex.set('MALE');
    component.ownerId.set('owner-1');

    component.submit();
    fixture.detectChanges();

    expect(component.error()).toBe(component.text().cats.edit.errors.ownerRequired);
    expect(component.name()).toBe('Milo');
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      component.text().cats.edit.errors.ownerRequired,
    );
  });
});

function fileChange(file: File): Event {
  return { target: { files: [file], value: 'selected' } } as unknown as Event;
}
