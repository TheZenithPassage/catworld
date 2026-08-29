import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { Observable, of, Subject } from 'rxjs';
import { vi } from 'vitest';

import { OwnerDetailResponse } from '../../../../shared/entity-detail/relationship.models';
import { OwnerApiService } from '../../services/owner-api.service';
import { OwnerDetail } from './owner-detail';

describe('OwnerDetail permanent deletion', () => {
  const ownerId = 'owner-uuid';
  const detail = (canDelete?: boolean): OwnerDetailResponse => ({
    owner: {
      id: ownerId,
      canDelete,
      fullName: 'Ana Owner',
      address: null,
      primaryPhone: '123',
      secondaryPhone: null,
      secondaryPhoneName: null,
      instagram: null,
      facebook: null,
    },
    cats: {
      totalElements: 1,
      items: [{ id: 'cat-1', name: 'Milo', ownerId, ownerName: 'Ana Owner' }],
    },
    stays: { totalElements: 0, items: [] },
  });

  let fixture: ComponentFixture<OwnerDetail>;
  let component: OwnerDetail;
  const api = { getOwnerDetail: vi.fn(), deleteOwner: vi.fn() };
  const dialog = { open: vi.fn() };
  let closed: Subject<unknown>;

  beforeEach(async () => {
    vi.resetAllMocks();
    api.getOwnerDetail.mockReturnValue(of(detail(true)));
    closed = new Subject<unknown>();
    dialog.open.mockReturnValue({ afterClosed: () => closed } as never);
    await TestBed.configureTestingModule({
      imports: [OwnerDetail],
      providers: [
        { provide: OwnerApiService, useValue: api },
        { provide: MatDialog, useValue: dialog },
      ],
    }).compileComponents();
    fixture = TestBed.createComponent(OwnerDetail);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('entityId', ownerId);
    fixture.componentRef.setInput('editing', false);
    fixture.detectChanges();
  });

  it('renders exact eligibility in the shared action groups and preserves edit and related navigation', () => {
    const start = fixture.nativeElement.querySelector('.detail-actions-start');
    const end = fixture.nativeElement.querySelector('.detail-actions-end');
    expect(start.querySelector('.permanent-delete-action')).not.toBeNull();
    expect(end.textContent).toContain(component.text().owners.detail.edit);

    const edits: void[] = [];
    const navigation: unknown[] = [];
    component.editRequested.subscribe(() => edits.push(undefined));
    component.navigate.subscribe((value) => navigation.push(value));
    end.querySelector('button').click();
    fixture.debugElement.query(By.css('.relationship-group button')).nativeElement.click();
    expect(edits.length).toBe(1);
    expect(navigation).toEqual([{ entityType: 'cat', entityId: 'cat-1' }]);

    component.detail.set(detail(false));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.permanent-delete-action')).toBeNull();
    component.detail.set(detail(undefined));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.permanent-delete-action')).toBeNull();
  });

  it('uses only the full name as subject and cancellation sends no DELETE', () => {
    fixture.nativeElement.querySelector('.permanent-delete-action').click();
    expect(dialog.open).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({ data: { subject: 'Ana Owner' } }),
    );
    closed.next(false);
    expect(api.deleteOwner).not.toHaveBeenCalled();
  });

  it('locks actions during one accepted request and completes 204 with the owner payload', () => {
    const deletion = new Subject<void>();
    api.deleteOwner.mockReturnValue(deletion);
    const submitting: boolean[] = [];
    const completed: unknown[] = [];
    component.submittingChanged.subscribe((value) => submitting.push(value));
    component.deletionCompleted.subscribe((value) => completed.push(value));

    fixture.nativeElement.querySelector('.permanent-delete-action').click();
    closed.next(true);
    closed.next(true);
    fixture.detectChanges();
    expect(api.deleteOwner).toHaveBeenCalledTimes(1);
    expect(api.deleteOwner).toHaveBeenCalledWith(ownerId);
    expect(fixture.nativeElement.textContent).toContain(component.text().deletion.actions.deleting);
    for (const button of fixture.nativeElement.querySelectorAll('button'))
      expect(button.disabled).toBe(true);
    expect(component.detail()?.owner.fullName).toBe('Ana Owner');
    expect(submitting).toEqual([true]);

    deletion.next();
    deletion.complete();
    expect(submitting).toEqual([true, false]);
    expect(completed).toEqual([{ entityType: 'owner', entityId: ownerId }]);
  });

  it('completes 404 and retains localized alert feedback for 403, 409, and generic failures', () => {
    const completed: unknown[] = [];
    component.deletionCompleted.subscribe((value) => completed.push(value));
    for (const error of [
      new HttpErrorResponse({ status: 404 }),
      new HttpErrorResponse({ status: 403 }),
      new HttpErrorResponse({ status: 409 }),
      new Error('network'),
    ]) {
      closed = new Subject<unknown>();
      dialog.open.mockReturnValue({ afterClosed: () => closed } as never);
      api.deleteOwner.mockReturnValue(
        new Observable<void>((subscriber) => subscriber.error(error)),
      );
      component.confirmPermanentDeletion(detail(true).owner);
      closed.next(true);
      fixture.detectChanges();
      if (error instanceof HttpErrorResponse && error.status === 404) continue;
      expect(component.detail()?.owner.id).toBe(ownerId);
      expect(
        fixture.nativeElement.querySelector('[role="alert"]')?.textContent.trim(),
      ).toBeTruthy();
    }
    expect(completed).toEqual([{ entityType: 'owner', entityId: ownerId }]);
  });
});
