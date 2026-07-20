import { HttpErrorResponse } from '@angular/common/http';
import { NgModel } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { OwnerApiService } from '../../services/owner-api.service';
import { OwnerCreatePage } from './owner-create-page';

describe('OwnerCreatePage', () => {
  let component: OwnerCreatePage;
  let fixture: ComponentFixture<OwnerCreatePage>;
  let queryParams: Record<string, string>;

  const ownerApiService = {
    createOwner: vi.fn(),
  };

  const router = {
    navigate: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    router.navigate.mockResolvedValue(true);
    queryParams = {};

    await TestBed.configureTestingModule({
      imports: [OwnerCreatePage],
      providers: [
        provideNoopAnimations(),
        {
          provide: OwnerApiService,
          useValue: ownerApiService,
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

    fixture = TestBed.createComponent(OwnerCreatePage);
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

  it('renders Material owner create fields and submit action', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('mat-form-field')).toHaveLength(7);
    expect(compiled.querySelector('input[name="fullName"]')).not.toBeNull();
    expect(compiled.querySelector('input[name="primaryPhone"]')).not.toBeNull();
    expect(compiled.querySelector('button[mat-flat-button]')).not.toBeNull();
  });

  it('does not submit when the full name is blank', async () => {
    fixture.detectChanges();
    setInputValue('fullName', '   ');
    setInputValue('primaryPhone', '555-1111');
    await submitRenderedForm();

    expect(ownerApiService.createOwner).not.toHaveBeenCalled();
    expect(component.fullNameError()).toBe(component.text().owners.create.errors.fullNameRequired);
    expect(getMaterialErrorText()).toContain(
      component.text().owners.create.errors.fullNameRequired,
    );
    expect(component.error()).toBeNull();
  });

  it('does not submit when the primary phone is blank', async () => {
    fixture.detectChanges();
    setInputValue('fullName', 'Ada Lovelace');
    setInputValue('primaryPhone', '   ');
    await submitRenderedForm();

    expect(ownerApiService.createOwner).not.toHaveBeenCalled();
    expect(component.primaryPhoneError()).toBe(
      component.text().owners.create.errors.primaryPhoneRequired,
    );
    expect(getMaterialErrorText()).toContain(
      component.text().owners.create.errors.primaryPhoneRequired,
    );
    expect(component.error()).toBeNull();
  });

  it('creates an owner with the current payload shape and returns to owners', () => {
    ownerApiService.createOwner.mockReturnValue(of({ id: 'owner-1' }));

    component.fullName.set('  Ada Lovelace  ');
    component.primaryPhone.set(' 555-1111 ');
    component.address.set('  ');
    component.secondaryPhone.set('555-2222');
    component.secondaryPhoneName.set('');
    component.instagram.set(' catworld ');
    component.facebook.set('  ');

    component.submit();

    expect(ownerApiService.createOwner).toHaveBeenCalledWith({
      fullName: 'Ada Lovelace',
      address: null,
      primaryPhone: '555-1111',
      secondaryPhone: '555-2222',
      secondaryPhoneName: null,
      instagram: 'catworld',
      facebook: null,
    });
    expect(router.navigate).toHaveBeenCalledWith(['/owners']);
    expect(component.submitting()).toBe(false);
  });

  it('preserves cat return navigation after owner creation', () => {
    ownerApiService.createOwner.mockReturnValue(of({ id: 'owner-1' }));
    queryParams = {
      returnTo: '/cats/new',
      vetId: 'vet-1',
      catReturnTo: '/stays/new',
    };

    component.fullName.set('Ada Lovelace');
    component.primaryPhone.set('555-1111');

    component.submit();

    expect(router.navigate).toHaveBeenCalledWith(['/cats/new'], {
      queryParams: {
        ownerId: 'owner-1',
        vetId: 'vet-1',
        returnTo: '/stays/new',
      },
    });
  });

  it('shows backend validation errors through shared Material error state', () => {
    ownerApiService.createOwner.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: { fullName: 'already exists' },
            status: 400,
          }),
      ),
    );

    component.fullName.set('Ada Lovelace');
    component.primaryPhone.set('555-1111');

    component.submit();
    fixture.detectChanges();

    expect(component.error()).toBe('fullName: already exists');
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'fullName: already exists',
    );
  });

  it('clears every rendered error on a distinct language change without resetting form state', async () => {
    component.address.set('1 Cat Lane');
    component.secondaryPhone.set('555-2222');
    fixture.detectChanges();
    await submitRenderedForm();

    component.error.set('owner create page error');
    component.fullNameError.set('owner create full name error');
    component.primaryPhoneError.set('owner create primary phone error');
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    const renderedFieldErrors = getMaterialErrorText();

    expect(compiled.querySelector('[role="alert"]')?.textContent).toContain(
      'owner create page error',
    );
    expect(renderedFieldErrors).toContain('owner create full name error');
    expect(renderedFieldErrors).toContain('owner create primary phone error');

    const i18nService = TestBed.inject(I18nService);
    i18nService.language.set(i18nService.language() === 'es' ? 'en' : 'es');
    fixture.detectChanges();

    expect([component.error(), component.fullNameError(), component.primaryPhoneError()]).toEqual([
      null,
      null,
      null,
    ]);
    expect(compiled.querySelector('[role="alert"]')).toBeNull();
    expect(getMaterialErrorText()).toBe('');
    expect(component.address()).toBe('1 Cat Lane');
    expect(component.secondaryPhone()).toBe('555-2222');
    expect((compiled.querySelector('input[name="address"]') as HTMLInputElement).value).toBe(
      '1 Cat Lane',
    );
    expect(component.submitting()).toBe(false);
    expect(ownerApiService.createOwner).not.toHaveBeenCalled();
  });
});
