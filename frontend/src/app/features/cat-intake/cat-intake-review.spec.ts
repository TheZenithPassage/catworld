import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

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
  };
  let fixture: ComponentFixture<CatIntakeReview>;
  const api = {
    listReview: vi.fn(),
    getReview: vi.fn(),
    getReviewPhoto: vi.fn(),
    approve: vi.fn(),
  };

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
      providers: [{ provide: CatIntakeApi, useValue: api }],
    }).compileComponents();
    fixture = TestBed.createComponent(CatIntakeReview);
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
    vi.unstubAllGlobals();
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
    expect(fixture.nativeElement.querySelector('button[type="submit"]').disabled).toBe(true);
  });
});
