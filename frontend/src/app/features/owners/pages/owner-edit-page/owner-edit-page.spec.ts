import { HttpErrorResponse } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { Owner } from '../../models/owner.model';
import { OwnerApiService } from '../../services/owner-api.service';
import { OwnerEditPage } from './owner-edit-page';

describe('OwnerEditPage', () => {
  let component: OwnerEditPage;
  let fixture: ComponentFixture<OwnerEditPage>;
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
      imports: [OwnerEditPage],
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
    fixture = TestBed.createComponent(OwnerEditPage);
    component = fixture.componentInstance;
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

  it('does not update when the full name is blank', () => {
    createComponent();
    component.fullName.set('   ');
    component.primaryPhone.set('555-1111');

    component.submit();

    expect(ownerApiService.updateOwner).not.toHaveBeenCalled();
    expect(component.fullNameError()).toBe(component.text().owners.edit.errors.fullNameRequired);
    expect(component.error()).toBeNull();
  });

  it('updates an owner with the current payload shape and returns to owners', () => {
    createComponent();
    ownerApiService.updateOwner.mockReturnValue(of(owner));

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
    expect(router.navigate).toHaveBeenCalledWith(['/owners']);
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
