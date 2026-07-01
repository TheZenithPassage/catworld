import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

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

  it('renders Material owner create fields and submit action', () => {
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('mat-form-field')).toHaveLength(7);
    expect(compiled.querySelector('input[name="fullName"]')).not.toBeNull();
    expect(compiled.querySelector('input[name="primaryPhone"]')).not.toBeNull();
    expect(compiled.querySelector('button[mat-flat-button]')).not.toBeNull();
  });

  it('does not submit when the full name is blank', () => {
    component.fullName.set('   ');
    component.primaryPhone.set('555-1111');

    component.submit();

    expect(ownerApiService.createOwner).not.toHaveBeenCalled();
    expect(component.fullNameError()).toBe(component.text().owners.create.errors.fullNameRequired);
    expect(component.error()).toBeNull();
  });

  it('does not submit when the primary phone is blank', () => {
    component.fullName.set('Ada Lovelace');
    component.primaryPhone.set('   ');

    component.submit();

    expect(ownerApiService.createOwner).not.toHaveBeenCalled();
    expect(component.primaryPhoneError()).toBe(
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
});
