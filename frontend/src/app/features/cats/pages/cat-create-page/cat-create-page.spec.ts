import { HttpErrorResponse } from '@angular/common/http';
import { NgModel } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Owner } from '../../../owners/models/owner.model';
import { OwnerApiService } from '../../../owners/services/owner-api.service';
import { Vet } from '../../../vets/models/vet.model';
import { VetApiService } from '../../../vets/services/vet-api.service';
import { Cat } from '../../models/cat.model';
import { CatApiService } from '../../services/cat-api.service';
import { CatCreatePage } from './cat-create-page';
import { CatPhotoInput } from '../../components/cat-photo-input/cat-photo-input';
import { RemoteEntitySelector } from '../../../../shared/entity-lookup/remote-entity-selector';
import { OwnerLookup } from '../../../owners/models/owner.model';
import { VetLookup } from '../../../vets/models/vet.model';

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
      notes: null,
    },
  ];

  const vets: Vet[] = [
    {
      id: 'vet-1',
      name: 'Dr. Vet',
      address: null,
      phoneNumber: null,
      registrationNumber: null,
      notes: null,
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
    notes: null,
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
    searchOwners: vi.fn(),
    getOwnerLookup: vi.fn(),
  };

  const vetApiService = {
    getVets: vi.fn(),
    searchVets: vi.fn(),
    getVetById: vi.fn(),
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
    ownerApiService.getOwnerLookup.mockReturnValue(
      of({ id: 'owner-1', fullName: 'Ada Lovelace', currentCats: [] }),
    );
    vetApiService.getVetById.mockReturnValue(of(vets[0]));

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

    expect(compiled.querySelectorAll('mat-form-field')).toHaveLength(18);
    expect(compiled.querySelector('textarea[name="notes"]')).not.toBeNull();
    expect(compiled.querySelectorAll('select[matNativeControl]')).toHaveLength(1);
    expect(compiled.querySelectorAll('app-remote-entity-selector')).toHaveLength(2);
    expect(ownerApiService.getOwners).not.toHaveBeenCalled();
    expect(vetApiService.getVets).not.toHaveBeenCalled();
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
    fixture.detectChanges();
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
    component.notes.set('  first line\n  second line  ');
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
        notes: 'first line\n  second line',
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

  it('shows a localized Material error and does not create for overlong notes', async () => {
    createComponent();
    fixture.detectChanges();
    component.name.set('Milo');
    component.birthDate.set('2020-01-02');
    component.sex.set('MALE');
    component.notes.set('x'.repeat(10001));
    component.submit();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(catApiService.createCat).not.toHaveBeenCalled();
    expect(getMaterialErrorText()).toContain(component.text().cats.create.errors.notesTooLong);
  });

  it('preserves stay return query params after cat creation', () => {
    queryParams = {
      returnTo: '/stays/new',
      ownerId: 'owner-1',
      vetId: 'vet-1',
    };
    createComponent();
    fixture.detectChanges();
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

  it('keeps return-query resolution field-local and ignores a late owner response after typing', () => {
    const ownerResolution = new Subject<OwnerLookup>();
    queryParams = { ownerId: 'owner-1', vetId: 'vet-1' };
    ownerApiService.getOwnerLookup.mockReturnValue(ownerResolution);
    createComponent();
    fixture.detectChanges();
    const [ownerSelector, vetSelector] = fixture.debugElement
      .queryAll(By.directive(RemoteEntitySelector))
      .map((element) => element.componentInstance) as [
      RemoteEntitySelector<OwnerLookup>,
      RemoteEntitySelector<VetLookup>,
    ];

    ownerSelector.inputChanged({ target: { value: 'Later choice' } } as unknown as Event);
    ownerResolution.next({ id: 'owner-1', fullName: 'Ada Lovelace', currentCats: [] });

    expect(component.ownerId()).toBe('');
    expect(ownerSelector.query()).toBe('Later choice');
    expect(vetSelector.selectedId()).toBe('vet-1');
  });

  it('blocks unresolved owner and whitespace-only vet input without changing form state', () => {
    createComponent();
    fixture.detectChanges();
    const [ownerSelector, vetSelector] = fixture.debugElement
      .queryAll(By.directive(RemoteEntitySelector))
      .map((element) => element.componentInstance) as [
      RemoteEntitySelector<OwnerLookup>,
      RemoteEntitySelector<VetLookup>,
    ];
    component.name.set('Milo');
    component.birthDate.set('2020-01-02');
    component.sex.set('MALE');
    ownerSelector.inputChanged({ target: { value: 'Ada' } } as unknown as Event);
    vetSelector.inputChanged({ target: { value: '   ' } } as unknown as Event);

    component.submit();
    fixture.detectChanges();

    expect(catApiService.createCat).not.toHaveBeenCalled();
    expect(component.name()).toBe('Milo');
    expect(fixture.nativeElement.querySelectorAll('.validation')).toHaveLength(0);
  });

  it('creates without a photo after rejecting an invalid candidate and preserves fields', () => {
    createComponent();
    fixture.detectChanges();
    const photoInput = fixture.debugElement.query(By.directive(CatPhotoInput))
      .componentInstance as CatPhotoInput;
    catApiService.createCat.mockReturnValue(of(createdCat));
    component.name.set('Still Milo');
    component.birthDate.set('2020-01-02');
    component.sex.set('MALE');
    component.ownerId.set('owner-1');
    photoInput.select(fileChange(new File(['bad'], 'cat.gif', { type: 'image/gif' })));

    expect(component.name()).toBe('Still Milo');
    expect(photoInput.mutation()).toEqual({ photo: null, removePhoto: false });
    expect(photoInput.selectionError()).toBe(
      component.text().cats.photo.errors.localUnsupportedFormat,
    );
    expect(photoInput.valid()).toBe(true);

    component.submit();

    expect(catApiService.createCat).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Still Milo' }),
      null,
    );
    expect(component.name()).toBe('Still Milo');
  });

  it('maps every backend photo code, retains provisional state, and never retries', () => {
    createComponent();
    fixture.detectChanges();
    const photoInput = fixture.debugElement.query(By.directive(CatPhotoInput))
      .componentInstance as CatPhotoInput;
    const photo = new File(['photo'], 'cat.jpg', { type: 'image/jpeg' });
    photoInput.select(fileChange(photo));
    component.name.set('Milo');
    component.birthDate.set('2020-01-02');
    component.sex.set('MALE');
    component.ownerId.set('owner-1');
    const cases = [
      ['CAT_PHOTO_FILE_TOO_LARGE', component.text().cats.photo.errors.fileTooLarge],
      ['CAT_PHOTO_UNSUPPORTED_FORMAT', component.text().cats.photo.errors.unsupportedFormat],
      ['CAT_PHOTO_DIMENSIONS_TOO_LARGE', component.text().cats.photo.errors.dimensionsTooLarge],
      ['CAT_PHOTO_UNDECODABLE', component.text().cats.photo.errors.undecodable],
      ['CAT_PHOTO_INTENT_CONFLICT', component.text().cats.photo.errors.intentConflict],
    ] as const;

    for (const [code, message] of cases) {
      const callsBefore = catApiService.createCat.mock.calls.length;
      catApiService.createCat.mockReturnValue(
        throwError(() => new HttpErrorResponse({ error: { code }, status: 400 })),
      );
      component.submit();
      expect(component.error()).toBe(message);
      expect(catApiService.createCat).toHaveBeenCalledTimes(callsBefore + 1);
      expect(component.name()).toBe('Milo');
      expect(photoInput.mutation().photo).toBe(photo);
      expect(photoInput.previewUrl()).not.toBeNull();
    }
  });

  it('cancels back to the originating stay with owner context and clears photo state', () => {
    queryParams = { returnTo: '/stays/new', ownerId: 'owner-1' };
    createComponent();
    fixture.detectChanges();
    const photoInput = fixture.debugElement.query(By.directive(CatPhotoInput))
      .componentInstance as CatPhotoInput;
    photoInput.select(fileChange(new File(['photo'], 'cat.jpg', { type: 'image/jpeg' })));

    component.cancel();

    expect(catApiService.createCat).not.toHaveBeenCalled();
    expect(photoInput.mutation().photo).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/stays/new'], {
      queryParams: { ownerId: 'owner-1' },
    });

    router.navigate.mockClear();
    queryParams = {};
    createComponent();
    component.cancel();
    expect(router.navigate).toHaveBeenCalledWith(['/cats']);
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

  it('renders equivalent header and bottom actions with shared submission state', () => {
    createComponent();
    fixture.detectChanges();
    const submit = vi.spyOn(component, 'submit').mockImplementation(() => undefined);
    const groups = fixture.nativeElement.querySelectorAll(
      '.create-page-actions--header, .create-page-actions--bottom',
    );
    expect(groups).toHaveLength(2);
    for (const group of groups) {
      expect(
        [...group.querySelectorAll('button')].map((button) => button.textContent?.trim()),
      ).toEqual([component.text().cats.create.cancel, component.text().cats.create.submit]);
      group.querySelector('button[type="submit"]')?.click();
    }
    expect(submit).toHaveBeenCalledTimes(2);
    component.submitting.set(true);
    component.cancel();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});

function fileChange(file: File): Event {
  return { target: { files: [file], value: 'selected' } } as unknown as Event;
}
