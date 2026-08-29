import { HttpErrorResponse } from '@angular/common/http';
import { NgModel } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, DefaultUrlSerializer, Router } from '@angular/router';
import { EMPTY, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { OwnerApiService } from '../../services/owner-api.service';
import { OwnerCreatePage } from './owner-create-page';
import { CreationFlowService } from '../../../../core/creation-flow/creation-flow.service';

describe('OwnerCreatePage', () => {
  let component: OwnerCreatePage;
  let fixture: ComponentFixture<OwnerCreatePage>;
  let queryParams: Record<string, string>;

  const ownerApiService = {
    createOwner: vi.fn(),
  };

  const router = {
    navigate: vi.fn(),
    events: EMPTY,
    parseUrl: (url: string) => new DefaultUrlSerializer().parse(url),
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

    expect(compiled.querySelectorAll('mat-form-field')).toHaveLength(8);
    expect(compiled.querySelector('textarea[name="notes"]')).not.toBeNull();
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
    component.notes.set('  first line\n  second line  ');

    component.submit();

    expect(ownerApiService.createOwner).toHaveBeenCalledWith({
      fullName: 'Ada Lovelace',
      address: null,
      primaryPhone: '555-1111',
      secondaryPhone: '555-2222',
      secondaryPhoneName: null,
      instagram: 'catworld',
      facebook: null,
      notes: 'first line\n  second line',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/owners']);
    expect(component.submitting()).toBe(false);
  });

  it('shows a localized Material error and does not create for overlong notes', async () => {
    component.fullName.set('Ada Lovelace');
    component.primaryPhone.set('555-1111');
    component.notes.set('x'.repeat(10001));
    component.submit();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(ownerApiService.createOwner).not.toHaveBeenCalled();
    expect(getMaterialErrorText()).toContain(component.text().owners.create.errors.notesTooLong);
  });

  it('shows and clears the notes boundary error immediately without creating', async () => {
    component.updateNotes('x'.repeat(10000));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(getMaterialErrorText()).not.toContain(
      component.text().owners.create.errors.notesTooLong,
    );

    component.updateNotes('x'.repeat(10001));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(getMaterialErrorText()).toContain(component.text().owners.create.errors.notesTooLong);

    component.updateNotes('x'.repeat(10000));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(getMaterialErrorText()).not.toContain(
      component.text().owners.create.errors.notesTooLong,
    );
    expect(ownerApiService.createOwner).not.toHaveBeenCalled();
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

  it('propagates an outer creation flow through Cat success and cancel returns', () => {
    const flowId = TestBed.inject(CreationFlowService).start('stay');
    ownerApiService.createOwner.mockReturnValue(of({ id: 'owner-1' }));
    queryParams = {
      returnTo: '/cats/new',
      catReturnTo: '/stays/new',
      creationFlowId: flowId,
    };
    component.fullName.set('Ada Lovelace');
    component.primaryPhone.set('555-1111');

    component.submit();

    expect(router.navigate).toHaveBeenLastCalledWith(['/cats/new'], {
      queryParams: {
        ownerId: 'owner-1',
        returnTo: '/stays/new',
        creationFlowId: flowId,
      },
    });

    router.navigate.mockClear();
    component.cancel();
    expect(router.navigate).toHaveBeenLastCalledWith(['/cats/new'], {
      queryParams: {
        returnTo: '/stays/new',
        creationFlowId: flowId,
      },
    });
  });

  it('propagates a direct Stay flow through Owner success and cancel returns', () => {
    const flowId = TestBed.inject(CreationFlowService).start('stay');
    ownerApiService.createOwner.mockReturnValue(of({ id: 'owner-1' }));
    queryParams = { returnTo: '/stays/new', creationFlowId: flowId };
    component.fullName.set('Ada Lovelace');
    component.primaryPhone.set('555-1111');

    component.submit();
    expect(router.navigate).toHaveBeenLastCalledWith(['/stays/new'], {
      queryParams: { ownerId: 'owner-1', creationFlowId: flowId },
    });

    router.navigate.mockClear();
    component.cancel();
    expect(router.navigate).toHaveBeenLastCalledWith(['/stays/new'], {
      queryParams: { creationFlowId: flowId },
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

  it('renders equivalent header and bottom actions through one submit path', () => {
    fixture.detectChanges();
    const submit = vi.spyOn(component, 'submit').mockImplementation(() => undefined);
    const groups = fixture.nativeElement.querySelectorAll(
      '.create-page-actions--header, .create-page-actions--bottom',
    );
    expect(groups).toHaveLength(2);
    for (const group of groups) {
      expect(
        [...group.querySelectorAll('button')].map((button) => button.textContent?.trim()),
      ).toEqual([component.text().owners.create.cancel, component.text().owners.create.submit]);
      group.querySelector('button[type="submit"]')?.click();
    }
    expect(submit).toHaveBeenCalledTimes(2);
    component.submitting.set(true);
    component.cancel();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('cancels to standalone and immediate related destinations', () => {
    component.cancel();
    expect(router.navigate).toHaveBeenCalledWith(['/owners']);
    router.navigate.mockClear();
    queryParams = { returnTo: '/cats/new', vetId: 'vet-1', catReturnTo: '/stays/new' };
    component.cancel();
    expect(router.navigate).toHaveBeenCalledWith(['/cats/new'], {
      queryParams: { vetId: 'vet-1', returnTo: '/stays/new' },
    });
    router.navigate.mockClear();
    queryParams = { returnTo: '/stays/new' };
    component.cancel();
    expect(router.navigate).toHaveBeenCalledWith(['/stays/new']);
  });
});
