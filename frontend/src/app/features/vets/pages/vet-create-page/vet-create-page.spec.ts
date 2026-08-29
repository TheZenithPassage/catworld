import { HttpErrorResponse } from '@angular/common/http';
import { NgModel } from '@angular/forms';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

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

    expect(compiled.querySelectorAll('mat-form-field')).toHaveLength(5);
    expect(compiled.querySelector('textarea[name="notes"]')).not.toBeNull();
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

  it('creates a vet with the current payload shape and returns to vets', () => {
    vetApiService.createVet.mockReturnValue(of({ id: 'vet-1' }));

    component.name.set('  Dr. Whiskers  ');
    component.address.set('  ');
    component.phoneNumber.set(' 555-3333 ');
    component.registrationNumber.set('  REG-123  ');
    component.notes.set('  first line\n  second line  ');

    component.submit();

    expect(vetApiService.createVet).toHaveBeenCalledWith({
      name: 'Dr. Whiskers',
      address: null,
      phoneNumber: '555-3333',
      registrationNumber: 'REG-123',
      notes: 'first line\n  second line',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/vets']);
    expect(component.submitting()).toBe(false);
  });

  it('shows a localized Material error and does not create for overlong notes', async () => {
    component.name.set('Dr. Whiskers');
    component.notes.set('x'.repeat(10001));
    component.submit();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(vetApiService.createVet).not.toHaveBeenCalled();
    expect(getMaterialErrorText()).toContain(component.text().vets.create.errors.notesTooLong);
  });

  it('normalizes a blank registration number to null in the create payload', () => {
    vetApiService.createVet.mockReturnValue(of({ id: 'vet-1' }));
    component.name.set('Dr. Whiskers');
    component.registrationNumber.set('   ');

    component.submit();

    expect(vetApiService.createVet).toHaveBeenCalledWith(
      expect.objectContaining({ registrationNumber: null }),
    );
  });

  it('shows a localized Material error and does not create for an overlong registration number', async () => {
    fixture.detectChanges();
    setInputValue('name', 'Dr. Whiskers');
    setInputValue('registrationNumber', 'R'.repeat(101));

    await submitRenderedForm();

    expect(vetApiService.createVet).not.toHaveBeenCalled();
    expect(getMaterialErrorText()).toContain(
      component.text().vets.create.errors.registrationNumberTooLong,
    );
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
      ).toEqual([component.text().vets.create.cancel, component.text().vets.create.submit]);
      group.querySelector('button[type="submit"]')?.click();
    }
    expect(submit).toHaveBeenCalledTimes(2);
    component.submitting.set(true);
    component.cancel();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('cancels to standalone and immediate related destinations', () => {
    component.cancel();
    expect(router.navigate).toHaveBeenCalledWith(['/vets']);
    router.navigate.mockClear();
    queryParams = { returnTo: '/cats/new', ownerId: 'owner-1', catReturnTo: '/stays/new' };
    component.cancel();
    expect(router.navigate).toHaveBeenCalledWith(['/cats/new'], {
      queryParams: { ownerId: 'owner-1', returnTo: '/stays/new' },
    });
  });
});
