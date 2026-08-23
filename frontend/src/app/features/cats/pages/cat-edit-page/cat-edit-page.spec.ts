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
import { CatEditor } from '../../components/cat-editor/cat-editor';

describe('CatEditor', () => {
  let component: CatEditor;
  let fixture: ComponentFixture<CatEditor>;
  let routeParams: Record<string, string>;

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

  const cat: Cat = {
    id: 'cat-1',
    name: 'Milo',
    birthDate: '2020-01-02',
    sex: 'MALE',
    breed: 'Tabby',
    coat: null,
    color: 'Orange',
    foodBrand: null,
    litterBrand: null,
    personality: 'Friendly',
    lastInternalDewormerName: null,
    lastInternalDewormingDate: null,
    lastExternalDewormerName: null,
    lastExternalDewormingDate: null,
    lastTripleFelineDate: '2025-02-03',
    lastRabiesDate: null,
    ownerId: 'owner-1',
    ownerName: 'Ada Lovelace',
    vetId: 'vet-1',
    vetName: 'Dr. Vet',
  };

  const catApiService = {
    getCatById: vi.fn(),
    updateCat: vi.fn(),
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
    routeParams = { id: 'cat-1' };
    catApiService.getCatById.mockReturnValue(of(cat));
    ownerApiService.getOwners.mockReturnValue(of(owners));
    vetApiService.getVets.mockReturnValue(of(vets));
    window.scrollTo = vi.fn();

    await TestBed.configureTestingModule({
      imports: [CatEditor],
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
    fixture = TestBed.createComponent(CatEditor);
    fixture.componentRef.setInput('entityId', routeParams['id'] ?? '');
    fixture.componentRef.setInput('routed', true);
    component = fixture.componentInstance;
    fixture.detectChanges();
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

  it('loads the cat and renders Material edit fields and actions', async () => {
    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(catApiService.getCatById).toHaveBeenCalledWith('cat-1');
    expect(compiled.querySelectorAll('mat-form-field')).toHaveLength(17);
    expect(compiled.querySelectorAll('select[matNativeControl]')).toHaveLength(3);
    expect((compiled.querySelector('input[name="name"]') as HTMLInputElement).value).toBe('Milo');
    expect(compiled.querySelector('button[mat-flat-button]')).not.toBeNull();
    expect(compiled.querySelector('a[mat-stroked-button]')).not.toBeNull();
  });

  it('does not update when the name is blank', async () => {
    createComponent();
    fixture.detectChanges();
    setInputValue('name', '   ');
    await submitRenderedForm();

    expect(catApiService.updateCat).not.toHaveBeenCalled();
    expect(component.nameError()).toBe(component.text().cats.edit.errors.nameRequired);
    expect(getMaterialErrorText()).toContain(component.text().cats.edit.errors.nameRequired);
    expect(component.error()).toBeNull();
  });

  it('updates a cat with the current payload shape and emits the authoritative result', () => {
    createComponent();
    catApiService.updateCat.mockReturnValue(of(cat));
    const saved = vi.fn();
    component.saved.subscribe(saved);

    component.name.set('  Milo  ');
    component.birthDate.set('2020-01-02');
    component.sex.set('MALE');
    component.ownerId.set('owner-1');
    component.vetId.set('');
    component.breed.set('');
    component.coat.set('short');
    component.color.set(' orange ');
    component.foodBrand.set('  ');
    component.litterBrand.set(' pine ');
    component.personality.set('');
    component.lastInternalDewormerName.set(' pill ');
    component.lastInternalDewormingDate.set('');
    component.lastExternalDewormerName.set('');
    component.lastExternalDewormingDate.set('2025-01-01');
    component.lastTripleFelineDate.set('2025-02-03');
    component.lastRabiesDate.set('');

    component.submit();

    expect(catApiService.updateCat).toHaveBeenCalledWith('cat-1', {
      name: 'Milo',
      birthDate: '2020-01-02',
      sex: 'MALE',
      breed: null,
      coat: 'short',
      color: 'orange',
      foodBrand: null,
      litterBrand: 'pine',
      personality: null,
      lastInternalDewormerName: 'pill',
      lastInternalDewormingDate: null,
      lastExternalDewormerName: null,
      lastExternalDewormingDate: '2025-01-01',
      lastTripleFelineDate: '2025-02-03',
      lastRabiesDate: null,
      ownerId: 'owner-1',
      vetId: null,
    });
    expect(saved).toHaveBeenCalledWith(cat);
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.submitting()).toBe(false);
  });

  it('shows load errors through shared Material error state', () => {
    catApiService.getCatById.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
          }),
      ),
    );

    createComponent();
    fixture.detectChanges();

    expect(component.catLoaded()).toBe(false);
    expect(component.error()).toBe(component.text().cats.edit.errors.loadFormDataFailed);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      component.text().cats.edit.errors.loadFormDataFailed,
    );
  });

  it('shows update errors through shared Material error state', () => {
    createComponent();
    catApiService.updateCat.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: { ownerId: 'raw backend validation text' },
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

    expect(component.error()).toBe(component.text().cats.edit.errors.ownerRequired);
    expect(component.name()).toBe('Milo');
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      component.text().cats.edit.errors.ownerRequired,
    );
  });
});
