import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { Observable, Subject, of, throwError } from 'rxjs';

import { CatDetailResponse } from '../../../../shared/entity-detail/relationship.models';
import { PermanentDeletionConfirmationDialog } from '../../../../shared/permanent-deletion/permanent-deletion-confirmation-dialog';
import { CatApiService } from '../../services/cat-api.service';
import { CatDetail } from './cat-detail';

describe('CatDetail permanent deletion', () => {
  let fixture: ComponentFixture<CatDetail>;
  let component: CatDetail;
  let api: { getCatDetail: ReturnType<typeof vi.fn>; deleteCat: ReturnType<typeof vi.fn> };
  let dialogResults: Subject<boolean | undefined>[];
  let dialog: { open: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    localStorage.clear();
    dialogResults = [];
    api = {
      getCatDetail: vi.fn(() => of(detail())),
      deleteCat: vi.fn(() => of(undefined)),
    };
    dialog = {
      open: vi.fn(() => {
        const result = new Subject<boolean | undefined>();
        dialogResults.push(result);
        return { afterClosed: () => result };
      }),
    };
    await TestBed.configureTestingModule({
      imports: [CatDetail],
      providers: [
        provideNoopAnimations(),
        { provide: CatApiService, useValue: api },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(CatDetail);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('entityId', 'cat-1');
    fixture.componentRef.setInput('editing', false);
    fixture.detectChanges();
  });

  it('shows the danger action only for exact true eligibility and keeps the action grouping', () => {
    expect(
      fixture.nativeElement.querySelector('.detail-actions-start .permanent-delete-action'),
    ).not.toBeNull();
    expect(
      fixture.nativeElement.querySelector('.detail-actions-end button')?.textContent,
    ).toContain(component.text().cats.detail.edit);

    component.detail.set(detail(false));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.permanent-delete-action')).toBeNull();

    component.detail.set({ ...detail(false), cat: { ...detail(false).cat, canDelete: undefined } });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.permanent-delete-action')).toBeNull();
    expect(api.getCatDetail).toHaveBeenCalledOnce();
  });

  it('uses the human-readable Cat and Owner subject and cancellation sends no request', () => {
    deleteButton().click();
    const [, config] = dialog.open.mock.calls[0];
    expect(dialog.open.mock.calls[0][0]).toBe(PermanentDeletionConfirmationDialog);
    expect(config.data).toEqual({ subject: 'Mochi — Ada Lovelace' });
    expect(config.data.subject).not.toContain('cat-1');

    dialogResults[0].next(undefined);
    expect(api.deleteCat).not.toHaveBeenCalled();
    expect(component.deleting()).toBe(false);
  });

  it('submits once, retains detail, and locks photo, relationships, stays, Edit, and deletion', () => {
    const photo = vi.fn();
    const navigate = vi.fn();
    const edit = vi.fn();
    const submission = vi.fn();
    component.openPhoto.subscribe(photo);
    component.navigate.subscribe(navigate);
    component.editRequested.subscribe(edit);
    component.submittingChanged.subscribe(submission);

    buttons()
      .find((button) => button.textContent.includes(component.text().cats.detail.viewPhoto))
      ?.click();
    buttons()
      .find((button) => button.textContent.includes('Ada Lovelace'))
      ?.click();
    buttons()
      .find((button) => button.textContent.includes('Dr Curie'))
      ?.click();
    (
      fixture.nativeElement.querySelector('.relationship-group button') as HTMLButtonElement
    ).click();
    editButton().click();
    expect(photo).toHaveBeenCalledOnce();
    expect(navigate).toHaveBeenCalledTimes(3);
    expect(edit).toHaveBeenCalledOnce();

    const pending = new Subject<void>();
    api.deleteCat.mockReturnValue(pending);
    deleteButton().click();
    dialogResults[0].next(true);
    fixture.detectChanges();

    expect(api.deleteCat).toHaveBeenCalledOnce();
    expect(api.deleteCat).toHaveBeenCalledWith('cat-1');
    expect(component.detail()?.cat.name).toBe('Mochi');
    expect(submission.mock.calls.map(([value]) => value)).toEqual([true]);
    expect(buttons().every((button) => button.disabled)).toBe(true);
    expect(deleteButton().textContent).toContain(component.text().deletion.actions.deleting);
    component.confirmPermanentDeletion(component.detail()!);
    expect(dialog.open).toHaveBeenCalledOnce();

    component.detail.set({ ...detail(), stays: { totalElements: 4, items: [] } });
    fixture.detectChanges();
    expect(buttons().find((button) => button.textContent.includes('4'))?.disabled).toBe(true);
  });

  it('treats a successful response as completion with the Cat reference', () => {
    const completed = vi.fn();
    const submission = vi.fn();
    component.deletionCompleted.subscribe(completed);
    component.submittingChanged.subscribe(submission);

    confirmDeletion();

    expect(submission.mock.calls.map(([value]) => value)).toEqual([true, false]);
    expect(completed).toHaveBeenCalledWith({ entityType: 'cat', entityId: 'cat-1' });
    expect(component.deleting()).toBe(false);
  });

  it('treats a post-confirmation 404 as completion without error feedback', () => {
    api.deleteCat.mockReturnValue(throwError(() => new HttpErrorResponse({ status: 404 })));
    const completed = vi.fn();
    component.deletionCompleted.subscribe(completed);

    confirmDeletion();
    fixture.detectChanges();

    expect(completed).toHaveBeenCalledWith({ entityType: 'cat', entityId: 'cat-1' });
    expect(component.deletionError()).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('retains detail and presents localized feedback for forbidden, conflict, and generic failures', () => {
    const failures: Observable<void>[] = [
      throwError(() => new HttpErrorResponse({ status: 403 })),
      throwError(() => new HttpErrorResponse({ status: 409 })),
      throwError(() => new Error('offline')),
    ];
    const messages = [
      component.text().deletion.errors.forbidden,
      component.text().deletion.errors.conflict,
      component.text().deletion.errors.generic,
    ];
    const submission = vi.fn();
    component.submittingChanged.subscribe(submission);

    failures.forEach((failure, index) => {
      api.deleteCat.mockReturnValueOnce(failure);
      confirmDeletion();
      fixture.detectChanges();
      expect(component.detail()?.cat.id).toBe('cat-1');
      expect(component.deleting()).toBe(false);
      expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
        messages[index],
      );
    });
    expect(submission.mock.calls.map(([value]) => value)).toEqual([
      true,
      false,
      true,
      false,
      true,
      false,
    ]);
  });

  function confirmDeletion(): void {
    component.confirmPermanentDeletion(component.detail()!);
    dialogResults.at(-1)?.next(true);
  }

  function buttons(): HTMLButtonElement[] {
    return [...fixture.nativeElement.querySelectorAll('button')];
  }

  function deleteButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.permanent-delete-action');
  }

  function editButton(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.detail-actions-end button');
  }
});

function detail(canDelete: boolean | undefined = true): CatDetailResponse {
  return {
    cat: {
      id: 'cat-1',
      canDelete,
      name: 'Mochi',
      birthDate: '2020-01-01',
      sex: 'FEMALE',
      breed: null,
      coat: null,
      color: null,
      foodBrand: null,
      litterBrand: null,
      personality: null,
      lastInternalDewormerName: null,
      lastInternalDewormingDate: null,
      lastExternalDewormerName: null,
      lastExternalDewormingDate: null,
      lastTripleFelineDate: null,
      lastRabiesDate: null,
      ownerId: 'owner-1',
      ownerName: 'Ada Lovelace',
      vetId: 'vet-1',
      vetName: 'Dr Curie',
      hasPhoto: true,
    },
    stays: {
      totalElements: 1,
      items: [
        {
          stayId: 'stay-1',
          startAt: '2026-08-01T10:00:00',
          endAt: '2026-08-02T10:00:00',
          status: 'RESERVED',
        },
      ],
    },
  };
}
