import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Vet } from '../../models/vet.model';
import { VetApiService } from '../../services/vet-api.service';
import { VetEditPage } from './vet-edit-page';

describe('VetEditPage', () => {
  let component: VetEditPage;
  let fixture: ComponentFixture<VetEditPage>;
  let routeParams: Record<string, string>;

  const vet: Vet = {
    id: 'vet-1',
    name: 'Dr. Whiskers',
    address: 'Clinic Street 1',
    phoneNumber: '555-3333',
  };

  const vetApiService = {
    getVetById: vi.fn(),
    updateVet: vi.fn(),
  };

  const router = {
    navigate: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    router.navigate.mockResolvedValue(true);
    routeParams = { id: 'vet-1' };
    vetApiService.getVetById.mockReturnValue(of(vet));
    window.scrollTo = vi.fn();

    await TestBed.configureTestingModule({
      imports: [VetEditPage],
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
    fixture = TestBed.createComponent(VetEditPage);
    component = fixture.componentInstance;
  }

  it('loads the vet and renders Material edit fields and actions', async () => {
    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(vetApiService.getVetById).toHaveBeenCalledWith('vet-1');
    expect(compiled.querySelectorAll('mat-form-field')).toHaveLength(3);
    expect((compiled.querySelector('input[name="name"]') as HTMLInputElement).value).toBe(
      'Dr. Whiskers',
    );
    expect(compiled.querySelector('button[mat-flat-button]')).not.toBeNull();
    expect(compiled.querySelector('a[mat-stroked-button]')).not.toBeNull();
  });

  it('does not update when the name is blank', () => {
    createComponent();
    component.name.set('   ');

    component.submit();

    expect(vetApiService.updateVet).not.toHaveBeenCalled();
    expect(component.nameError()).toBe(component.text().vets.edit.errors.nameRequired);
    expect(component.error()).toBeNull();
  });

  it('updates a vet with the current payload shape and returns to vets', () => {
    createComponent();
    vetApiService.updateVet.mockReturnValue(of(vet));

    component.name.set('  Dr. Whiskers  ');
    component.address.set('');
    component.phoneNumber.set(' 555-4444 ');

    component.submit();

    expect(vetApiService.updateVet).toHaveBeenCalledWith('vet-1', {
      name: 'Dr. Whiskers',
      address: null,
      phoneNumber: '555-4444',
    });
    expect(router.navigate).toHaveBeenCalledWith(['/vets']);
    expect(component.submitting()).toBe(false);
  });

  it('shows load errors through shared Material error state', () => {
    vetApiService.getVetById.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 500,
          }),
      ),
    );

    createComponent();
    fixture.detectChanges();

    expect(component.vetLoaded()).toBe(false);
    expect(component.error()).toBe(component.text().vets.edit.errors.loadFailed);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      component.text().vets.edit.errors.loadFailed,
    );
  });

  it('shows update errors through shared Material error state', () => {
    createComponent();
    vetApiService.updateVet.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: 'Vet could not be updated',
            status: 400,
          }),
      ),
    );

    component.name.set('Dr. Whiskers');

    component.submit();
    fixture.detectChanges();

    expect(component.error()).toBe('Vet could not be updated');
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'Vet could not be updated',
    );
  });
});
