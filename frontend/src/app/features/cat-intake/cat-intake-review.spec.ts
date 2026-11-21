import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatAutocompleteHarness } from '@angular/material/autocomplete/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { EMPTY, of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthSessionService } from '../../core/auth/auth-session.service';
import { I18nService } from '../../core/i18n/i18n.service';
import {
  CatProfileOptions,
  CatProfileOptionsService,
} from '../../shared/cat-profile-options/cat-profile-options.service';
import { EntityDetailDialogService } from '../../shared/entity-detail/entity-detail-dialog.service';
import { CatIntakeApi } from './cat-intake-api';
import { CatIntakeReviewDetail } from './cat-intake-models';
import { CatIntakeReview } from './cat-intake-review';

describe('CatIntakeReview', () => {
  const item = {
    id: 'proposal-1',
    ownerId: 'owner-1',
    ownerName: 'Ana Example',
    catId: 'cat-1',
    catName: 'Milo',
    submittedAt: '2026-11-12T10:00:00Z',
  };
  const conflicting: CatIntakeReviewDetail = {
    ...item,
    current: { name: 'Milo', color: 'Black', foodBrand: 'Current Food' },
    proposed: { color: 'Gray', foodBrand: 'Proposed Food' },
    conflictFields: ['color'],
    unansweredRequestedFields: [],
    photos: [{ id: 'photo-1' }],
    catUpdatedAt: '2026-11-12T10:15:00Z',
    revision: 3,
  };
  let fixture: ComponentFixture<CatIntakeReview>;
  const api = {
    listReview: vi.fn(),
    getReview: vi.fn(),
    getReviewPhoto: vi.fn(),
    approve: vi.fn(),
    dismiss: vi.fn(),
  };
  const catalog = signal<CatProfileOptions>({
    breed: [],
    coat: [],
    color: [],
    foodBrand: [
      { id: 'brand-1', name: 'Proposed Food' },
      { id: 'brand-2', name: 'Current Food' },
    ],
    litterDetail: [{ id: 'pine', name: 'Pine pellets' }],
    lastInternalDewormerName: [],
    lastExternalDewormerName: [],
  });
  const varieties = signal([
    { id: 'variety-1', brandId: 'brand-1', name: 'Chicken' },
    { id: 'variety-2', brandId: 'brand-2', name: 'Turkey' },
  ]);
  const details = { open: vi.fn(() => EMPTY) };
  const publish = vi.fn();

  beforeEach(async () => {
    vi.resetAllMocks();
    api.listReview.mockReturnValue(of([item]));
    api.getReview.mockReturnValue(of(conflicting));
    api.getReviewPhoto.mockReturnValue(of(new Blob()));
    vi.stubGlobal(
      'URL',
      class extends URL {
        static override createObjectURL = vi.fn(() => 'blob:http://localhost/photo');
        static override revokeObjectURL = vi.fn();
      },
    );
    await TestBed.configureTestingModule({
      imports: [CatIntakeReview],
      providers: [
        provideNoopAnimations(),
        provideRouter([{ path: 'cat-intake', component: CatIntakeReview }]),
        { provide: CatIntakeApi, useValue: api },
        {
          provide: CatProfileOptionsService,
          useValue: { load: vi.fn(), loadVarieties: vi.fn(), catalog, varieties, publish },
        },
        { provide: AuthSessionService, useValue: { hasRole: () => true } },
        { provide: EntityDetailDialogService, useValue: details },
      ],
    }).compileComponents();
    TestBed.inject(I18nService).language.set('es');
    fixture = TestBed.createComponent(CatIntakeReview);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.unstubAllGlobals();
  });

  it('opens a linked proposal directly and clears the link when returning to the queue', async () => {
    const harness = await RouterTestingHarness.create();
    const page = await harness.navigateByUrl('/cat-intake?reviewId=proposal-1', CatIntakeReview);

    expect(page.detail()?.id).toBe('proposal-1');
    expect(harness.routeNativeElement?.textContent).toContain('Proposed Food');
    expect(harness.routeNativeElement?.querySelector('[name="foodBrand"]')).toBeNull();
    harness.routeNativeElement?.querySelector<HTMLButtonElement>('button')?.click();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/cat-intake');
    expect(page.selectedId()).toBeNull();
  });

  it('approves a plain comparison without opening the adjustment controls', () => {
    api.getReview.mockReturnValue(
      of({
        ...conflicting,
        proposed: { ...conflicting.proposed, lastRabiesDate: '2026-10-01' },
        conflictFields: [],
      }),
    );
    api.approve.mockReturnValue(of(undefined));
    fixture.nativeElement.querySelector('[data-review-item]').click();
    fixture.detectChanges();

    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('.proof-thumbnail img')).not.toBeNull();
    expect(root.querySelector('.proofs dl')).toBeNull();
    expect(root.querySelector('.field-grid')?.textContent).toContain('2026');
    expect(root.querySelector('fieldset input, fieldset select, fieldset textarea')).toBeNull();
    const approve = root.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(approve.textContent).toContain('Aprobar cambios');
    approve.click();

    expect(api.approve).toHaveBeenCalledWith(item.id, {
      fields: { color: 'Gray', foodBrand: 'Proposed Food', lastRabiesDate: '2026-10-01' },
      photoIds: ['photo-1'],
      expectedCatUpdatedAt: conflicting.catUpdatedAt,
      expectedReviewRevision: 3,
    });
  });

  it('opens adjustments from the direct approval warning without losing the draft', async () => {
    api.getReview.mockReturnValue(
      of({ ...conflicting, proposed: { breed: 'Unlisted breed' }, conflictFields: [] }),
    );
    api.approve.mockReturnValueOnce(
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
    );
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLButtonElement>('[data-review-item]')!.click();
    fixture.detectChanges();

    root.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    await fixture.whenStable();
    const dialog = document.querySelector('mat-dialog-container')!;
    expect(dialog.textContent).toContain('Unlisted breed');
    expect(api.approve).toHaveBeenCalledTimes(1);
    dialog.querySelector<HTMLButtonElement>('mat-dialog-actions button:first-child')!.click();
    await fixture.whenStable();
    fixture.detectChanges();

    expect(root.querySelector<HTMLInputElement>('[name="breed"]')?.value).toBe('Unlisted breed');
    expect(root.querySelector<HTMLInputElement>('[name="photo-photo-1"]')?.checked).toBe(true);
    expect(api.getReview).toHaveBeenCalledTimes(1);
    expect(api.approve).toHaveBeenCalledTimes(1);
  });

  it('shows unanswered requests outside the editable fields and simplifies a single change', () => {
    api.getReview.mockReturnValue(
      of({
        ...conflicting,
        current: { name: 'Milo' },
        proposed: { foodBrand: 'Proposed Food' },
        unansweredRequestedFields: ['litterBrand', 'lastRabiesDate', 'lastTripleFelineDate'],
        conflictFields: [],
        photos: [],
      }),
    );
    api.approve.mockReturnValue(of(undefined));
    fixture.nativeElement.querySelector('[data-review-item]').click();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const pending = root.querySelector('.unanswered-requests')!;
    expect(pending.textContent).toMatch(/Piedritas.*Antirrábica.*Triple felina/i);
    expect(pending.closest('form')).toBeNull();
    adjust();
    expect(root.querySelector('[name="decision-foodBrand"]')).toBeNull();
    const brand = root.querySelector<HTMLInputElement>('[name="foodBrand"]')!;
    brand.value = 'Corrected Food';
    brand.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    root.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    expect(api.approve).toHaveBeenCalledWith(
      item.id,
      expect.objectContaining({ fields: { foodBrand: 'Corrected Food' } }),
    );
  });

  it('can omit a missing value in a partial approval and requires the variety brand when linked', () => {
    api.getReview.mockReturnValue(
      of({
        ...conflicting,
        current: { foodBrand: 'Current Food' },
        proposed: { foodBrand: 'Proposed Food', foodDetail: 'Chicken', color: 'Gray' },
        proposedFoodDetailBrand: 'Proposed Food',
        conflictFields: [],
        photos: [],
      }),
    );
    api.approve.mockReturnValue(of(undefined));
    fixture.nativeElement.querySelector('[data-review-item]').click();
    fixture.detectChanges();
    adjust();
    const root = fixture.nativeElement as HTMLElement;
    const decide = (key: string) => {
      const select = root.querySelector<HTMLSelectElement>('[name="decision-' + key + '"]')!;
      select.value = 'keep';
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    };
    expect(
      root.querySelector('[name="decision-color"] option[value="keep"]')?.textContent,
    ).toContain('Omitir este dato');
    decide('foodBrand');
    const approve = root.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(approve.disabled).toBe(true);
    expect(root.textContent).toContain('Para aplicar la variedad del alimento');
    decide('foodDetail');
    expect(approve.disabled).toBe(false);
    const variety = root.querySelector('[aria-label="Variedad del alimento"]')!;
    expect(variety.querySelector('.field-decision')?.textContent).toContain('Sin dato registrado');
    const varietyChoice = root.querySelector<HTMLSelectElement>('[name="decision-foodDetail"]')!;
    varietyChoice.value = 'apply';
    varietyChoice.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(approve.disabled).toBe(true);
    decide('foodDetail');
    approve.click();
    expect(api.approve).toHaveBeenCalledWith(
      item.id,
      expect.objectContaining({ fields: { color: 'Gray' } }),
    );
  });

  it('leaves a proposal pending on back and requires confirmation to dismiss', () => {
    api.dismiss.mockReturnValue(of(undefined));
    fixture.nativeElement.querySelector('[data-review-item]').click();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector('button')!.click();
    fixture.detectChanges();
    expect(api.dismiss).not.toHaveBeenCalled();

    root.querySelector<HTMLButtonElement>('[data-review-item]')!.click();
    fixture.detectChanges();
    root.querySelector<HTMLButtonElement>('[data-dismiss-review]')!.click();
    fixture.detectChanges();
    expect(api.dismiss).not.toHaveBeenCalled();
    root.querySelector<HTMLButtonElement>('[data-confirm-dismiss]')!.click();

    expect(api.approve).not.toHaveBeenCalled();
    expect(api.dismiss).toHaveBeenCalledWith(item.id, {
      expectedCatUpdatedAt: conflicting.catUpdatedAt,
      expectedReviewRevision: 3,
    });
    expect(fixture.componentInstance.notice()).toBe('dismissed');
  });

  it('can replace a linked variety with a catalog choice for the retained brand', async () => {
    api.getReview.mockReturnValue(
      of({
        ...conflicting,
        current: { foodBrand: 'Current Food' },
        currentFoodBrandId: 'brand-2',
        proposed: { foodBrand: 'Proposed Food', foodDetail: 'Chicken' },
        proposedFoodDetailBrand: 'Proposed Food',
        conflictFields: [],
        photos: [],
      }),
    );
    api.approve.mockReturnValue(of(undefined));
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLButtonElement>('[data-review-item]')!.click();
    fixture.detectChanges();
    adjust();

    const brand = root.querySelector<HTMLSelectElement>('[name="decision-foodBrand"]')!;
    brand.value = 'keep';
    brand.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    const approve = root.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(approve.disabled).toBe(true);
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const variety = await loader.getHarness(
      MatAutocompleteHarness.with({ selector: '[name="foodDetail"]' }),
    );
    const chooseTurkey = async () => {
      await variety.focus();
      await variety.clear();
      await variety.enterText('Tur');
      expect((await variety.getOptions()).length).toBe(1);
      await variety.selectOption({ text: 'Turkey' });
    };
    await chooseTurkey();
    fixture.detectChanges();
    expect(fixture.componentInstance.catalogSelection().foodDetail).toBe('variety-2');
    brand.value = 'apply';
    brand.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(
      root
        .querySelector('[name="foodDetail"]')!
        .closest('app-cat-profile-option-field')
        ?.querySelector('.success-check'),
    ).toBeNull();
    expect(fixture.componentInstance.selectedFields().foodDetail).toBe('Chicken');
    expect(await variety.getValue()).toBe('Chicken');
    brand.value = 'keep';
    brand.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(approve.disabled).toBe(true);
    await chooseTurkey();
    fixture.detectChanges();

    expect(await variety.getValue()).toBe('Turkey');
    expect(approve.disabled).toBe(false);
    approve.click();
    expect(api.approve).toHaveBeenCalledWith(
      item.id,
      expect.objectContaining({ fields: { foodDetail: 'Turkey' }, foodVarietyId: 'variety-2' }),
    );
  });

  it('publishes a variety only after explicitly publishing its new brand', async () => {
    api.getReview.mockReturnValue(
      of({
        ...conflicting,
        proposed: { foodBrand: 'New brand', foodDetail: 'New variety' },
        proposedFoodDetailBrand: 'New brand',
        conflictFields: [],
        photos: [],
      }),
    );
    publish
      .mockReturnValueOnce(of({ id: 'new-brand', name: 'New brand' }))
      .mockReturnValueOnce(of({ id: 'new-variety', name: 'New variety' }));
    api.approve.mockReturnValue(of(undefined));
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLButtonElement>('[data-review-item]')!.click();
    fixture.detectChanges();
    adjust();

    const publicationField = (name: string) =>
      root.querySelector('[name="' + name + '"]')?.closest('app-cat-profile-option-field');
    const publishButton = (name: string) =>
      publicationField(name)?.querySelector<HTMLButtonElement>('.publish-option') ?? null;
    const confirm = async () => {
      await fixture.whenStable();
      const dialog = document.querySelector('mat-dialog-container')!;
      const description = dialog.querySelector('mat-dialog-content')?.textContent;
      dialog.querySelector<HTMLButtonElement>('mat-dialog-actions button:last-child')!.click();
      await fixture.whenStable();
      fixture.detectChanges();
      return description;
    };
    expect(publishButton('foodDetail')).toBeNull();
    publishButton('foodBrand')!.click();
    expect(publish).not.toHaveBeenCalled();
    await confirm();
    expect(publish).toHaveBeenNthCalledWith(1, 'foodBrand', 'New brand', undefined);
    publishButton('foodDetail')!.click();
    expect(await confirm()).toContain('New brand');
    expect(publish).toHaveBeenNthCalledWith(2, 'foodDetail', 'New variety', 'new-brand');
    expect(publicationField('foodDetail')?.querySelector('.success-check')).not.toBeNull();
    expect(api.approve).not.toHaveBeenCalled();
    root.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    expect(api.approve).toHaveBeenCalledWith(
      item.id,
      expect.objectContaining({
        catalogOptionIds: { foodBrand: 'new-brand' },
        foodVarietyId: 'new-variety',
      }),
    );
  });

  it('can keep deleted litter text or explicitly link a replacement in review', async () => {
    api.getReview.mockReturnValue(
      of({
        ...conflicting,
        current: {},
        proposed: { litterBrand: 'Old wood', litterDetail: 'Old wood' },
        retiredCatalogFields: ['litterDetail'],
        conflictFields: [],
        photos: [],
      }),
    );
    api.approve.mockReturnValue(of(undefined));
    const root = fixture.nativeElement as HTMLElement;
    const open = () => {
      root.querySelector<HTMLButtonElement>('[data-review-item]')!.click();
      fixture.detectChanges();
    };
    const approve = () => {
      root.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
      fixture.detectChanges();
    };
    open();
    expect(root.querySelector('[aria-label="Piedritas"]')?.textContent).toContain('como texto');
    approve();
    expect(api.approve.mock.lastCall?.[1]).toMatchObject({
      fields: { litterBrand: 'Old wood', litterDetail: 'Old wood' },
    });
    expect(api.approve.mock.lastCall?.[1]).not.toHaveProperty('catalogOptionIds');

    open();
    adjust();
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const litter = await loader.getHarness(
      MatAutocompleteHarness.with({ selector: '[name=litterBrand]' }),
    );
    await litter.focus();
    await litter.clear();
    await litter.enterText('pine');
    await litter.selectOption({ text: 'Pine pellets' });
    approve();
    expect(api.approve.mock.lastCall?.[1]).toMatchObject({
      fields: { litterBrand: 'Pine pellets', litterDetail: 'Pine pellets' },
      catalogOptionIds: { litterDetail: 'pine' },
    });
  });

  it('shows the recorded values for retained fields in the summary and adjustments', () => {
    api.getReview.mockReturnValue(
      of({
        ...conflicting,
        current: { foodBrand: 'Purina Pro Plan', birthDate: '2022-10-13' },
        proposed: { foodBrand: 'Hola', birthYear: '2023', color: 'Gray' },
        conflictFields: ['foodBrand', 'birthYear', 'color'],
      }),
    );
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLButtonElement>('[data-review-item]')!.click();
    fixture.detectChanges();
    for (const key of ['foodBrand', 'birthDate', 'color']) changeControl('decision-' + key, 'keep');
    const checkRetainedValues = () => {
      const result = (key: string) =>
        root
          .querySelector('[name="decision-' + key + '"]')!
          .closest('.review-field')
          ?.querySelector('.field-decision');
      expect(result('foodBrand')?.querySelector('dt')?.textContent).toBe('Valor que se guardará');
      expect(result('foodBrand')?.querySelector('dd')?.textContent).toBe('Purina Pro Plan');
      expect(result('birthDate')?.querySelector('dd')?.textContent).toMatch(/13.*10.*2022/);
      expect(result('color')?.querySelector('dd')?.textContent).toBe('Sin dato registrado');
    };
    checkRetainedValues();
    adjust();
    checkRetainedValues();
  });

  it('explains how to fix a whitespace-only change beside the field that blocks approval', () => {
    api.getReview.mockReturnValue(of({ ...conflicting, conflictFields: [] }));
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLButtonElement>('[data-review-item]')!.click();
    fixture.detectChanges();
    adjust();
    changeControl('color', '   ', 'input');
    const color = root.querySelector('[name="color"]')!.closest('.review-field')!;
    const approve = root.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(approve.disabled).toBe(true);
    expect(color.querySelector('[role="status"]')?.textContent).toContain('Color y marcas');
    expect(color.querySelector('[role="status"]')?.textContent).toContain('Conservar el actual');
    changeControl('decision-color', 'keep');
    expect(color.querySelector('[role="status"]')).toBeNull();
    expect(approve.disabled).toBe(false);
  });

  it('keeps editing with the draft intact and discards to the prior summary on confirmation', async () => {
    api.getReview.mockReturnValue(
      of({
        ...conflicting,
        proposed: { ...conflicting.proposed, birthDate: '2020-10-13', litterBrand: 'Pellets' },
      }),
    );
    api.approve.mockReturnValue(of(undefined));
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLButtonElement>('[data-review-item]')!.click();
    fixture.detectChanges();
    changeControl('decision-color', 'keep');
    adjust();
    changeControl('decision-color', 'apply');
    changeControl('color', '   ', 'input');
    changeControl('birth-precision', 'birthYear');
    const loader = TestbedHarnessEnvironment.loader(fixture);
    const litter = await loader.getHarness(
      MatAutocompleteHarness.with({ selector: '[name="litterBrand"]' }),
    );
    await litter.focus();
    await litter.clear();
    await litter.enterText('Pine');
    await litter.selectOption({ text: 'Pine pellets' });
    root.querySelector<HTMLInputElement>('[name="photo-photo-1"]')!.click();
    fixture.detectChanges();
    const toggle = root.querySelector<HTMLButtonElement>('[data-cancel-adjustments]')!;
    expect(toggle.textContent).toContain('Cancelar ajustes');
    toggle.click();
    await chooseDiscardAction('Seguir editando');
    expect(root.querySelector<HTMLInputElement>('[name="color"]')?.value).toBe('   ');
    expect(root.querySelector<HTMLInputElement>('[name="birthYear"]')?.value).toBe('2020');
    expect(await litter.getValue()).toBe('Pine pellets');
    expect(fixture.componentInstance.catalogSelection().litterDetail).toBe('pine');
    expect(root.querySelector<HTMLInputElement>('[name="photo-photo-1"]')?.checked).toBe(false);

    toggle.click();
    await chooseDiscardAction('Descartar cambios');
    expect(root.querySelector('[data-adjust]')).not.toBeNull();
    expect(root.querySelector('[name="color"]')).toBeNull();
    expect(root.querySelector<HTMLSelectElement>('[name="decision-color"]')?.value).toBe('keep');
    expect(root.querySelector('.proof-grid')?.textContent).not.toContain(
      'excluido de la aprobación',
    );
    expect(api.approve).not.toHaveBeenCalled();
    root.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();
    expect(api.approve).toHaveBeenCalledWith(
      item.id,
      expect.objectContaining({
        fields: { foodBrand: 'Proposed Food', birthDate: '2020-10-13', litterBrand: 'Pellets' },
        photoIds: ['photo-1'],
      }),
    );
    expect(api.approve.mock.lastCall?.[1]).not.toHaveProperty('catalogOptionIds');
  });

  it('returns to the summary without confirmation after the changes are reverted', () => {
    const photo = new Subject<Blob>();
    api.getReviewPhoto.mockReturnValue(photo);
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLButtonElement>('[data-review-item]')!.click();
    fixture.detectChanges();
    adjust();
    photo.next(new Blob());
    photo.complete();
    changeControl('foodBrand', 'Different Food', 'input');
    changeControl('foodBrand', ' Proposed Food ', 'input');
    root.querySelector<HTMLButtonElement>('[data-cancel-adjustments]')!.click();
    fixture.detectChanges();
    expect(document.querySelector('mat-dialog-container')).toBeNull();
    expect(root.querySelector('[data-adjust]')).not.toBeNull();
    expect(root.querySelector('.proof-thumbnail img')).not.toBeNull();
  });

  it('displays a previously proposed coat length and only offers fixed choices and the historical value', () => {
    api.getReview.mockReturnValue(
      of({
        ...conflicting,
        current: { coat: 'Corto', color: 'Gray' },
        proposed: { coat: 'Semilargo histórico', color: 'White' },
        conflictFields: [],
        photos: [],
      }),
    );
    const root = fixture.nativeElement as HTMLElement;
    root.querySelector<HTMLButtonElement>('[data-review-item]')!.click();
    fixture.detectChanges();
    expect(root.querySelector('[aria-label="Largo del pelo"]')?.textContent).toContain(
      'Semilargo histórico',
    );
    expect(root.querySelector('[aria-label="Color y marcas"]')?.textContent).toContain('White');
    adjust();
    const coat = root.querySelector<HTMLSelectElement>('select[name="coat"]')!;
    expect(coat.value).toBe('Semilargo histórico');
    expect([...coat.options].map(({ value }) => value)).toEqual([
      '',
      'Corto',
      'Largo',
      'Sin pelo',
      'Semilargo histórico',
    ]);
    expect(root.querySelector('input[name="color"]')?.closest('label.control')).toBeTruthy();
  });

  it('requires at least one field or photo to approve an existing proposal', () => {
    api.getReview.mockReturnValue(of({ ...conflicting, conflictFields: [] }));
    fixture.nativeElement.querySelector('[data-review-item]').click();
    fixture.detectChanges();
    adjust();
    const root = fixture.nativeElement as HTMLElement;
    for (const key of ['color', 'foodBrand']) {
      const decision = root.querySelector<HTMLSelectElement>(`[name="decision-${key}"]`)!;
      decision.value = 'keep';
      decision.dispatchEvent(new Event('change'));
    }
    fixture.detectChanges();

    const approve = root.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(approve.disabled).toBe(false);
    root.querySelector<HTMLInputElement>('[name="photo-photo-1"]')!.click();
    fixture.detectChanges();
    expect(approve.disabled).toBe(true);
    root.querySelector('form')!.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(api.approve).not.toHaveBeenCalled();

    api.approve.mockReturnValue(of(undefined));
    root.querySelector<HTMLInputElement>('[name="photo-photo-1"]')!.click();
    fixture.detectChanges();
    approve.click();
    expect(api.approve).toHaveBeenCalledWith(
      item.id,
      expect.objectContaining({ fields: {}, photoIds: ['photo-1'] }),
    );
  });

  it('shows the full new profile and sends only the selected birth precision and optional data', () => {
    api.getReview.mockReturnValue(
      of({
        ...conflicting,
        catId: null,
        catUpdatedAt: null,
        current: null,
        proposed: {
          name: 'Milo',
          sex: 'MALE',
          birthYear: '2021',
          careInstructions: 'Un plato aparte',
        },
        conflictFields: [],
        photos: [],
      }),
    );
    api.approve.mockReturnValue(of(undefined));
    fixture.nativeElement.querySelector('[data-review-item]').click();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.querySelector('button[type="submit"]')?.textContent).toContain('Dar de alta');
    expect(root.querySelector('[aria-label="Nacimiento"]')?.textContent).toContain(
      '2021 (solo año)',
    );
    expect(root.textContent).toContain('Un plato aparte');
    expect(root.querySelector('[name="careInstructions"]')).toBeNull();

    adjust();
    const birth = root.querySelector<HTMLSelectElement>('[name="birth-precision"]')!;
    birth.value = 'birthDate';
    birth.dispatchEvent(new Event('change'));
    const care = root.querySelector<HTMLSelectElement>('[name="decision-careInstructions"]')!;
    care.value = 'keep';
    care.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    const date = root.querySelector<HTMLInputElement>('[name="birthDate"]')!;
    const approve = root.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(approve.disabled).toBe(true);
    date.value = '2021-05-06';
    date.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    approve.click();

    expect(api.approve).toHaveBeenCalledWith(item.id, {
      fields: { name: 'Milo', sex: 'MALE', birthDate: '2021-05-06' },
      photoIds: [],
      expectedCatUpdatedAt: null,
      expectedReviewRevision: 3,
    });
  });

  it('keeps a historical litter description editable and accepts own litter without a brand', async () => {
    api.getReview.mockReturnValue(
      of({
        ...conflicting,
        current: { litterBrand: 'Usa las de CatWorld' },
        proposed: { litterBrand: 'Wood pellets' },
        conflictFields: [],
        photos: [],
      }),
    );
    api.approve.mockReturnValue(of(undefined));
    fixture.nativeElement.querySelector('[data-review-item]').click();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    expect(root.textContent).toContain('Wood pellets');
    adjust();
    const source = root.querySelector<HTMLSelectElement>('[name="litter-source"]')!;
    expect(source.value).toBe('own');
    const description = await TestbedHarnessEnvironment.loader(fixture).getHarness(
      MatAutocompleteHarness.with({ selector: '[name=litterBrand]' }),
    );
    expect(await description.getValue()).toBe('Wood pellets');
    await description.clear();
    fixture.detectChanges();
    root.querySelector<HTMLButtonElement>('button[type="submit"]')!.click();

    expect(api.approve).toHaveBeenCalledWith(
      item.id,
      expect.objectContaining({
        fields: { litterBrand: 'Trae sus propias piedritas' },
      }),
    );
  });

  it('requires resolving conflicting fields and applies only chosen corrections and photos', () => {
    api.approve.mockReturnValue(of(undefined));
    fixture.nativeElement.querySelector('[data-review-item]').click();
    fixture.detectChanges();

    const approve = fixture.nativeElement.querySelector(
      'button[type="submit"]',
    ) as HTMLButtonElement;
    expect(approve.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('[name="name"]')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Black');
    expect(fixture.nativeElement.textContent).toContain('Gray');

    const choice = fixture.nativeElement.querySelector(
      '[name="decision-color"]',
    ) as HTMLSelectElement;
    choice.value = 'keep';
    choice.dispatchEvent(new Event('change'));
    adjust();
    const food = fixture.nativeElement.querySelector('[name="foodBrand"]') as HTMLInputElement;
    food.value = 'Corrected Food';
    food.dispatchEvent(new Event('input'));
    const photo = fixture.nativeElement.querySelector('[name="photo-photo-1"]') as HTMLInputElement;
    expect(photo.checked).toBe(true);
    fixture.detectChanges();
    approve.click();

    expect(api.approve).toHaveBeenCalledWith(item.id, {
      fields: { foodBrand: 'Corrected Food' },
      photoIds: ['photo-1'],
      expectedCatUpdatedAt: conflicting.catUpdatedAt,
      expectedReviewRevision: 3,
    });
  });

  it('refreshes the queue if a proposal can no longer be reviewed', () => {
    api.listReview.mockReturnValue(of([]));
    api.getReview.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    fixture.nativeElement.querySelector('[data-review-item]').click();
    fixture.detectChanges();

    const page = fixture.componentInstance;
    expect(page.selectedId()).toBeNull();
    expect(page.pending()).toEqual([]);
    expect(page.notice()).toBe('unavailable');
  });

  it('opens the current cat in a modal without discarding the review inputs', () => {
    fixture.nativeElement.querySelector('[data-review-item]').click();
    fixture.detectChanges();
    adjust();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('[name="foodBrand"]')!;
    input.value = 'Corrected Food';
    input.dispatchEvent(new Event('input'));
    const photo = root.querySelector<HTMLInputElement>('[name="photo-photo-1"]')!;
    photo.click();
    const modalButton = [...root.querySelectorAll('button')].find(
      (button) => button.textContent.trim() === 'Ver ficha actual',
    );
    expect(modalButton).toBeDefined();
    modalButton!.click();
    fixture.detectChanges();

    expect(details.open).toHaveBeenCalledWith({ entityType: 'cat', entityId: item.catId });
    expect(input.value).toBe('Corrected Food');
    expect(photo.checked).toBe(false);
  });

  it('distinguishes an unfamiliar spelling from a complete catalog match', () => {
    fixture.nativeElement.querySelector('[data-review-item]').click();
    fixture.detectChanges();
    adjust();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('[name="foodBrand"]')!;
    const publication = () =>
      input.closest('app-cat-profile-option-field')?.querySelector('.publish-option');
    expect(publication()).toBeNull();

    for (const value of ['  PROPOSED   Food  ', 'Proposed Foods']) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      if (value === 'Proposed Foods') expect(publication()).not.toBeNull();
      else expect(publication()).toBeNull();
    }
  });

  it('blocks approval until a failed record is explicitly excluded', () => {
    const loading = new Subject<Blob>();
    api.getReview.mockReturnValue(of({ ...conflicting, conflictFields: [] }));
    api.getReviewPhoto.mockReturnValue(loading);
    api.approve.mockReturnValue(of(undefined));
    fixture.nativeElement.querySelector('[data-review-item]').click();
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    const approve = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(approve.disabled).toBe(true);

    loading.error(new HttpErrorResponse({ status: 500 }));
    fixture.detectChanges();
    expect(approve.disabled).toBe(true);
    form.dispatchEvent(new Event('submit', { cancelable: true }));
    expect(api.approve).not.toHaveBeenCalled();

    adjust();
    form.querySelector<HTMLButtonElement>('[data-exclude-photo]')!.click();
    fixture.detectChanges();
    expect(approve.disabled).toBe(false);
    approve.click();
    expect(api.approve).toHaveBeenCalledWith(item.id, expect.objectContaining({ photoIds: [] }));
  });

  it('waits for a retried record and includes it when selected', () => {
    const retry = new Subject<Blob>();
    api.getReview.mockReturnValue(of({ ...conflicting, conflictFields: [] }));
    api.getReviewPhoto
      .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 500 })))
      .mockReturnValueOnce(retry);
    api.approve.mockReturnValue(of(undefined));
    fixture.nativeElement.querySelector('[data-review-item]').click();
    fixture.detectChanges();

    const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    form.querySelector<HTMLButtonElement>('.proof-grid li button')!.click();
    fixture.detectChanges();
    const approve = form.querySelector<HTMLButtonElement>('button[type="submit"]')!;
    expect(approve.disabled).toBe(true);

    retry.next(new Blob());
    retry.complete();
    fixture.detectChanges();
    adjust();
    expect(form.querySelector<HTMLInputElement>('[name="photo-photo-1"]')!.checked).toBe(true);
    fixture.detectChanges();
    approve.click();
    expect(api.approve).toHaveBeenCalledWith(
      item.id,
      expect.objectContaining({ photoIds: ['photo-1'] }),
    );
  });

  it('reloads the comparison after a stale approval so it can be reviewed again', () => {
    api.getReview.mockReturnValueOnce(of({ ...conflicting, revision: 3 })).mockReturnValueOnce(
      of({
        ...conflicting,
        revision: 4,
        proposed: { color: 'White', foodBrand: 'Proposed Food' },
      }),
    );
    api.approve.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 409 })));
    fixture.nativeElement.querySelector('[data-review-item]').click();
    fixture.detectChanges();

    const choice = fixture.nativeElement.querySelector(
      '[name="decision-color"]',
    ) as HTMLSelectElement;
    choice.value = 'apply';
    choice.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    fixture.nativeElement.querySelector('button[type="submit"]').click();
    fixture.detectChanges();

    expect(api.getReview).toHaveBeenCalledTimes(2);
    expect(api.approve).toHaveBeenCalledWith(
      item.id,
      expect.objectContaining({ expectedReviewRevision: 3 }),
    );
    expect(fixture.nativeElement.textContent).toContain('White');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);
  });

  function adjust(): void {
    (fixture.nativeElement as HTMLElement)
      .querySelector<HTMLButtonElement>('[data-adjust]')!
      .click();
    fixture.detectChanges();
  }

  function changeControl(name: string, value: string, event = 'change'): void {
    const root = fixture.nativeElement as HTMLElement;
    const control = root.querySelector<HTMLInputElement | HTMLSelectElement>(`[name="${name}"]`)!;
    control.value = value;
    control.dispatchEvent(new Event(event));
    fixture.detectChanges();
  }

  async function chooseDiscardAction(label: string): Promise<void> {
    await fixture.whenStable();
    const actions = document.querySelectorAll<HTMLButtonElement>('mat-dialog-actions button');
    const button = [...actions].find((action) => action.textContent.trim() === label);
    expect(button).toBeDefined();
    button!.click();
    await fixture.whenStable();
    fixture.detectChanges();
  }
});
