import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { StayEditPage } from './stay-edit-page';

describe('StayEditPage', () => {
  let component: StayEditPage;
  let fixture: ComponentFixture<StayEditPage>;
  let routeParams: Record<string, string>;

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

  beforeEach(async () => {
    vi.resetAllMocks();
    router.navigate.mockResolvedValue(true);
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
});
