import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { Cat } from '../../../cats/models/cat.model';
import { CatApiService } from '../../../cats/services/cat-api.service';
import { Owner } from '../../../owners/models/owner.model';
import { OwnerApiService } from '../../../owners/services/owner-api.service';
import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { StayCreatePage } from './stay-create-page';

describe('StayCreatePage', () => {
  let component: StayCreatePage;
  let fixture: ComponentFixture<StayCreatePage>;
  let queryParams: Record<string, string>;

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
    },
    {
      id: 'owner-2',
      fullName: 'Grace Hopper',
      address: null,
      primaryPhone: '555-2222',
      secondaryPhone: null,
      secondaryPhoneName: null,
      instagram: null,
      facebook: null,
    },
  ];

  const cats: Cat[] = [
    {
      id: 'cat-1',
      name: 'Milo',
      birthDate: '2020-01-02',
      sex: 'MALE',
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
      vetId: null,
      vetName: null,
    },
    {
      id: 'cat-2',
      name: 'Luna',
      birthDate: '2021-03-04',
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
      vetId: null,
      vetName: null,
    },
    {
      id: 'cat-3',
      name: 'Pixel',
      birthDate: '2022-05-06',
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
      ownerId: 'owner-2',
      ownerName: 'Grace Hopper',
      vetId: null,
      vetName: null,
    },
  ];

  const createdStay: Stay = {
    stayId: 'stay-1',
    startAt: '2099-01-02T10:00',
    endAt: '2099-01-09T10:00',
    cancelledAt: null,
    createdAt: '2026-07-02T10:00:00',
    updatedAt: '2026-07-02T10:00:00',
    notes: null,
    catIds: ['cat-1', 'cat-2'],
    ownerId: 'owner-1',
    ownerName: 'Ada Lovelace',
    cats: [
      { catId: 'cat-1', name: 'Milo' },
      { catId: 'cat-2', name: 'Luna' },
    ],
  };

  const ownerApiService = {
    getOwners: vi.fn(),
  };

  const catApiService = {
    getCats: vi.fn(),
  };

  const stayApiService = {
    createStay: vi.fn(),
  };

  const router = {
    navigate: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    router.navigate.mockResolvedValue(true);
    queryParams = {};
    ownerApiService.getOwners.mockReturnValue(of(owners));
    catApiService.getCats.mockReturnValue(of(cats));

    await TestBed.configureTestingModule({
      imports: [StayCreatePage],
      providers: [
        provideNoopAnimations(),
        {
          provide: OwnerApiService,
          useValue: ownerApiService,
        },
        {
          provide: CatApiService,
          useValue: catApiService,
        },
        {
          provide: StayApiService,
          useValue: stayApiService,
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              get queryParamMap() {
                return convertToParamMap(queryParams);
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
    fixture = TestBed.createComponent(StayCreatePage);
    component = fixture.componentInstance;
  }

  it('renders Material stay create fields, owner select, link and submit action', () => {
    createComponent();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('mat-form-field')).toHaveLength(4);
    expect(compiled.querySelectorAll('select[matNativeControl]')).toHaveLength(1);
    expect(compiled.querySelector('input[name="startAt"]')).not.toBeNull();
    expect(compiled.querySelector('input[name="endAt"]')).not.toBeNull();
    expect(compiled.querySelector('textarea[name="notes"]')).not.toBeNull();
    expect(compiled.querySelector('button[mat-flat-button]')).not.toBeNull();
    expect(compiled.querySelector('a[mat-stroked-button]')).not.toBeNull();
  });

  it('preserves owner and cat query-param preselection', () => {
    queryParams = {
      ownerId: 'owner-1',
      catId: 'cat-1',
    };

    createComponent();
    fixture.detectChanges();

    expect(component.selectedOwnerId()).toBe('owner-1');
    expect(component.selectedCatIds()).toEqual(['cat-1']);
    expect(component.filteredCats().map((cat) => cat.id)).toEqual(['cat-1', 'cat-2']);
    expect(fixture.nativeElement.querySelectorAll('mat-checkbox')).toHaveLength(2);
  });

  it('does not create a stay when no cat is selected', () => {
    createComponent();
    component.selectedOwnerId.set('owner-1');
    fixture.detectChanges();

    component.submit();
    fixture.detectChanges();

    expect(stayApiService.createStay).not.toHaveBeenCalled();
    expect(component.error()).toBe(component.text().stays.create.errors.selectAtLeastOneCat);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      component.text().stays.create.errors.selectAtLeastOneCat,
    );
  });

  it('clears its rendered error when the application language changes', () => {
    createComponent();
    component.selectedOwnerId.set('owner-1');
    fixture.detectChanges();

    component.submit();
    fixture.detectChanges();

    const staleError = component.text().stays.create.errors.selectAtLeastOneCat;
    const initialLanguage = TestBed.inject(I18nService).language();

    expect(component.error()).toBe(staleError);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      staleError,
    );

    TestBed.inject(I18nService).toggleLanguage();
    fixture.detectChanges();

    expect(TestBed.inject(I18nService).language()).not.toBe(initialLanguage);
    expect(component.error()).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('creates a stay with the current payload shape and returns to stays', () => {
    createComponent();
    stayApiService.createStay.mockReturnValue(of(createdStay));

    component.selectedOwnerId.set('owner-1');
    component.selectedCatIds.set(['cat-1', 'cat-2']);
    component.startAt.set('2099-01-02T10:00');
    component.endAt.set('2099-01-09T10:00');
    component.notes.set('  needs quiet room  ');

    component.submit();

    expect(stayApiService.createStay).toHaveBeenCalledWith({
      catIds: ['cat-1', 'cat-2'],
      startAt: '2099-01-02T10:00',
      endAt: '2099-01-09T10:00',
      notes: 'needs quiet room',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/stays']);
    expect(component.submitting()).toBe(false);
  });

  it('shows backend validation errors through shared Material error state', () => {
    createComponent();
    stayApiService.createStay.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: { endAt: 'must be after startAt' },
            status: 400,
          }),
      ),
    );

    component.selectedOwnerId.set('owner-1');
    component.selectedCatIds.set(['cat-1']);
    component.startAt.set('2099-01-02T10:00');
    component.endAt.set('2099-01-09T10:00');

    component.submit();
    fixture.detectChanges();

    expect(component.error()).toBe('endAt: must be after startAt');
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'endAt: must be after startAt',
    );
  });
});
