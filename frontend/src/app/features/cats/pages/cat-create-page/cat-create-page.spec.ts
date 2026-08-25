import { HttpErrorResponse } from '@angular/common/http';
import { NgModel } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Owner } from '../../../owners/models/owner.model';
import { OwnerApiService } from '../../../owners/services/owner-api.service';
import { Vet } from '../../../vets/models/vet.model';
import { VetApiService } from '../../../vets/services/vet-api.service';
import { Cat } from '../../models/cat.model';
import { CatApiService } from '../../services/cat-api.service';
import { CatCreatePage } from './cat-create-page';

describe('CatCreatePage', () => {
  let component: CatCreatePage;
  let fixture: ComponentFixture<CatCreatePage>;
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
  ];

  const vets: Vet[] = [
    {
      id: 'vet-1',
      name: 'Dr. Vet',
      address: null,
      phoneNumber: null,
    },
  ];

  const createdCat: Cat = {
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
    vetId: 'vet-1',
    vetName: 'Dr. Vet',
    hasPhoto: false,
  };

  const catApiService = {
    createCat: vi.fn(),
  };

  const ownerApiService = {
    getOwners: vi.fn(),
  };

  const vetApiService = {
    getVets: vi.fn(),
  };

  const router = {
    navigate: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    router.navigate.mockResolvedValue(true);
    queryParams = {};
    ownerApiService.getOwners.mockReturnValue(of(owners));
    vetApiService.getVets.mockReturnValue(of(vets));

    await TestBed.configureTestingModule({
      imports: [CatCreatePage],
      providers: [
        provideNoopAnimations(),
        {
          provide: CatApiService,
          useValue: catApiService,
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
    fixture = TestBed.createComponent(CatCreatePage);
    component = fixture.componentInstance;
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

  it('renders Material cat create fields, selects, links and submit action', () => {
    createComponent();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('mat-form-field')).toHaveLength(17);
    expect(compiled.querySelectorAll('select[matNativeControl]')).toHaveLength(3);
    expect(compiled.querySelector('input[name="birthDate"]')).not.toBeNull();
    expect(compiled.querySelector('textarea[name="personality"]')).not.toBeNull();
    expect(compiled.querySelector('button[mat-flat-button]')).not.toBeNull();
    expect(compiled.querySelectorAll('a[mat-stroked-button]')).toHaveLength(2);
  });

  it('does not create a cat when the name is blank', async () => {
    createComponent();
    fixture.detectChanges();
    setInputValue('name', '   ');
    await submitRenderedForm();

    expect(catApiService.createCat).not.toHaveBeenCalled();
    expect(component.nameError()).toBe(component.text().cats.create.errors.nameRequired);
    expect(getMaterialErrorText()).toContain(component.text().cats.create.errors.nameRequired);
    expect(component.error()).toBeNull();
  });

  it('creates a cat with the current payload shape and returns to cats', () => {
    createComponent();
    catApiService.createCat.mockReturnValue(of(createdCat));

    component.name.set('  Milo  ');
    component.birthDate.set('2020-01-02');
    component.sex.set('MALE');
    component.ownerId.set('owner-1');
    component.vetId.set('vet-1');
    component.breed.set('  ');
    component.coat.set('short');
    component.color.set('');
    component.foodBrand.set(' chicken ');
    component.litterBrand.set('  ');
    component.personality.set(' friendly ');
    component.lastInternalDewormerName.set('');
    component.lastInternalDewormingDate.set('2025-01-01');
    component.lastExternalDewormerName.set(' topical ');
    component.lastExternalDewormingDate.set('');
    component.lastTripleFelineDate.set('2025-02-03');
    component.lastRabiesDate.set('');

    component.submit();

    expect(catApiService.createCat).toHaveBeenCalledWith(
      {
        name: 'Milo',
        birthDate: '2020-01-02',
        sex: 'MALE',
        breed: null,
        coat: 'short',
        color: null,
        foodBrand: 'chicken',
        litterBrand: null,
        personality: 'friendly',
        lastInternalDewormerName: null,
        lastInternalDewormingDate: '2025-01-01',
        lastExternalDewormerName: 'topical',
        lastExternalDewormingDate: null,
        lastTripleFelineDate: '2025-02-03',
        lastRabiesDate: null,
        ownerId: 'owner-1',
        vetId: 'vet-1',
      },
      null,
    );
    expect(router.navigate).toHaveBeenCalledWith(['/cats']);
    expect(component.submitting()).toBe(false);
  });

  it('preserves stay return query params after cat creation', () => {
    queryParams = {
      returnTo: '/stays/new',
      ownerId: 'owner-1',
      vetId: 'vet-1',
    };
    createComponent();
    catApiService.createCat.mockReturnValue(of(createdCat));

    expect(component.ownerId()).toBe('owner-1');
    expect(component.vetId()).toBe('vet-1');
    expect(component.getCreateOwnerQueryParams()).toEqual({
      returnTo: '/cats/new',
      vetId: 'vet-1',
      catReturnTo: '/stays/new',
    });
    expect(component.getCreateVetQueryParams()).toEqual({
      returnTo: '/cats/new',
      ownerId: 'owner-1',
      catReturnTo: '/stays/new',
    });

    component.name.set('Milo');
    component.birthDate.set('2020-01-02');
    component.sex.set('MALE');

    component.submit();

    expect(router.navigate).toHaveBeenCalledWith(['/stays/new'], {
      queryParams: { ownerId: 'owner-1', catId: 'cat-1' },
    });
  });

  it('shows backend validation errors through shared Material error state', () => {
    createComponent();
    catApiService.createCat.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: { name: 'already exists' },
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

    expect(component.error()).toBe('name: already exists');
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'name: already exists',
    );
  });
});
