import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { EMPTY, of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { I18nService } from '../../core/i18n/i18n.service';
import { EntityDetailDialogService } from '../../shared/entity-detail/entity-detail-dialog.service';
import { CatApiService } from '../cats/services/cat-api.service';
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
  };
  const catApi = { getFoodBrands: vi.fn() };
  const details = { open: vi.fn(() => EMPTY) };

  beforeEach(async () => {
    vi.resetAllMocks();
    api.listReview.mockReturnValue(of([item]));
    api.getReview.mockReturnValue(of(conflicting));
    api.getReviewPhoto.mockReturnValue(of(new Blob()));
    catApi.getFoodBrands.mockReturnValue(of([{ id: 'brand-1', name: 'Proposed Food' }]));
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
        { provide: CatApiService, useValue: catApi },
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
    expect(
      harness.routeNativeElement?.querySelector<HTMLInputElement>('[name="foodBrand"]')?.value,
    ).toBe('Proposed Food');
    harness.routeNativeElement?.querySelector<HTMLButtonElement>('button')?.click();
    await harness.fixture.whenStable();

    expect(TestBed.inject(Router).url).toBe('/cat-intake');
    expect(page.selectedId()).toBeNull();
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
    const food = fixture.nativeElement.querySelector('[name="foodBrand"]') as HTMLInputElement;
    food.value = 'Corrected Food';
    food.dispatchEvent(new Event('input'));
    const photo = fixture.nativeElement.querySelector('[name="photo-photo-1"]') as HTMLInputElement;
    photo.click();
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
    expect(photo.checked).toBe(true);
  });

  it('distinguishes an unfamiliar spelling from a complete catalog match', () => {
    fixture.nativeElement.querySelector('[data-review-item]').click();
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const input = root.querySelector<HTMLInputElement>('[name="foodBrand"]')!;
    const hint = root.querySelector('#review-food-brand-status')!;
    expect(hint.textContent).not.toContain('Se incorporará');

    for (const value of ['  PROPOSED   Food  ', 'Proposed Foods']) {
      input.value = value;
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(hint.textContent?.includes('Se incorporará')).toBe(value === 'Proposed Foods');
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
    form.querySelector<HTMLInputElement>('[name="photo-photo-1"]')!.click();
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
});
