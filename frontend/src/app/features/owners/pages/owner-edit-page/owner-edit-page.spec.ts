import { HttpErrorResponse } from '@angular/common/http';
import { NgModel } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Owner } from '../../models/owner.model';
import { OwnerApiService } from '../../services/owner-api.service';
import { OwnerEditor } from '../../components/owner-editor/owner-editor';

describe('OwnerEditor', () => {
  let component: OwnerEditor;
  let fixture: ComponentFixture<OwnerEditor>;
  let routeParams: Record<string, string>;

  const owner: Owner = {
    id: 'owner-1',
    fullName: 'Ada Lovelace',
    address: 'Main Street 1',
    primaryPhone: '555-1111',
    secondaryPhone: null,
    secondaryPhoneName: null,
    instagram: null,
    facebook: 'catworld',
  };

  const ownerApiService = {
    getOwnerById: vi.fn(),
    updateOwner: vi.fn(),
  };

  const router = {
    navigate: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    router.navigate.mockResolvedValue(true);
    routeParams = { id: 'owner-1' };
    ownerApiService.getOwnerById.mockReturnValue(of(owner));
    window.scrollTo = vi.fn();

    await TestBed.configureTestingModule({
      imports: [OwnerEditor],
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
    fixture = TestBed.createComponent(OwnerEditor);
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

  it('loads the owner and renders Material edit fields and actions', async () => {
    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(ownerApiService.getOwnerById).toHaveBeenCalledWith('owner-1');
    expect(compiled.querySelectorAll('mat-form-field')).toHaveLength(7);
    expect((compiled.querySelector('input[name="fullName"]') as HTMLInputElement).value).toBe(
      'Ada Lovelace',
    );
    expect(compiled.querySelector('button[mat-flat-button]')).not.toBeNull();
    expect(compiled.querySelector('a[mat-stroked-button]')).not.toBeNull();
  });

  it('does not update when the full name is blank', async () => {
    createComponent();
    fixture.detectChanges();
    setInputValue('fullName', '   ');
    setInputValue('primaryPhone', '555-1111');
    await submitRenderedForm();

    expect(ownerApiService.updateOwner).not.toHaveBeenCalled();
    expect(component.fullNameError()).toBe(component.text().owners.edit.errors.fullNameRequired);
    expect(getMaterialErrorText()).toContain(component.text().owners.edit.errors.fullNameRequired);
    expect(component.error()).toBeNull();
  });

  it('does not update when the primary phone is blank', async () => {
    createComponent();
    fixture.detectChanges();
    setInputValue('fullName', 'Ada Lovelace');
    setInputValue('primaryPhone', '   ');
    await submitRenderedForm();

    expect(ownerApiService.updateOwner).not.toHaveBeenCalled();
    expect(component.primaryPhoneError()).toBe(
      component.text().owners.edit.errors.primaryPhoneRequired,
    );
    expect(getMaterialErrorText()).toContain(
      component.text().owners.edit.errors.primaryPhoneRequired,
    );
    expect(component.error()).toBeNull();
  });

  it('updates an owner with the current payload shape and emits the authoritative result', () => {
    createComponent();
    ownerApiService.updateOwner.mockReturnValue(of(owner));
    const saved = vi.fn();
    component.saved.subscribe(saved);

    component.fullName.set('  Ada Lovelace  ');
    component.primaryPhone.set(' 555-1111 ');
    component.address.set('');
    component.secondaryPhone.set('555-2222');
    component.secondaryPhoneName.set('  ');
    component.instagram.set(' catworld ');
    component.facebook.set('');

    component.submit();

    expect(ownerApiService.updateOwner).toHaveBeenCalledWith('owner-1', {
      fullName: 'Ada Lovelace',
      address: null,
      primaryPhone: '555-1111',
      secondaryPhone: '555-2222',
      secondaryPhoneName: null,
      instagram: 'catworld',
      facebook: null,
    });
    expect(saved).toHaveBeenCalledWith(owner);
    expect(router.navigate).not.toHaveBeenCalled();
    expect(component.submitting()).toBe(false);
  });

  it('shows load errors through shared Material error state', () => {
    ownerApiService.getOwnerById.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
          }),
      ),
    );

    createComponent();
    fixture.detectChanges();

    expect(component.ownerLoaded()).toBe(false);
    expect(component.error()).toBe(component.text().owners.edit.errors.loadFailed);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      component.text().owners.edit.errors.loadFailed,
    );
  });

  it('shows update errors through shared Material error state', () => {
    createComponent();
    ownerApiService.updateOwner.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: 'Owner could not be updated',
            status: 400,
          }),
      ),
    );

    component.fullName.set('Ada Lovelace');
    component.primaryPhone.set('555-1111');

    component.submit();
    fixture.detectChanges();

    expect(component.error()).toBe('Owner could not be updated');
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Owner could not be updated',
    );
  });
});
