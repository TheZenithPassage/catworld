import { HttpErrorResponse } from '@angular/common/http';
import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
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
    foodBrand: [{ id: 'brand-1', name: 'Proposed Food' }],
    lastInternalDewormerName: [],
    lastExternalDewormerName: [],
  });
  const details = { open: vi.fn(() => EMPTY) };

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
        provideRouter([{ path: 'cat-intake', component: CatIntakeReview }]),
        { provide: CatIntakeApi, useValue: api },
        { provide: CatProfileOptionsService, useValue: { load: vi.fn(), catalog } },
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
    expect(root.querySelector('.proofs dl')?.textContent).toContain('2026');
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
    expect(root.textContent).toContain('Para aplicar la variedad o dieta');
    decide('foodDetail');
    expect(approve.disabled).toBe(false);
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

  it('keeps a historical litter description editable and accepts own litter without a brand', () => {
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
    const description = root.querySelector<HTMLInputElement>('[name="litterBrand"]')!;
    expect(description.value).toBe('Wood pellets');
    description.value = '';
    description.dispatchEvent(new Event('input'));
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
    const hint = () => input.closest('mat-form-field')?.querySelector('mat-hint')?.textContent;
    expect(hint()).toBeUndefined();

    for (const value of ['  PROPOSED   Food  ', 'Proposed Foods']) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      if (value === 'Proposed Foods') expect(hint()).toContain('se añadirá al catálogo');
      else expect(hint()).toBeUndefined();
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
});
