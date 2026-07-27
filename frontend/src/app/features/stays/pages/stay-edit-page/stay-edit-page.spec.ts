import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { AuthSessionService } from '../../../../core/auth/auth-session.service';
import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { StayEditPage } from './stay-edit-page';

describe('StayEditPage', () => {
  let component: StayEditPage;
  let fixture: ComponentFixture<StayEditPage>;
  let routeParams: Record<string, string>;
  let dialogClosed: Subject<boolean | undefined>;

  const stay: Stay = {
    stayId: 'stay-1',
    startAt: '2099-01-02T10:00:00',
    endAt: '2099-01-09T10:00:00',
    cancelledAt: null,
    createdAt: '2026-07-02T10:00:00',
    updatedAt: '2026-07-02T10:00:00',
    notes: 'needs quiet room',
    catIds: ['cat-1', 'cat-2'],
    ownerId: 'owner-1',
    ownerName: 'Ada Lovelace',
    cats: [
      { catId: 'cat-1', name: 'Milo' },
      { catId: 'cat-2', name: 'Luna' },
    ],
  };

  const closedStay: Stay = {
    ...stay,
    startAt: '2020-01-02T10:00:00',
    endAt: '2020-01-09T10:00:00',
  };

  const stayApiService = {
    getStayById: vi.fn(),
    updateStay: vi.fn(),
  };

  const router = {
    navigate: vi.fn(),
  };

  const authSessionService = {
    hasRole: vi.fn(),
  };

  const matDialog = {
    open: vi.fn(),
  };

  const vaccineConflict = {
    code: 'VACCINE_VALIDITY_CONFLICT',
    violations: [
      {
        catId: 'cat-1',
        catName: 'Milo',
        vaccineType: 'RABIES',
        reason: 'EXPIRED',
        vaccinatedOn: '2025-07-01',
        expiresOn: '2026-07-01',
      },
    ],
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    router.navigate.mockResolvedValue(true);
    authSessionService.hasRole.mockReturnValue(true);
    dialogClosed = new Subject<boolean | undefined>();
    matDialog.open.mockReturnValue({
      afterClosed: () => dialogClosed.asObservable(),
    });
    routeParams = { id: 'stay-1' };
    stayApiService.getStayById.mockReturnValue(of(stay));
    window.scrollTo = vi.fn();

    await TestBed.configureTestingModule({
      imports: [StayEditPage],
      providers: [
        provideNoopAnimations(),
        {
          provide: StayApiService,
          useValue: stayApiService,
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
        {
          provide: AuthSessionService,
          useValue: authSessionService,
        },
        {
          provide: MatDialog,
          useValue: matDialog,
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(StayEditPage);
    component = fixture.componentInstance;
  }

  it('loads the stay and renders Material edit fields and actions', async () => {
    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(stayApiService.getStayById).toHaveBeenCalledWith('stay-1');
    expect(compiled.querySelectorAll('mat-form-field')).toHaveLength(3);
    expect((compiled.querySelector('input[name="startAt"]') as HTMLInputElement).value).toBe(
      '2099-01-02T10:00',
    );
    expect(compiled.querySelector('.stay-summary')?.textContent).toContain('Milo, Luna');
    expect(compiled.querySelector('button[mat-flat-button]')).not.toBeNull();
    expect(compiled.querySelector('a[mat-stroked-button]')).not.toBeNull();
  });

  it('blocks closed stays through the existing status rule', () => {
    stayApiService.getStayById.mockReturnValue(of(closedStay));

    createComponent();
    fixture.detectChanges();

    expect(component.stayLoaded()).toBe(false);
    expect(component.error()).toBe(component.text().stays.edit.errors.closedCannotBeModified);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      component.text().stays.edit.errors.closedCannotBeModified,
    );
  });

  it('does not update when the end date is not after the start date', () => {
    createComponent();

    component.startAt.set('2099-01-09T10:00');
    component.endAt.set('2099-01-02T10:00');

    component.submit();
    fixture.detectChanges();

    expect(stayApiService.updateStay).not.toHaveBeenCalled();
    expect(component.error()).toBe(component.text().stays.edit.errors.endAfterStart);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      component.text().stays.edit.errors.endAfterStart,
    );
  });

  it('updates a stay with the current payload shape and returns to stays', () => {
    createComponent();
    stayApiService.updateStay.mockReturnValue(of(stay));

    component.startAt.set('2099-01-02T10:00');
    component.endAt.set('2099-01-09T10:00');
    component.notes.set('  ');

    component.submit();

    expect(stayApiService.updateStay).toHaveBeenCalledWith('stay-1', {
      startAt: '2099-01-02T10:00',
      endAt: '2099-01-09T10:00',
      notes: null,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/stays']);
    expect(component.submitting()).toBe(false);
  });

  it('shows update errors through shared Material error state', () => {
    createComponent();
    stayApiService.updateStay.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: { startAt: 'overlaps another stay' },
            status: 400,
          }),
      ),
    );

    component.startAt.set('2099-01-02T10:00');
    component.endAt.set('2099-01-09T10:00');

    component.submit();
    fixture.detectChanges();

    expect(component.error()).toBe('startAt: overlaps another stay');
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'startAt: overlaps another stay',
    );
  });

  it('preserves values when an administrator cancels and keeps a later update normal', () => {
    createComponent();
    stayApiService.updateStay
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              error: vaccineConflict,
              status: 409,
            }),
        ),
      )
      .mockReturnValueOnce(of(stay));

    component.startAt.set('2099-02-02T10:00');
    component.endAt.set('2099-02-09T10:00');
    component.notes.set('  updated notes  ');

    component.submit();

    expect(matDialog.open).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        data: {
          violations: vaccineConflict.violations,
          canOverride: true,
        },
      }),
    );

    dialogClosed.next(false);

    expect(stayApiService.updateStay).toHaveBeenCalledTimes(1);
    expect(component.startAt()).toBe('2099-02-02T10:00');
    expect(component.endAt()).toBe('2099-02-09T10:00');
    expect(component.notes()).toBe('  updated notes  ');

    component.submit();

    expect(stayApiService.updateStay).toHaveBeenNthCalledWith(2, 'stay-1', {
      startAt: '2099-02-02T10:00',
      endAt: '2099-02-09T10:00',
      notes: 'updated notes',
    });
  });

  it('retries once with the captured update when an administrator continues', () => {
    createComponent();
    stayApiService.updateStay
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              error: vaccineConflict,
              status: 409,
            }),
        ),
      )
      .mockReturnValueOnce(of(stay));

    component.startAt.set('2099-02-02T10:00');
    component.endAt.set('2099-02-09T10:00');
    component.notes.set('updated notes');

    component.submit();
    dialogClosed.next(true);

    expect(stayApiService.updateStay).toHaveBeenNthCalledWith(2, 'stay-1', {
      startAt: '2099-02-02T10:00',
      endAt: '2099-02-09T10:00',
      notes: 'updated notes',
      overrideVaccineConflicts: true,
    });
    expect(stayApiService.updateStay).toHaveBeenCalledTimes(2);
    expect(router.navigate).toHaveBeenCalledWith(['/stays']);
  });

  it('does not retry an update for staff even if the dialog produces a continue result', () => {
    authSessionService.hasRole.mockReturnValue(false);
    createComponent();
    stayApiService.updateStay.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: vaccineConflict,
            status: 409,
          }),
      ),
    );

    component.startAt.set('2099-02-02T10:00');
    component.endAt.set('2099-02-09T10:00');

    component.submit();

    expect(matDialog.open).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        data: {
          violations: vaccineConflict.violations,
          canOverride: false,
        },
      }),
    );

    dialogClosed.next(true);

    expect(stayApiService.updateStay).toHaveBeenCalledTimes(1);
  });

  it('uses the generic error path when the administrator update retry fails', () => {
    createComponent();
    stayApiService.updateStay
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              error: vaccineConflict,
              status: 409,
            }),
        ),
      )
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              error: 'Stay still conflicts',
              status: 409,
            }),
        ),
      );

    component.startAt.set('2099-02-02T10:00');
    component.endAt.set('2099-02-09T10:00');

    component.submit();
    dialogClosed.next(true);

    expect(matDialog.open).toHaveBeenCalledTimes(1);
    expect(component.error()).toBe('Stay still conflicts');
    expect(component.submitting()).toBe(false);
  });
});
