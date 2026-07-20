import { HttpErrorResponse } from '@angular/common/http';
import { NgModel } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { VetApiService } from '../../services/vet-api.service';
import { VetCreatePage } from './vet-create-page';

describe('VetCreatePage', () => {
  let component: VetCreatePage;
  let fixture: ComponentFixture<VetCreatePage>;
  let queryParams: Record<string, string>;

  const vetApiService = {
    createVet: vi.fn(),
  };

  const router = {
    navigate: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    router.navigate.mockResolvedValue(true);
    queryParams = {};

    await TestBed.configureTestingModule({
      imports: [VetCreatePage],
      providers: [
        provideNoopAnimations(),
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

    fixture = TestBed.createComponent(VetCreatePage);
    component = fixture.componentInstance;
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

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

  it('renders Material vet create fields and submit action', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('mat-form-field')).toHaveLength(3);
    expect(compiled.querySelector('input[name="name"]')).not.toBeNull();
    expect(compiled.querySelector('input[name="phoneNumber"]')).not.toBeNull();
    expect(compiled.querySelector('button[mat-flat-button]')).not.toBeNull();
  });

  it('does not submit when the name is blank', async () => {
    fixture.detectChanges();
    setInputValue('name', '   ');
    await submitRenderedForm();

    expect(vetApiService.createVet).not.toHaveBeenCalled();
    expect(component.nameError()).toBe(component.text().vets.create.errors.nameRequired);
    expect(getMaterialErrorText()).toContain(component.text().vets.create.errors.nameRequired);
    expect(component.error()).toBeNull();
  });

  it('clears rendered page and field errors together when the application language changes', async () => {
    fixture.detectChanges();
    setInputValue('name', '   ');
    await submitRenderedForm();
    component.error.set('Error in the previous language');
    fixture.detectChanges();

    const staleNameError = component.text().vets.create.errors.nameRequired;
    const i18nService = TestBed.inject(I18nService);
    const initialLanguage = i18nService.language();

    expect(component.error()).toBe('Error in the previous language');
    expect(component.nameError()).toBe(staleNameError);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Error in the previous language',
    );
    expect(getMaterialErrorText()).toContain(staleNameError);

    i18nService.toggleLanguage();
    fixture.detectChanges();

    expect(i18nService.language()).not.toBe(initialLanguage);
    expect(component.error()).toBeNull();
    expect(component.nameError()).toBeNull();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('mat-error')).toBeNull();
  });

  it('creates a vet with the current payload shape and returns to vets', () => {
    vetApiService.createVet.mockReturnValue(of({ id: 'vet-1' }));

    component.name.set('  Dr. Whiskers  ');
    component.address.set('  ');
    component.phoneNumber.set(' 555-3333 ');

    component.submit();

    expect(vetApiService.createVet).toHaveBeenCalledWith({
      name: 'Dr. Whiskers',
      address: null,
      phoneNumber: '555-3333',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/vets']);
    expect(component.submitting()).toBe(false);
  });

  it('preserves cat return navigation after vet creation', () => {
    vetApiService.createVet.mockReturnValue(of({ id: 'vet-1' }));
    queryParams = {
      returnTo: '/cats/new',
      ownerId: 'owner-1',
      catReturnTo: '/stays/new',
    };

    component.name.set('Dr. Whiskers');

    component.submit();

    expect(router.navigate).toHaveBeenCalledWith(['/cats/new'], {
      queryParams: {
        vetId: 'vet-1',
        ownerId: 'owner-1',
        returnTo: '/stays/new',
      },
    });
  });

  it('shows backend validation errors through shared Material error state', () => {
    vetApiService.createVet.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: { name: 'already exists' },
            status: 400,
          }),
      ),
    );

    component.name.set('Dr. Whiskers');

    component.submit();
    fixture.detectChanges();

    expect(component.error()).toBe('name: already exists');
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'name: already exists',
    );
  });
});
