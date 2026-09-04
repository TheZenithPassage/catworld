import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { By } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject, throwError } from 'rxjs';
import { vi } from 'vitest';
import { OwnerEditor } from '../../features/owners/components/owner-editor/owner-editor';
import { Owner } from '../../features/owners/models/owner.model';
import { OwnerApiService } from '../../features/owners/services/owner-api.service';
import { CatEditor } from '../../features/cats/components/cat-editor/cat-editor';
import { Cat } from '../../features/cats/models/cat.model';
import { CatApiService } from '../../features/cats/services/cat-api.service';
import { VetEditor } from '../../features/vets/components/vet-editor/vet-editor';
import { Vet } from '../../features/vets/models/vet.model';
import { VetApiService } from '../../features/vets/services/vet-api.service';
import { StayApiService } from '../../features/stays/services/stay-api.service';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { I18nService } from '../../core/i18n/i18n.service';
import { EntityDetailDialog } from './entity-detail-dialog';
import { EntityDetailDialogService } from './entity-detail-dialog.service';
import { OwnerDetailResponse } from './relationship.models';
import { Stay } from '../../features/stays/models/stay.model';
import { AuthSessionService } from '../../core/auth/auth-session.service';
import { NightlyReferenceRateApiService } from '../../features/nightly-rates/services/nightly-reference-rate-api.service';
import { StayEditor } from '../../features/stays/components/stay-editor/stay-editor';
import { StayDetail } from '../../features/stays/components/stay-detail/stay-detail';
import { StayCancellationDialog } from '../../features/stays/components/stay-cancellation-dialog/stay-cancellation-dialog';
import { PermanentDeletionConfirmationDialog } from '../permanent-deletion/permanent-deletion-confirmation-dialog';
import type { EntityDetailUpdate } from './entity-reference';
import { Router } from '@angular/router';
import { appPaginatorIntl } from '../pagination/app-paginator-intl';

describe('EntityDetailDialog', () => {
  const owner: Owner = {
    id: 'owner-1',
    fullName: 'Ada Lovelace',
    address: null,
    primaryPhone: '555-1111',
    secondaryPhone: null,
    secondaryPhoneName: null,
    instagram: null,
    facebook: null,
    notes: null,
  };
  const updated = { ...owner, fullName: 'Ada Byron' };
  const secondOwner = { ...owner, id: 'owner-2', fullName: 'Grace Hopper' };
  const cat: Cat = {
    id: 'cat-1',
    name: 'Milo',
    birthDate: '2020-01-01',
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
    vetId: null,
    vetName: null,
    hasPhoto: false,
  };
  const updatedCat = { ...cat, name: 'Milo Updated' };
  const vet: Vet = {
    id: 'vet-1',
    name: 'Dr. Vet',
    phoneNumber: null,
    address: null,
    registrationNumber: null,
    notes: null,
  };
  const updatedVet = { ...vet, name: 'Dr. Vet Updated' };
  const detail = (value: Owner): OwnerDetailResponse => ({
    owner: value,
    cats: { totalElements: 0, items: [] },
    stays: { totalElements: 0, items: [] },
  });
  const api = {
    getOwnerDetail: vi.fn((id: string) =>
      of(
        detail(
          id === 'owner-2' ? secondOwner : api.updateOwner.mock.calls.length ? updated : owner,
        ),
      ),
    ),
    getOwners: vi.fn(() => of([owner])),
    getOwnerCats: vi.fn(),
    getOwnerStays: vi.fn(),
    updateOwner: vi.fn(() => of(updated)),
  };
  const catApi = {
    getCatDetail: vi.fn((id: string): any =>
      of({
        cat: { ...cat, id, hasPhoto: false },
        stays: { totalElements: 0, items: [] },
      }),
    ),
    getCatStays: vi.fn(),
    getCatPhoto: vi.fn(() => of(new Blob(['jpeg'], { type: 'image/jpeg' }))),
    updateCat: vi.fn(() => of(updatedCat)),
  };
  const vetApi = {
    getVets: vi.fn(() => of([vet])),
    getVetCats: vi.fn(),
    getVetDetail: vi.fn((id: string) =>
      of({
        vet: { ...vet, id },
        cats: { totalElements: 0, items: [] },
      }),
    ),
    updateVet: vi.fn(() => of(updatedVet)),
  };
  const stayApi = {
    getStayDetail: vi.fn((_id?: string): any =>
      of({
        stayId: 'stay-1',
        status: 'RESERVED',
        startAt: '2030-01-01T10:00:00',
        endAt: '2030-01-03T10:00:00',
        numberOfNights: 2,
        notes: null,
        owner: { id: 'owner-1', fullName: 'Ada Lovelace' },
        cats: { totalElements: 0, items: [] },
      }),
    ),
    getStayCats: vi.fn(),
    getStayById: vi.fn(),
    previewDateChangePricing: vi.fn(),
    updateStay: vi.fn(),
    cancelStay: vi.fn(),
    deleteStay: vi.fn(),
  };
  const operationalStay: Stay = {
    stayId: 'stay-1',
    startAt: '2030-01-01T10:00:00',
    endAt: '2030-01-03T10:00:00',
    numberOfNights: 2,
    cancelledAt: null,
    createdAt: '2029-01-01T10:00:00',
    updatedAt: '2029-01-01T10:00:00',
    notes: null,
    catIds: [],
    ownerId: 'owner-1',
    ownerName: 'Ada Lovelace',
    cats: [],
    retainedNightlyRate: null,
    suggestedAmount: null,
    agreedAmount: null,
    totalPaid: '0',
    remainingAmount: null,
    paymentCondition: 'NO_PAYMENT',
    outstandingCollectionEligible: false,
    payments: [],
  };
  const beforeClosed = new Subject<void>();
  const dialogRef = {
    disableClose: false,
    close: vi.fn(),
    updateSize: vi.fn(),
    beforeClosed: () => beforeClosed.asObservable(),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: MatPaginatorIntl, useFactory: appPaginatorIntl }],
    });
    vi.clearAllMocks();
    dialogRef.disableClose = false;
    stayApi.getStayById.mockReturnValue(of(operationalStay));
    stayApi.previewDateChangePricing.mockReturnValue(
      of({
        pricingDecisionRequired: false,
        currentNumberOfNights: 2,
        currentAgreedAmount: null,
        numberOfNights: 2,
        retainedNightlyRate: null,
        suggestedAmount: null,
        confirmation: null,
      }),
    );
  });
  afterEach(() => TestBed.resetTestingModule());

  it('keeps edit and authoritative save inside the open route-free detail shell', async () => {
    await TestBed.configureTestingModule({
      imports: [EntityDetailDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { entityType: 'owner', entityId: 'owner-1' } },
        { provide: OwnerApiService, useValue: api },
        { provide: CatApiService, useValue: catApi },
        { provide: VetApiService, useValue: vetApi },
        { provide: StayApiService, useValue: stayApi },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EntityDetailDialog);
    const emitted = vi.fn();
    fixture.componentInstance.entityUpdated.subscribe(emitted);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ada Lovelace');

    (
      fixture.nativeElement.querySelector(
        'app-owner-detail button[mat-flat-button]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    const editor = fixture.debugElement.query(By.directive(OwnerEditor))
      .componentInstance as OwnerEditor;
    editor.fullName.set('Ada Byron');
    editor.submit();
    fixture.detectChanges();

    expect(api.updateOwner).toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Ada Byron');
    expect(fixture.debugElement.query(By.directive(OwnerEditor))).toBeNull();
    expect(fixture.componentInstance.editing()).toBe(false);
    expect(emitted).toHaveBeenCalledWith({ entityType: 'owner', entityId: 'owner-1' });
  });

  it('owns cancel and reference-change discard transitions and handles Stay explicitly', async () => {
    await TestBed.configureTestingModule({
      imports: [EntityDetailDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { entityType: 'owner', entityId: 'owner-1' } },
        { provide: OwnerApiService, useValue: api },
        { provide: CatApiService, useValue: catApi },
        { provide: VetApiService, useValue: vetApi },
        { provide: StayApiService, useValue: stayApi },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EntityDetailDialog);
    const emitted = vi.fn();
    fixture.componentInstance.entityUpdated.subscribe(emitted);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    (
      fixture.nativeElement.querySelector(
        'app-owner-detail button[mat-flat-button]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    let editor = fixture.debugElement.query(By.directive(OwnerEditor))
      .componentInstance as OwnerEditor;
    editor.fullName.set('Unsaved draft');
    fixture.detectChanges();
    (
      fixture.nativeElement.querySelector(
        'app-owner-editor button[mat-stroked-button]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(api.updateOwner).not.toHaveBeenCalled();
    expect(emitted).not.toHaveBeenCalled();
    expect(fixture.nativeElement.textContent).toContain('Ada Lovelace');

    (
      fixture.nativeElement.querySelector(
        'app-owner-detail button[mat-flat-button]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    editor = fixture.debugElement.query(By.directive(OwnerEditor)).componentInstance as OwnerEditor;
    expect(editor.fullName()).toBe('Ada Lovelace');
    api.updateOwner.mockReturnValueOnce(throwError(() => new Error('rejected update')));
    editor.fullName.set('Rejected draft');
    editor.submit();
    fixture.detectChanges();
    expect(emitted).not.toHaveBeenCalled();
    expect(editor.fullName()).toBe('Rejected draft');

    fixture.componentInstance.showReference({ entityType: 'owner', entityId: 'owner-2' });
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(OwnerEditor))).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Grace Hopper');
    expect(fixture.componentInstance.title()).toBe(
      fixture.componentInstance.text().owners.detail.title,
    );

    fixture.componentInstance.showReference({ entityType: 'stay', entityId: 'stay-1' });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ada Lovelace');
    expect(fixture.componentInstance.title()).toBe(
      fixture.componentInstance.text().stays.detail.title,
    );
  });

  it.each([
    ['owner', 'owner-1'],
    ['cat', 'cat-1'],
    ['vet', 'vet-1'],
  ] as const)(
    'emits the rendered %s reference only from saveCompleted',
    async (entityType, entityId) => {
      vetApi.getVetDetail.mockReturnValue(
        of({
          vet: {
            id: 'vet-1',
            name: 'Dr. Vet',
            phoneNumber: null,
            address: null,
            registrationNumber: null,
            notes: null,
          },
          cats: { totalElements: 0, items: [] },
        }),
      );
      await TestBed.configureTestingModule({
        imports: [EntityDetailDialog],
        providers: [
          provideNoopAnimations(),
          { provide: MAT_DIALOG_DATA, useValue: { entityType, entityId } },
          { provide: OwnerApiService, useValue: api },
          { provide: CatApiService, useValue: catApi },
          { provide: VetApiService, useValue: vetApi },
          { provide: StayApiService, useValue: stayApi },
          { provide: MatDialogRef, useValue: dialogRef },
        ],
      }).compileComponents();
      const fixture = TestBed.createComponent(EntityDetailDialog);
      const emitted = vi.fn();
      fixture.componentInstance.entityUpdated.subscribe(emitted);
      fixture.detectChanges();

      const detailComponent = fixture.debugElement.query(By.css(`app-${entityType}-detail`))
        .componentInstance as {
        saveCompleted: { emit(): void };
        cancelRequested: { emit(): void };
      };
      detailComponent.cancelRequested.emit();
      expect(emitted).not.toHaveBeenCalled();
      detailComponent.saveCompleted.emit();
      expect(emitted).toHaveBeenCalledWith({ entityType, entityId });
    },
  );

  it.each([
    ['owner', 'owner-1'],
    ['cat', 'cat-1'],
    ['vet', 'vet-1'],
  ] as const)(
    'locks rendered dialog exits throughout rejected and successful %s updates',
    async (entityType, entityId) => {
      api.getOwnerDetail.mockImplementation((id: string) =>
        of(
          detail(
            id === 'owner-2'
              ? secondOwner
              : api.updateOwner.mock.calls.length > 1
                ? updated
                : owner,
          ),
        ),
      );
      api.getOwners.mockReturnValue(of([owner]));
      catApi.getCatDetail.mockImplementation((id: string): any =>
        of({
          cat: {
            ...(catApi.updateCat.mock.calls.length > 1 ? updatedCat : cat),
            id,
          },
          stays: { totalElements: 0, items: [] },
        }),
      );
      vetApi.getVets.mockReturnValue(of([vet]));
      vetApi.getVetDetail.mockImplementation((id: string) =>
        of({
          vet: {
            ...(vetApi.updateVet.mock.calls.length > 1 ? updatedVet : vet),
            id,
          },
          cats: { totalElements: 0, items: [] },
        }),
      );
      const rejected = new Subject<Owner | Cat | Vet>();
      const succeeded = new Subject<Owner | Cat | Vet>();
      if (entityType === 'owner') {
        api.updateOwner.mockReturnValueOnce(rejected as Subject<Owner>);
        api.updateOwner.mockReturnValueOnce(succeeded as Subject<Owner>);
      } else if (entityType === 'cat') {
        catApi.updateCat.mockReturnValueOnce(rejected as Subject<Cat>);
        catApi.updateCat.mockReturnValueOnce(succeeded as Subject<Cat>);
      } else {
        vetApi.updateVet.mockReturnValueOnce(rejected as Subject<Vet>);
        vetApi.updateVet.mockReturnValueOnce(succeeded as Subject<Vet>);
      }
      await TestBed.configureTestingModule({
        imports: [EntityDetailDialog],
        providers: [
          provideNoopAnimations(),
          { provide: MAT_DIALOG_DATA, useValue: { entityType: 'owner', entityId: 'owner-1' } },
          { provide: OwnerApiService, useValue: api },
          { provide: CatApiService, useValue: catApi },
          { provide: VetApiService, useValue: vetApi },
          { provide: StayApiService, useValue: stayApi },
          { provide: MatDialogRef, useValue: dialogRef },
        ],
      }).compileComponents();
      const fixture = TestBed.createComponent(EntityDetailDialog);
      const emitted = vi.fn();
      fixture.componentInstance.entityUpdated.subscribe(emitted);
      fixture.detectChanges();
      fixture.componentInstance.showReference({ entityType, entityId });
      fixture.detectChanges();

      const detailEditLabel =
        entityType === 'owner'
          ? fixture.componentInstance.text().owners.detail.edit
          : entityType === 'cat'
            ? fixture.componentInstance.text().cats.detail.edit
            : fixture.componentInstance.text().vets.detail.edit;
      buttonContaining(fixture, detailEditLabel).click();
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      const editorDebug = fixture.debugElement.query(By.css(`app-${entityType}-editor`));
      const editor = editorDebug.componentInstance as OwnerEditor | CatEditor | VetEditor;
      const draft = `Rejected ${entityType} draft`;
      if (entityType === 'owner') (editor as OwnerEditor).fullName.set(draft);
      else if (entityType === 'cat') (editor as CatEditor).name.set(draft);
      else (editor as VetEditor).name.set(draft);
      fixture.detectChanges();

      const submit = () =>
        fixture.nativeElement.querySelector(
          `app-${entityType}-editor button[type="submit"]`,
        ) as HTMLButtonElement;
      const cancel = () =>
        fixture.nativeElement.querySelector(
          `app-${entityType}-editor button[mat-stroked-button]`,
        ) as HTMLButtonElement;
      const back = () =>
        fixture.nativeElement.querySelector('[data-dialog-focus]') as HTMLButtonElement;
      const close = () => fixture.nativeElement.querySelector('.close-button') as HTMLButtonElement;

      submit().click();
      fixture.detectChanges();
      expect(cancel().disabled).toBe(true);
      expect(back().disabled).toBe(true);
      expect(close().disabled).toBe(true);
      expect(dialogRef.disableClose).toBe(true);

      cancel().click();
      back().click();
      close().click();
      fixture.detectChanges();
      expect(dialogRef.close).not.toHaveBeenCalled();
      expect(fixture.componentInstance.reference()).toEqual({ entityType, entityId });
      expect(fixture.componentInstance.editing()).toBe(true);
      expect(fixture.debugElement.query(By.css(`app-${entityType}-editor`))).not.toBeNull();

      rejected.error(new Error('rejected update'));
      fixture.detectChanges();
      expect(cancel().disabled).toBe(false);
      expect(back().disabled).toBe(false);
      expect(close().disabled).toBe(false);
      expect(dialogRef.disableClose).toBe(false);
      expect(emitted).not.toHaveBeenCalled();
      expect(
        entityType === 'owner'
          ? (editor as OwnerEditor).fullName()
          : entityType === 'cat'
            ? (editor as CatEditor).name()
            : (editor as VetEditor).name(),
      ).toBe(draft);

      submit().click();
      fixture.detectChanges();
      expect(dialogRef.disableClose).toBe(true);
      succeeded.next(
        entityType === 'owner' ? updated : entityType === 'cat' ? updatedCat : updatedVet,
      );
      succeeded.complete();
      fixture.detectChanges();

      expect(dialogRef.disableClose).toBe(false);
      expect(fixture.componentInstance.editing()).toBe(false);
      expect(fixture.debugElement.query(By.css(`app-${entityType}-editor`))).toBeNull();
      expect(emitted).toHaveBeenCalledTimes(1);
      expect(emitted).toHaveBeenCalledWith({ entityType, entityId });
      expect(fixture.nativeElement.textContent).toContain(
        entityType === 'owner'
          ? updated.fullName
          : entityType === 'cat'
            ? updatedCat.name
            : updatedVet.name,
      );
    },
  );

  it('ignores stale same-type successes and errors after a reference change', async () => {
    const first = new Subject<OwnerDetailResponse>();
    const second = new Subject<OwnerDetailResponse>();
    const third = new Subject<OwnerDetailResponse>();
    const fourth = new Subject<OwnerDetailResponse>();
    api.getOwnerDetail
      .mockImplementationOnce(() => first)
      .mockImplementationOnce(() => second)
      .mockImplementationOnce(() => third)
      .mockImplementationOnce(() => fourth);
    await TestBed.configureTestingModule({
      imports: [EntityDetailDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { entityType: 'owner', entityId: 'owner-1' } },
        { provide: OwnerApiService, useValue: api },
        { provide: CatApiService, useValue: catApi },
        { provide: VetApiService, useValue: vetApi },
        { provide: StayApiService, useValue: stayApi },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EntityDetailDialog);
    fixture.detectChanges();
    fixture.componentInstance.showReference({ entityType: 'owner', entityId: 'owner-2' });
    fixture.detectChanges();
    second.next(detail(secondOwner));
    fixture.detectChanges();
    first.next(detail(owner));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Grace Hopper');
    expect(fixture.nativeElement.textContent).not.toContain('Ada Lovelace');

    const thirdOwner = { ...owner, id: 'owner-3', fullName: 'Third Owner' };
    const fourthOwner = { ...owner, id: 'owner-4', fullName: 'Current Owner' };
    fixture.componentInstance.showReference({ entityType: 'owner', entityId: thirdOwner.id });
    fixture.detectChanges();
    fixture.componentInstance.showReference({ entityType: 'owner', entityId: fourthOwner.id });
    fixture.detectChanges();
    fourth.next(detail(fourthOwner));
    fixture.detectChanges();
    third.error(new Error('late failure'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Current Owner');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('navigates detail to a paged list and child, then restores parent context and clamps the stored page', async () => {
    const initialPage = new Subject<any>();
    const requestedPage = new Subject<any>();
    const restoredInvalidPage = new Subject<any>();
    const clampedPage = new Subject<any>();
    api.getOwnerDetail.mockReturnValueOnce(
      of({ ...detail(owner), cats: { totalElements: 6, items: [] } }),
    );
    api.getOwnerCats
      .mockImplementationOnce(() => initialPage)
      .mockImplementationOnce(() => requestedPage)
      .mockImplementationOnce(() => restoredInvalidPage)
      .mockImplementationOnce(() => clampedPage);
    await TestBed.configureTestingModule({
      imports: [EntityDetailDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { entityType: 'owner', entityId: 'owner-1' } },
        { provide: OwnerApiService, useValue: api },
        { provide: CatApiService, useValue: catApi },
        { provide: VetApiService, useValue: vetApi },
        { provide: StayApiService, useValue: stayApi },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EntityDetailDialog);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const originalUrl = window.location.href;

    const associated = Array.from(fixture.nativeElement.querySelectorAll('button')).find(
      (button: any) => button.textContent.includes('6'),
    ) as HTMLButtonElement;
    associated.click();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.relationship-list')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('mat-progress-spinner')).not.toBeNull();
    expect(fixture.nativeElement.textContent).not.toContain(
      fixture.componentInstance.text().entityDetail.loading,
    );
    initialPage.next({
      items: [catItem('cat-1')],
      page: 0,
      pageSize: 5,
      totalElements: 11,
      totalPages: 3,
    });
    fixture.detectChanges();
    fixture.componentInstance.pageChanged({
      pageIndex: 2,
      pageSize: 5,
      length: 11,
      previousPageIndex: 0,
    });
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.relationship-list button')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('mat-progress-spinner')).not.toBeNull();
    requestedPage.next({
      items: [catItem('cat-6')],
      page: 2,
      pageSize: 5,
      totalElements: 11,
      totalPages: 3,
    });
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('.relationship-list button') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.reference().entityType).toBe('cat');
    await fixture.whenStable();
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus');
    vi.useFakeTimers();

    (fixture.nativeElement.querySelector('[data-dialog-focus]') as HTMLButtonElement).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.reference()).toEqual({
      entityType: 'owner',
      entityId: 'owner-1',
    });
    expect(fixture.componentInstance.title()).toBe(
      fixture.componentInstance.text().entityDetail.cats,
    );
    restoredInvalidPage.next({ items: [], page: 2, pageSize: 5, totalElements: 6, totalPages: 2 });
    fixture.detectChanges();
    clampedPage.next({
      items: [catItem('cat-6')],
      page: 1,
      pageSize: 5,
      totalElements: 6,
      totalPages: 2,
    });
    fixture.detectChanges();
    vi.runAllTimers();
    expect(api.getOwnerCats.mock.calls.map((call) => call[1])).toEqual([0, 2, 2, 1]);
    expect(fixture.componentInstance.relationshipPage()?.page).toBe(1);
    expect(focusSpy).toHaveBeenCalled();
    expect(focusSpy.mock.instances.at(-1)).toBe(
      fixture.nativeElement.querySelector('[data-dialog-focus]'),
    );
    vi.useRealTimers();
    expect(window.location.href).toBe(originalUrl);
  });

  it('protects list state from late responses and exposes empty, error, retry and bilingual paginator labels', async () => {
    const failed = new Subject<any>();
    const retried = new Subject<any>();
    const late = new Subject<any>();
    api.getOwnerCats
      .mockImplementationOnce(() => failed)
      .mockImplementationOnce(() => retried)
      .mockImplementationOnce(() => late);
    await TestBed.configureTestingModule({
      imports: [EntityDetailDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { entityType: 'owner', entityId: 'owner-1' } },
        { provide: OwnerApiService, useValue: api },
        { provide: CatApiService, useValue: catApi },
        { provide: VetApiService, useValue: vetApi },
        { provide: StayApiService, useValue: stayApi },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EntityDetailDialog);
    fixture.detectChanges();
    fixture.componentInstance.openCats({ entityType: 'owner', entityId: 'owner-1' });
    fixture.detectChanges();
    failed.error(new Error('failed'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      fixture.componentInstance.text().entityDetail.loadFailed,
    );
    fixture.componentInstance.retryRelationship();
    retried.next({ items: [], page: 0, pageSize: 5, totalElements: 0, totalPages: 0 });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      fixture.componentInstance.text().entityDetail.empty,
    );

    fixture.componentInstance.retryRelationship();
    fixture.componentInstance.back();
    late.error(new Error('late'));
    fixture.detectChanges();
    expect(fixture.componentInstance.relationshipError()).toBe(false);

    const intl = fixture.debugElement.injector.get(MatPaginatorIntl);
    const i18n = TestBed.inject(I18nService);
    i18n.language.set('es');
    fixture.detectChanges();
    expect(intl.nextPageLabel).toBe('Página siguiente');
    i18n.language.set('en');
    fixture.detectChanges();
    expect(intl.nextPageLabel).toBe('Next page');
    expect(intl.getRangeLabel(1, 5, 6)).toBe('6–6 of 6');
  });

  it('navigates rendered direct Owner/Cat/Stay previews with localized labels and Back history', async () => {
    const relationshipStay = {
      stayId: 'stay-1',
      startAt: '2030-01-01T10:00:00',
      endAt: '2030-01-03T10:00:00',
      status: 'RESERVED' as const,
    };
    api.getOwnerDetail.mockReturnValue(
      of({
        ...detail(owner),
        cats: { totalElements: 1, items: [catItem('cat-1')] },
        stays: { totalElements: 1, items: [relationshipStay] },
      }),
    );
    catApi.getCatDetail.mockReturnValue(
      of({
        cat: {
          id: 'cat-1',
          name: 'Milo',
          birthDate: '2020-01-01',
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
          vetId: null,
          vetName: null,
        },
        stays: { totalElements: 1, items: [relationshipStay] },
      }),
    );
    stayApi.getStayDetail.mockReturnValue(
      of({
        stayId: 'stay-1',
        status: 'RESERVED',
        startAt: '2030-01-01T10:00:00',
        endAt: '2030-01-03T10:00:00',
        numberOfNights: 2,
        notes: null,
        owner: { id: 'owner-1', fullName: 'Ada Lovelace' },
        cats: { totalElements: 1, items: [catItem('cat-1')] },
      }),
    );
    await TestBed.configureTestingModule({
      imports: [EntityDetailDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { entityType: 'owner', entityId: 'owner-1' } },
        { provide: OwnerApiService, useValue: api },
        { provide: CatApiService, useValue: catApi },
        { provide: VetApiService, useValue: vetApi },
        { provide: StayApiService, useValue: stayApi },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EntityDetailDialog);
    fixture.detectChanges();

    const localizedStayLabel = buttonContaining(fixture, 'Reserved');
    expect(localizedStayLabel.textContent).toContain('1 Jan 2030, 10:00');
    localizedStayLabel.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.reference()).toEqual({
      entityType: 'stay',
      entityId: 'stay-1',
    });
    expect(stayApi.getStayDetail).toHaveBeenCalledWith('stay-1');

    buttonContaining(fixture, 'Ada Lovelace').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.reference().entityType).toBe('owner');
    buttonContaining(fixture, fixture.componentInstance.text().entityDetail.back).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.reference().entityType).toBe('stay');

    buttonContaining(fixture, 'Milo — Ada Lovelace').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.reference()).toEqual({ entityType: 'cat', entityId: 'cat-1' });
    expect(catApi.getCatDetail).toHaveBeenCalledWith('cat-1');
    expect(fixture.nativeElement.textContent).not.toContain(
      fixture.componentInstance.text().cats.detail.viewPhoto,
    );
    const emptyPhotoField = [
      ...(fixture.nativeElement as HTMLElement).querySelectorAll('.detail-field'),
    ].find(
      (field) =>
        field.querySelector('dt')?.textContent?.trim() ===
        fixture.componentInstance.text().cats.detail.photo,
    );
    expect(emptyPhotoField?.querySelector('dd')?.textContent?.trim()).toBe(
      fixture.componentInstance.text().cats.emptyValue,
    );
    const catStay = buttonContaining(fixture, 'Reserved');
    catStay.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.reference().entityType).toBe('stay');
    buttonContaining(fixture, fixture.componentInstance.text().entityDetail.back).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.reference().entityType).toBe('cat');
    expect(fixture.nativeElement.textContent).toContain('Milo');
  });

  it('drives rendered associated Stay/Cat lists through paginator, child and restored Back state', async () => {
    const stayPage = {
      items: [
        {
          stayId: 'stay-1',
          startAt: '2030-01-01T10:00:00',
          endAt: '2030-01-03T10:00:00',
          status: 'RESERVED',
        },
      ],
      page: 0,
      pageSize: 5,
      totalElements: 6,
      totalPages: 2,
    };
    api.getOwnerDetail.mockReturnValue(
      of({
        ...detail(owner),
        cats: { totalElements: 1, items: [catItem('cat-1')] },
        stays: { totalElements: 6, items: [] },
      }),
    );
    api.getOwnerStays.mockImplementation((_id: string, page: number) =>
      of({ ...stayPage, page, items: [{ ...stayPage.items[0], stayId: `stay-${page + 1}` }] }),
    );
    catApi.getCatDetail.mockReturnValue(
      of({
        cat: {
          id: 'cat-1',
          name: 'Milo',
          birthDate: '2020-01-01',
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
          vetId: null,
          vetName: null,
        },
        stays: { totalElements: 6, items: [] },
      }),
    );
    catApi.getCatStays.mockReturnValue(of(stayPage));
    stayApi.getStayDetail.mockImplementation((id?: string) =>
      of({
        stayId: id!,
        status: 'RESERVED',
        startAt: '2030-01-01T10:00:00',
        endAt: '2030-01-03T10:00:00',
        numberOfNights: 2,
        notes: null,
        owner: { id: 'owner-1', fullName: 'Ada Lovelace' },
        cats: { totalElements: 6, items: [] },
      }),
    );
    stayApi.getStayCats.mockReturnValue(
      of({ items: [catItem('cat-1')], page: 0, pageSize: 5, totalElements: 6, totalPages: 2 }),
    );
    await TestBed.configureTestingModule({
      imports: [EntityDetailDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { entityType: 'owner', entityId: 'owner-1' } },
        { provide: OwnerApiService, useValue: api },
        { provide: CatApiService, useValue: catApi },
        { provide: VetApiService, useValue: vetApi },
        { provide: StayApiService, useValue: stayApi },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EntityDetailDialog);
    fixture.detectChanges();

    buttonContaining(fixture, '6').click();
    fixture.detectChanges();
    expect(api.getOwnerStays).toHaveBeenCalledWith('owner-1', 0);
    expect(fixture.nativeElement.textContent).toContain('Reserved');
    (
      fixture.nativeElement.querySelector('.mat-mdc-paginator-navigation-next') as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    expect(api.getOwnerStays).toHaveBeenCalledWith('owner-1', 1);
    buttonContaining(fixture, 'Reserved').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.reference().entityId).toBe('stay-2');
    buttonContaining(fixture, fixture.componentInstance.text().entityDetail.back).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.relationshipPage()?.page).toBe(1);
    expect(api.getOwnerStays).toHaveBeenLastCalledWith('owner-1', 1);

    buttonContaining(fixture, fixture.componentInstance.text().entityDetail.back).click();
    fixture.detectChanges();
    buttonContaining(fixture, 'Milo — Ada Lovelace').click();
    fixture.detectChanges();
    buttonContaining(fixture, '6').click();
    fixture.detectChanges();
    expect(catApi.getCatStays).toHaveBeenCalledWith('cat-1', 0);
    buttonContaining(fixture, 'Reserved').click();
    fixture.detectChanges();
    buttonContaining(fixture, '6').click();
    fixture.detectChanges();
    expect(stayApi.getStayCats).toHaveBeenCalledWith('stay-1', 0);
    buttonContaining(fixture, 'Milo — Ada Lovelace').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.reference().entityType).toBe('cat');
    buttonContaining(fixture, fixture.componentInstance.text().entityDetail.back).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.relationshipPage()?.page).toBe(0);
    expect(stayApi.getStayCats).toHaveBeenLastCalledWith('stay-1', 0);
  });

  it('lets the reactive dialog title provide the accessible name', () => {
    const entityUpdated = new Subject<{ entityType: 'owner'; entityId: string } | Stay>();
    const closed = new Subject<void>();
    const dialog = {
      open: vi.fn(() => ({
        componentInstance: { entityUpdated },
        afterClosed: () => closed.asObservable(),
      })),
    };
    TestBed.configureTestingModule({
      providers: [EntityDetailDialogService, { provide: MatDialog, useValue: dialog }],
    });
    const received: EntityDetailUpdate[] = [];
    const completed = vi.fn();
    TestBed.inject(EntityDetailDialogService)
      .open({ entityType: 'owner', entityId: 'owner-1' })
      .subscribe({ next: (update) => received.push(update), complete: completed });
    expect(dialog.open).toHaveBeenCalledWith(
      EntityDetailDialog,
      expect.not.objectContaining({ ariaLabel: expect.anything() }),
    );
    entityUpdated.next({ entityType: 'owner', entityId: 'owner-1' });
    entityUpdated.next(operationalStay);
    expect(received).toEqual([{ entityType: 'owner', entityId: 'owner-1' }, operationalStay]);
    expect(completed).not.toHaveBeenCalled();
    closed.next();
    expect(completed).toHaveBeenCalledOnce();
  });

  it('keeps the operational edit load failure separate and retries the operational GET', async () => {
    const pricingGate = new Subject<Stay>();
    const failed = new Subject<Stay>();
    const retried = new Subject<Stay>();
    stayApi.getStayById
      .mockImplementationOnce(() => pricingGate)
      .mockImplementationOnce(() => failed)
      .mockImplementationOnce(() => retried);
    await TestBed.configureTestingModule({
      imports: [StayDetail],
      providers: [
        provideNoopAnimations(),
        { provide: StayApiService, useValue: stayApi },
        { provide: AuthSessionService, useValue: { hasRole: () => true } },
        { provide: NightlyReferenceRateApiService, useValue: { getCurrentRates: () => of([]) } },
        { provide: MatDialog, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(StayDetail);
    fixture.componentRef.setInput('entityId', 'stay-1');
    fixture.componentRef.setInput('editing', false);
    fixture.detectChanges();
    fixture.componentRef.setInput('editing', true);
    fixture.detectChanges();

    failed.error(new Error('operational load failed'));
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      fixture.componentInstance.text().stays.detail.operationalLoadFailed,
    );
    expect(fixture.componentInstance.error()).toBe(false);

    fixture.componentInstance.loadOperational();
    retried.next(operationalStay);
    fixture.detectChanges();
    expect(stayApi.getStayById).toHaveBeenCalledTimes(3);
    expect(fixture.componentInstance.operationalLoading()).toBe(false);
    expect(fixture.debugElement.query(By.directive(StayEditor))).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.cancel-edit')).not.toBeNull();
  });

  it('never exposes late operational success or error under a newer Stay reference', async () => {
    const first = new Subject<Stay>();
    const second = new Subject<Stay>();
    const third = new Subject<Stay>();
    const fourth = new Subject<Stay>();
    let request = 0;
    stayApi.getStayById.mockImplementation(() => {
      const current = request++;
      if (current % 2 === 0) return of(operationalStay);
      return [first, second, third, fourth][Math.floor(current / 2)];
    });
    await TestBed.configureTestingModule({
      imports: [StayDetail],
      providers: [
        provideNoopAnimations(),
        { provide: StayApiService, useValue: stayApi },
        { provide: AuthSessionService, useValue: { hasRole: () => true } },
        { provide: NightlyReferenceRateApiService, useValue: { getCurrentRates: () => of([]) } },
        { provide: MatDialog, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(StayDetail);
    fixture.componentRef.setInput('entityId', 'stay-1');
    fixture.componentRef.setInput('editing', true);
    fixture.detectChanges();
    fixture.componentRef.setInput('entityId', 'stay-2');
    fixture.detectChanges();
    second.next({ ...operationalStay, stayId: 'stay-2' });
    first.next(operationalStay);
    fixture.detectChanges();
    expect(fixture.componentInstance.operationalStay()?.stayId).toBe('stay-2');

    fixture.componentRef.setInput('entityId', 'stay-3');
    fixture.detectChanges();
    fixture.componentRef.setInput('entityId', 'stay-4');
    fixture.detectChanges();
    fourth.next({ ...operationalStay, stayId: 'stay-4' });
    third.error(new Error('late error'));
    fixture.detectChanges();
    expect(fixture.componentInstance.operationalStay()?.stayId).toBe('stay-4');
    expect(fixture.componentInstance.operationalError()).toBe(false);
  });

  it.each([
    ['known', '100', true],
    ['null', null, false],
  ] as const)(
    'shows pricing only after the full Stay proves a %s agreement',
    async (_label, agreedAmount, visible) => {
      stayApi.getStayDetail.mockReturnValue(of(stayDetailResponse('stay-1')));
      stayApi.getStayById.mockReturnValue(of({ ...operationalStay, agreedAmount }));
      await TestBed.configureTestingModule({
        imports: [StayDetail],
        providers: [provideNoopAnimations(), { provide: StayApiService, useValue: stayApi }],
      }).compileComponents();
      const fixture = TestBed.createComponent(StayDetail);
      fixture.componentRef.setInput('entityId', 'stay-1');
      fixture.componentRef.setInput('editing', false);
      fixture.detectChanges();
      const pricing = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find(
        (button) =>
          button.textContent?.includes(fixture.componentInstance.text().stays.detail.pricing),
      );
      expect(pricing !== undefined).toBe(visible);
    },
  );

  it('keeps lightweight detail usable and pricing hidden when the supplementary gate fails', async () => {
    stayApi.getStayDetail.mockReturnValue(of(stayDetailResponse('stay-1')));
    stayApi.getStayById.mockReturnValue(throwError(() => new Error('gate failed')));
    await TestBed.configureTestingModule({
      imports: [StayDetail],
      providers: [provideNoopAnimations(), { provide: StayApiService, useValue: stayApi }],
    }).compileComponents();
    const fixture = TestBed.createComponent(StayDetail);
    fixture.componentRef.setInput('entityId', 'stay-1');
    fixture.componentRef.setInput('editing', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Ada Lovelace');
    expect(fixture.componentInstance.error()).toBe(false);
    expect(fixture.componentInstance.pricingStay()).toBeNull();
  });

  it('ignores late pricing-gate responses and errors after the Stay reference changes', async () => {
    const first = new Subject<Stay>();
    const second = new Subject<Stay>();
    stayApi.getStayDetail.mockImplementation((id?: string) => of(stayDetailResponse(id ?? '')));
    stayApi.getStayById.mockReturnValueOnce(first).mockReturnValueOnce(second);
    await TestBed.configureTestingModule({
      imports: [StayDetail],
      providers: [provideNoopAnimations(), { provide: StayApiService, useValue: stayApi }],
    }).compileComponents();
    const fixture = TestBed.createComponent(StayDetail);
    fixture.componentRef.setInput('entityId', 'stay-1');
    fixture.componentRef.setInput('editing', false);
    fixture.detectChanges();
    fixture.componentRef.setInput('entityId', 'stay-2');
    fixture.detectChanges();
    first.next({ ...operationalStay, agreedAmount: '100' });
    expect(fixture.componentInstance.pricingStay()).toBeNull();
    second.next({ ...operationalStay, stayId: 'stay-2', agreedAmount: '100' });
    expect(fixture.componentInstance.pricingStay()?.stayId).toBe('stay-2');
    first.error(new Error('late gate failure'));
    expect(fixture.componentInstance.pricingStay()?.stayId).toBe('stay-2');
  });

  it('closes the Material detail and navigates to pricing with the exact Router origin state', async () => {
    const router = {
      url: '/stays?selectedStayId=stay-1&owner=Ada%20Lovelace',
      navigate: vi.fn().mockResolvedValue(true),
    };
    stayApi.getStayDetail.mockReturnValue(of(stayDetailResponse('stay-1')));
    stayApi.getStayById.mockReturnValue(
      of({
        ...operationalStay,
        agreedAmount: '100',
        catIds: ['cat-1'],
        cats: [{ catId: 'cat-1', name: 'Milo' }],
      }),
    );
    await TestBed.configureTestingModule({
      imports: [EntityDetailDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { entityType: 'stay', entityId: 'stay-1' } },
        { provide: OwnerApiService, useValue: api },
        { provide: CatApiService, useValue: catApi },
        { provide: VetApiService, useValue: vetApi },
        { provide: StayApiService, useValue: stayApi },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: Router, useValue: router },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EntityDetailDialog);
    fixture.detectChanges();
    buttonContaining(fixture, fixture.componentInstance.text().stays.detail.pricing).click();
    expect(dialogRef.close).toHaveBeenCalledOnce();
    expect(router.navigate).toHaveBeenCalledWith(['/stays', 'stay-1', 'pricing'], {
      state: { stayPricingOrigin: router.url },
    });
  });

  it('drives rendered Stay cancel, rejected draft retention and authoritative locked save', async () => {
    const relationshipStay = {
      stayId: 'stay-1',
      startAt: '2030-01-01T10:00:00',
      endAt: '2030-01-03T10:00:00',
      status: 'RESERVED' as const,
    };
    const authoritative = { ...operationalStay, notes: 'authoritative update' };
    const pending = new Subject<Stay>();
    api.getOwnerDetail.mockReturnValue(
      of({ ...detail(owner), stays: { totalElements: 1, items: [relationshipStay] } }),
    );
    stayApi.getStayDetail.mockImplementation(() =>
      of({
        stayId: 'stay-1',
        status: 'RESERVED',
        startAt: '2030-01-01T10:00:00',
        endAt: '2030-01-03T10:00:00',
        numberOfNights: 2,
        notes: stayApi.updateStay.mock.calls.length > 1 ? authoritative.notes : null,
        owner: { id: 'owner-1', fullName: 'Ada Lovelace' },
        cats: { totalElements: 0, items: [] },
      }),
    );
    stayApi.updateStay
      .mockReturnValueOnce(throwError(() => new Error('rejected update')))
      .mockReturnValueOnce(pending);
    await TestBed.configureTestingModule({
      imports: [EntityDetailDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { entityType: 'owner', entityId: 'owner-1' } },
        { provide: OwnerApiService, useValue: api },
        { provide: CatApiService, useValue: catApi },
        { provide: VetApiService, useValue: vetApi },
        { provide: StayApiService, useValue: stayApi },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: AuthSessionService, useValue: { hasRole: () => true } },
        { provide: NightlyReferenceRateApiService, useValue: { getCurrentRates: () => of([]) } },
        { provide: MatDialog, useValue: { open: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EntityDetailDialog);
    fixture.detectChanges();
    const emitted = vi.fn();
    fixture.componentInstance.entityUpdated.subscribe(emitted);

    expect(fixture.debugElement.query(By.directive(StayEditor))).toBeNull();
    buttonContaining(fixture, 'Reserved').click();
    fixture.detectChanges();
    buttonContaining(fixture, fixture.componentInstance.text().stays.detail.edit).click();
    fixture.detectChanges();
    let editor = fixture.debugElement.query(By.directive(StayEditor))
      .componentInstance as StayEditor;
    editor.notes.set('discard me');
    buttonContaining(fixture, fixture.componentInstance.text().stays.detail.cancelEdit).click();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(StayEditor))).toBeNull();

    buttonContaining(fixture, fixture.componentInstance.text().stays.detail.edit).click();
    fixture.detectChanges();
    editor = fixture.debugElement.query(By.directive(StayEditor)).componentInstance as StayEditor;
    expect(editor.notes()).toBe('');
    editor.notes.set('retained rejected draft');
    buttonContaining(fixture, fixture.componentInstance.text().stays.edit.submit).click();
    fixture.detectChanges();
    expect(fixture.debugElement.query(By.directive(StayEditor))).not.toBeNull();
    expect(editor.notes()).toBe('retained rejected draft');

    buttonContaining(fixture, fixture.componentInstance.text().stays.edit.submit).click();
    fixture.detectChanges();
    expect(dialogRef.disableClose).toBe(true);
    expect(
      (fixture.nativeElement.querySelector('.close-button') as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (fixture.nativeElement.querySelector('[data-dialog-focus]') as HTMLButtonElement).disabled,
    ).toBe(true);
    expect(
      (fixture.nativeElement.querySelector('.cancel-edit') as HTMLButtonElement).disabled,
    ).toBe(true);

    pending.next(authoritative);
    pending.complete();
    fixture.detectChanges();
    expect(dialogRef.disableClose).toBe(false);
    expect(emitted).toHaveBeenCalledWith(authoritative);
    expect(fixture.componentInstance.editing()).toBe(false);
    expect(fixture.debugElement.query(By.directive(StayEditor))).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('authoritative update');
    expect(stayApi.getStayDetail).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['RESERVED', true],
    ['CHECKED_IN', true],
    ['CHECKED_OUT', false],
    ['CANCELLED', false],
  ] as const)('renders backend status %s with edit visibility %s', async (status, editable) => {
    stayApi.getStayDetail.mockReturnValue(
      of({
        stayId: 'stay-1',
        status,
        startAt: '2030-01-01T10:00:00',
        endAt: '2030-01-03T10:00:00',
        numberOfNights: 2,
        notes: null,
        owner: { id: 'owner-1', fullName: 'Ada Lovelace' },
        cats: { totalElements: 0, items: [] },
      }),
    );
    await TestBed.configureTestingModule({
      imports: [EntityDetailDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { entityType: 'stay', entityId: 'stay-1' } },
        { provide: OwnerApiService, useValue: api },
        { provide: CatApiService, useValue: catApi },
        { provide: VetApiService, useValue: vetApi },
        { provide: StayApiService, useValue: stayApi },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EntityDetailDialog);
    fixture.detectChanges();
    const edit = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find(
      (button) => button.textContent?.trim() === fixture.componentInstance.text().stays.detail.edit,
    );
    expect(edit !== undefined).toBe(editable);
    expect(fixture.nativeElement.textContent).toContain(
      fixture.componentInstance.text().stays.status[
        status === 'RESERVED'
          ? 'reserved'
          : status === 'CHECKED_IN'
            ? 'checked-in'
            : status === 'CHECKED_OUT'
              ? 'checked-out'
              : 'cancelled'
      ],
    );
  });

  it('keeps pricing alongside eligible cancellation and after authoritative cancellation', async () => {
    const afterClosed = new Subject<boolean>();
    const completeStay = {
      ...operationalStay,
      agreedAmount: '100',
      catIds: ['cat-1', 'cat-2', 'cat-3', 'cat-4'],
      cats: [
        { catId: 'cat-1', name: 'Milo' },
        { catId: 'cat-2', name: 'Nina' },
        { catId: 'cat-3', name: 'Luna' },
        { catId: 'cat-4', name: 'Leo' },
      ],
    };
    const delayedCompleteStay = new Subject<Stay>();
    const materialDialog = {
      open: vi.fn(() => ({ afterClosed: () => afterClosed.asObservable() })),
    };
    stayApi.getStayDetail
      .mockReturnValueOnce(
        of({
          stayId: 'stay-1',
          status: 'RESERVED',
          startAt: '2030-01-01T10:00:00',
          endAt: '2030-01-03T10:00:00',
          numberOfNights: 2,
          notes: null,
          owner: { id: 'owner-1', fullName: 'Ada Lovelace' },
          cats: { totalElements: 4, items: [] },
        }),
      )
      .mockReturnValueOnce(
        of({
          stayId: 'stay-1',
          status: 'CANCELLED',
          startAt: '2030-01-01T10:00:00',
          endAt: '2030-01-03T10:00:00',
          numberOfNights: 2,
          notes: null,
          owner: { id: 'owner-1', fullName: 'Ada Lovelace' },
          cats: { totalElements: 0, items: [] },
        }),
      );
    stayApi.getStayById
      .mockReturnValueOnce(delayedCompleteStay.asObservable())
      .mockReturnValueOnce(delayedCompleteStay.asObservable())
      .mockReturnValue(of(completeStay));
    await TestBed.configureTestingModule({
      imports: [EntityDetailDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { entityType: 'stay', entityId: 'stay-1' } },
        { provide: OwnerApiService, useValue: api },
        { provide: CatApiService, useValue: catApi },
        { provide: VetApiService, useValue: vetApi },
        { provide: StayApiService, useValue: stayApi },
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MatDialog, useValue: materialDialog },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EntityDetailDialog);
    const emitted = vi.fn();
    fixture.componentInstance.entityUpdated.subscribe(emitted);
    fixture.detectChanges();

    const cancelButton = buttonContaining(
      fixture,
      fixture.componentInstance.text().stays.cancellation.action,
    );
    cancelButton.click();
    fixture.detectChanges();

    expect(materialDialog.open).not.toHaveBeenCalled();
    expect(cancelButton.disabled).toBe(true);
    expect(stayApi.getStayById).toHaveBeenCalledTimes(2);

    delayedCompleteStay.next(completeStay);
    fixture.detectChanges();

    expect(materialDialog.open).toHaveBeenCalledWith(
      StayCancellationDialog,
      expect.objectContaining({
        data: expect.objectContaining({
          stayId: 'stay-1',
          catNames: ['Milo', 'Nina', 'Luna', 'Leo'],
          ownerName: 'Ada Lovelace',
        }),
      }),
    );
    expect(stayApi.getStayDetail).toHaveBeenCalledTimes(1);

    afterClosed.next(true);
    fixture.detectChanges();

    expect(stayApi.getStayDetail).toHaveBeenCalledTimes(2);
    expect(emitted).toHaveBeenCalledWith({ entityType: 'stay', entityId: 'stay-1' });
    expect(fixture.nativeElement.textContent).toContain(
      fixture.componentInstance.text().stays.status.cancelled,
    );
    expect(fixture.nativeElement.textContent).toContain(
      fixture.componentInstance.text().stays.detail.pricing,
    );
    expect(
      [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].some(
        (button) =>
          button.textContent?.trim() === fixture.componentInstance.text().stays.cancellation.action,
      ),
    ).toBe(false);
  });

  it('blocks permanent deletion while independently loaded cancellation context is pending', async () => {
    const pricingGate = new Subject<Stay>();
    const cancellationContext = new Subject<Stay>();
    const cancellationClosed = new Subject<boolean>();
    const deletionClosed = new Subject<boolean>();
    const materialDialog = {
      open: vi.fn((component: unknown) => ({
        afterClosed: () =>
          component === StayCancellationDialog ? cancellationClosed : deletionClosed,
      })),
    };
    const deletableStay = { ...operationalStay, canDelete: true };
    stayApi.getStayDetail.mockReturnValue(of(stayDetailResponse('stay-1')));
    stayApi.getStayById
      .mockReturnValueOnce(pricingGate.asObservable())
      .mockReturnValueOnce(cancellationContext.asObservable());
    await TestBed.configureTestingModule({
      imports: [StayDetail],
      providers: [
        provideNoopAnimations(),
        { provide: StayApiService, useValue: stayApi },
        { provide: MatDialog, useValue: materialDialog },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(StayDetail);
    fixture.componentRef.setInput('entityId', 'stay-1');
    fixture.componentRef.setInput('editing', false);
    fixture.detectChanges();

    buttonContaining(fixture, fixture.componentInstance.text().stays.cancellation.action).click();
    fixture.detectChanges();
    expect(stayApi.getStayById).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.cancellationContextLoading()).toBe(true);

    pricingGate.next(deletableStay);
    fixture.detectChanges();
    const deleteButton = buttonContaining(
      fixture,
      fixture.componentInstance.text().deletion.actions.deletePermanently,
    );
    expect(deleteButton.disabled).toBe(true);
    fixture.componentInstance.confirmPermanentDeletion(fixture.componentInstance.detail()!);
    expect(materialDialog.open).not.toHaveBeenCalled();
    expect(stayApi.deleteStay).not.toHaveBeenCalled();

    cancellationContext.next(deletableStay);
    fixture.detectChanges();
    expect(materialDialog.open).toHaveBeenCalledWith(
      StayCancellationDialog,
      expect.objectContaining({ data: expect.objectContaining({ stayId: 'stay-1' }) }),
    );
    expect(fixture.componentInstance.cancellationContextLoading()).toBe(false);

    cancellationClosed.next(false);
    cancellationClosed.complete();
    fixture.componentInstance.confirmPermanentDeletion(fixture.componentInstance.detail()!);
    expect(materialDialog.open).toHaveBeenLastCalledWith(
      PermanentDeletionConfirmationDialog,
      expect.any(Object),
    );
  });

  it('renders deletion only for exact eligibility and supplies a human Stay subject without deleting on dismissal', async () => {
    const afterClosed = new Subject<boolean>();
    const materialDialog = {
      open: vi.fn(() => ({ afterClosed: () => afterClosed.asObservable() })),
    };
    stayApi.getStayDetail.mockReturnValue(of(stayDetailResponse('stay-1')));
    stayApi.getStayById.mockReturnValue(
      of({
        ...operationalStay,
        canDelete: true,
        agreedAmount: '100',
        ownerName: 'Ada Lovelace',
        cats: [
          { catId: 'cat-1', name: 'Milo' },
          { catId: 'cat-2', name: 'Nina' },
        ],
      }),
    );
    await TestBed.configureTestingModule({
      imports: [StayDetail],
      providers: [
        provideNoopAnimations(),
        { provide: StayApiService, useValue: stayApi },
        { provide: MatDialog, useValue: materialDialog },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(StayDetail);
    fixture.componentRef.setInput('entityId', 'stay-1');
    fixture.componentRef.setInput('editing', false);
    fixture.detectChanges();

    expect(
      [...(fixture.nativeElement as HTMLElement).querySelectorAll('.detail-actions button')].map(
        (button) => button.textContent?.trim(),
      ),
    ).toEqual([
      fixture.componentInstance.text().stays.cancellation.action,
      fixture.componentInstance.text().deletion.actions.deletePermanently,
      fixture.componentInstance.text().stays.detail.pricing,
      fixture.componentInstance.text().stays.detail.edit,
    ]);

    buttonContaining(
      fixture,
      fixture.componentInstance.text().deletion.actions.deletePermanently,
    ).click();
    expect(materialDialog.open).toHaveBeenCalledWith(
      PermanentDeletionConfirmationDialog,
      expect.objectContaining({
        data: expect.objectContaining({
          subject: expect.stringMatching(/Milo, Nina.*Ada Lovelace.*2030/),
        }),
      }),
    );
    afterClosed.next(false);
    expect(stayApi.deleteStay).not.toHaveBeenCalled();

    fixture.componentInstance.pricingStay.set({ ...operationalStay, canDelete: false });
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).not.toContain(
      fixture.componentInstance.text().deletion.actions.deletePermanently,
    );
  });

  it.each([
    ['204', null],
    ['404', new HttpErrorResponse({ status: 404 })],
  ] as const)('locks one root deletion request and completes on %s', async (_label, failure) => {
    const confirmation = new Subject<boolean>();
    const deletion = new Subject<void>();
    stayApi.getStayDetail.mockReturnValue(
      of({
        ...stayDetailResponse('stay-1'),
        cats: {
          totalElements: 2,
          items: [catItem('cat-1'), catItem('cat-2')],
        },
      }),
    );
    stayApi.getStayById.mockReturnValue(of({ ...operationalStay, canDelete: true }));
    stayApi.deleteStay.mockReturnValue(deletion);
    await TestBed.configureTestingModule({
      imports: [EntityDetailDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { entityType: 'stay', entityId: 'stay-1' } },
        { provide: OwnerApiService, useValue: api },
        { provide: CatApiService, useValue: catApi },
        { provide: VetApiService, useValue: vetApi },
        { provide: StayApiService, useValue: stayApi },
        { provide: MatDialogRef, useValue: dialogRef },
        {
          provide: MatDialog,
          useValue: { open: vi.fn(() => ({ afterClosed: () => confirmation.asObservable() })) },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EntityDetailDialog);
    const emitted = vi.fn();
    fixture.componentInstance.entityUpdated.subscribe(emitted);
    fixture.detectChanges();
    buttonContaining(
      fixture,
      fixture.componentInstance.text().deletion.actions.deletePermanently,
    ).click();
    confirmation.next(true);
    fixture.detectChanges();

    expect(stayApi.deleteStay).toHaveBeenCalledOnce();
    expect(dialogRef.disableClose).toBe(true);
    expect(fixture.nativeElement.textContent).toContain(
      fixture.componentInstance.text().deletion.actions.deleting,
    );
    const referenceBeforeNavigation = fixture.componentInstance.reference();
    const historyBeforeNavigation = fixture.componentInstance.history();
    const relatedButtons = Array.from(
      fixture.nativeElement.querySelectorAll('.detail-field dd button, .relationship-group button'),
    ) as HTMLButtonElement[];
    expect(relatedButtons).toHaveLength(3);
    expect(relatedButtons.every((button) => button.disabled)).toBe(true);
    fixture.componentInstance.showReference({ entityType: 'owner', entityId: 'owner-1' });
    fixture.componentInstance.openCats({ entityType: 'stay', entityId: 'stay-1' });
    fixture.componentInstance.openStays({ entityType: 'owner', entityId: 'owner-1' });
    fixture.componentInstance.openCatPhoto({
      catId: 'cat-1',
      catName: 'Milo',
      ownerName: 'Ada Lovelace',
    });
    fixture.componentInstance.openStayPricing();
    fixture.componentInstance.back();
    expect(fixture.componentInstance.reference()).toBe(referenceBeforeNavigation);
    expect(fixture.componentInstance.history()).toBe(historyBeforeNavigation);
    expect(dialogRef.close).not.toHaveBeenCalled();
    const stayDetail = fixture.debugElement.query(By.directive(StayDetail))
      .componentInstance as StayDetail;
    stayDetail.detail.set({
      ...stayDetailResponse('stay-1'),
      cats: { totalElements: 4, items: [] },
    });
    fixture.detectChanges();
    expect(
      buttonContaining(fixture, fixture.componentInstance.text().entityDetail.associatedRecords(4))
        .disabled,
    ).toBe(true);
    buttonContaining(fixture, fixture.componentInstance.text().deletion.actions.deleting).click();
    expect(stayApi.deleteStay).toHaveBeenCalledOnce();

    if (failure) deletion.error(failure);
    else deletion.next();
    fixture.detectChanges();
    expect(emitted).toHaveBeenCalledWith({ entityType: 'stay', entityId: 'stay-1' });
    expect(dialogRef.close).toHaveBeenCalledOnce();
    expect(dialogRef.disableClose).toBe(false);
  });

  it.each([
    [403, 'forbidden'],
    [409, 'conflict'],
    [500, 'generic'],
  ] as const)('retains Stay detail with shared %s deletion feedback', async (status, kind) => {
    const confirmation = new Subject<boolean>();
    stayApi.getStayDetail.mockReturnValue(of(stayDetailResponse('stay-1')));
    stayApi.getStayById.mockReturnValue(of({ ...operationalStay, canDelete: true }));
    stayApi.deleteStay.mockReturnValue(throwError(() => new HttpErrorResponse({ status })));
    await TestBed.configureTestingModule({
      imports: [StayDetail],
      providers: [
        provideNoopAnimations(),
        { provide: StayApiService, useValue: stayApi },
        {
          provide: MatDialog,
          useValue: { open: vi.fn(() => ({ afterClosed: () => confirmation.asObservable() })) },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(StayDetail);
    fixture.componentRef.setInput('entityId', 'stay-1');
    fixture.componentRef.setInput('editing', false);
    fixture.detectChanges();
    buttonContaining(
      fixture,
      fixture.componentInstance.text().deletion.actions.deletePermanently,
    ).click();
    confirmation.next(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      fixture.componentInstance.text().deletion.errors[kind],
    );
    expect(fixture.nativeElement.textContent).toContain('Ada Lovelace');
  });

  it('returns nested deletion through Back and reloads the immediately previous detail', async () => {
    await TestBed.configureTestingModule({
      imports: [EntityDetailDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { entityType: 'owner', entityId: 'owner-1' } },
        { provide: OwnerApiService, useValue: api },
        { provide: CatApiService, useValue: catApi },
        { provide: VetApiService, useValue: vetApi },
        { provide: StayApiService, useValue: stayApi },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EntityDetailDialog);
    const emitted = vi.fn();
    fixture.componentInstance.entityUpdated.subscribe(emitted);
    fixture.detectChanges();
    fixture.componentInstance.showReference({ entityType: 'stay', entityId: 'stay-1' });
    fixture.detectChanges();
    const ownerLoads = api.getOwnerDetail.mock.calls.length;
    const stay = fixture.debugElement.query(By.directive(StayDetail))
      .componentInstance as StayDetail;
    stay.deletionCompleted.emit({ entityType: 'stay', entityId: 'stay-1' });
    fixture.detectChanges();
    expect(fixture.componentInstance.reference()).toEqual({
      entityType: 'owner',
      entityId: 'owner-1',
    });
    expect(api.getOwnerDetail.mock.calls.length).toBeGreaterThan(ownerLoads);
    expect(emitted).not.toHaveBeenCalled();
    expect(dialogRef.close).not.toHaveBeenCalled();
  });

  it('reloads and clamps the immediately previous relationship page after nested deletion', async () => {
    const page = (pageNumber: number, totalPages: number) => ({
      items: [],
      page: pageNumber,
      pageSize: 5,
      totalElements: totalPages * 5,
      totalPages,
    });
    api.getOwnerStays
      .mockReturnValueOnce(of(page(0, 3)))
      .mockReturnValueOnce(of(page(2, 3)))
      .mockReturnValueOnce(of(page(2, 2)))
      .mockReturnValueOnce(of(page(1, 2)));
    await TestBed.configureTestingModule({
      imports: [EntityDetailDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { entityType: 'owner', entityId: 'owner-1' } },
        { provide: OwnerApiService, useValue: api },
        { provide: CatApiService, useValue: catApi },
        { provide: VetApiService, useValue: vetApi },
        { provide: StayApiService, useValue: stayApi },
        { provide: MatDialogRef, useValue: dialogRef },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EntityDetailDialog);
    fixture.detectChanges();
    fixture.componentInstance.openStays({ entityType: 'owner', entityId: 'owner-1' });
    fixture.componentInstance.pageChanged({ pageIndex: 2 } as any);
    fixture.componentInstance.showReference({ entityType: 'stay', entityId: 'stay-1' });
    fixture.detectChanges();
    const stay = fixture.debugElement.query(By.directive(StayDetail))
      .componentInstance as StayDetail;
    stay.deletionCompleted.emit({ entityType: 'stay', entityId: 'stay-1' });
    fixture.detectChanges();
    expect(api.getOwnerStays).toHaveBeenLastCalledWith('owner-1', 1);
    expect(fixture.componentInstance.relationshipPage()?.page).toBe(1);
    expect(fixture.componentInstance.entry()).toMatchObject({ kind: 'list', page: 1 });
  });

  function catItem(id: string) {
    return { id, name: 'Milo', ownerId: 'owner-1', ownerName: 'Ada Lovelace' };
  }

  function stayDetailResponse(stayId: string) {
    return {
      stayId,
      status: 'RESERVED' as const,
      startAt: '2030-01-01T10:00:00',
      endAt: '2030-01-03T10:00:00',
      numberOfNights: 2,
      notes: null,
      owner: { id: 'owner-1', fullName: 'Ada Lovelace' },
      cats: { totalElements: 0, items: [] },
    };
  }

  function buttonContaining(
    fixture: { nativeElement: HTMLElement },
    text: string,
  ): HTMLButtonElement {
    const button = [...fixture.nativeElement.querySelectorAll('button')].find((candidate) =>
      candidate.textContent?.includes(text),
    );
    expect(button).toBeDefined();
    return button!;
  }
});

describe('EntityDetailDialog cat photo destination', () => {
  it('owns private loading, success, missing, error, back, and URL cleanup states', async () => {
    const photo = new Subject<Blob>();
    const beforeClosed = new Subject<void>();
    const catApi = {
      getCatDetail: vi.fn(() =>
        of({
          cat: {
            id: 'cat-1',
            name: 'Milo',
            birthDate: '2020-01-01',
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
            ownerName: 'Ada',
            vetId: null,
            vetName: null,
            hasPhoto: true,
          },
          stays: { totalElements: 0, items: [] },
        }),
      ),
      getCatPhoto: vi.fn(() => photo.asObservable()),
    };
    const createUrl = vi
      .fn<() => string>()
      .mockReturnValueOnce('blob:cat-photo')
      .mockReturnValueOnce('blob:portrait-photo')
      .mockReturnValueOnce('blob:broken-photo')
      .mockReturnValueOnce('blob:close-photo');
    const revokeUrl = vi.fn();
    vi.stubGlobal('URL', { ...URL, createObjectURL: createUrl, revokeObjectURL: revokeUrl });
    await TestBed.configureTestingModule({
      imports: [EntityDetailDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: { entityType: 'cat', entityId: 'cat-1' } },
        { provide: CatApiService, useValue: catApi },
        { provide: OwnerApiService, useValue: {} },
        { provide: VetApiService, useValue: {} },
        { provide: StayApiService, useValue: {} },
        {
          provide: MatDialogRef,
          useValue: {
            disableClose: false,
            close: vi.fn(),
            updateSize: vi.fn(),
            beforeClosed: () => beforeClosed.asObservable(),
          },
        },
        { provide: Router, useValue: { url: '/', navigate: vi.fn() } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(EntityDetailDialog);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const viewPhoto = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find(
      (button) =>
        button.textContent?.trim() === fixture.componentInstance.text().cats.detail.viewPhoto,
    )!;
    expect(
      [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].filter(
        (button) =>
          button.textContent?.trim() === fixture.componentInstance.text().cats.detail.viewPhoto,
      ),
    ).toHaveLength(1);
    viewPhoto.click();
    fixture.detectChanges();
    expect(catApi.getCatPhoto).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.photoState()).toBe('loading');
    expect(fixture.componentInstance.title()).toBe(
      `${fixture.componentInstance.text().cats.detail.photo} — Milo (Ada)`,
    );

    photo.next(new Blob(['jpeg'], { type: 'image/jpeg' }));
    fixture.detectChanges();
    expect(createUrl).toHaveBeenCalledTimes(1);
    expect((fixture.nativeElement as HTMLElement).querySelector('img')?.getAttribute('src')).toBe(
      'blob:cat-photo',
    );
    expect(fixture.componentInstance.photoState()).toBe('loading');
    const settle = vi.spyOn(fixture.componentInstance, 'destinationSettled');
    const firstImage = (fixture.nativeElement as HTMLElement).querySelector('img')!;
    Object.defineProperties(firstImage, {
      naturalWidth: { configurable: true, value: 1600 },
      naturalHeight: { configurable: true, value: 900 },
    });
    firstImage.dispatchEvent(new Event('load'));
    expect(fixture.componentInstance.photoState()).toBe('success');
    expect(settle).toHaveBeenCalledTimes(1);
    const photoDialogRef = TestBed.inject(MatDialogRef);
    expect(photoDialogRef.updateSize).toHaveBeenCalled();
    expect(fixture.componentInstance.photoWidth()).toBeGreaterThan(
      fixture.componentInstance.photoHeight()!,
    );
    fixture.componentInstance.back();
    expect(photoDialogRef.updateSize).toHaveBeenLastCalledWith(
      'min(52rem, calc(100vw - 2rem))',
      '',
    );
    expect(revokeUrl).toHaveBeenCalledExactlyOnceWith('blob:cat-photo');
    expect(fixture.componentInstance.entry().kind).toBe('detail');
    firstImage.dispatchEvent(new Event('error'));
    expect(revokeUrl).toHaveBeenCalledTimes(1);

    catApi.getCatPhoto.mockReturnValueOnce(of(new Blob(['portrait'], { type: 'image/jpeg' })));
    fixture.componentInstance.openCatPhoto({
      catId: 'cat-1',
      catName: 'Milo with a long display name',
      ownerName: 'Ada with a long display name',
    });
    fixture.detectChanges();
    const portraitImage = (fixture.nativeElement as HTMLElement).querySelector('img')!;
    Object.defineProperties(portraitImage, {
      naturalWidth: { configurable: true, value: 600 },
      naturalHeight: { configurable: true, value: 1200 },
    });
    portraitImage.dispatchEvent(new Event('load'));
    expect(fixture.componentInstance.photoWidth()).toBeLessThan(
      fixture.componentInstance.photoHeight()!,
    );
    fixture.componentInstance.back();
    expect(revokeUrl).toHaveBeenCalledWith('blob:portrait-photo');

    catApi.getCatPhoto.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 404 })),
    );
    fixture.componentInstance.openCatPhoto({ catId: 'cat-1', catName: 'Milo', ownerName: 'Ada' });
    expect(fixture.componentInstance.photoState()).toBe('missing');
    fixture.componentInstance.back();
    catApi.getCatPhoto.mockReturnValueOnce(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    fixture.componentInstance.openCatPhoto({ catId: 'cat-1', catName: 'Milo', ownerName: 'Ada' });
    expect(fixture.componentInstance.photoState()).toBe('error');

    const broken = new Subject<Blob>();
    catApi.getCatPhoto.mockReturnValueOnce(broken.asObservable());
    fixture.componentInstance.back();
    fixture.componentInstance.openCatPhoto({ catId: 'cat-1', catName: 'Milo', ownerName: 'Ada' });
    broken.next(new Blob(['broken'], { type: 'image/jpeg' }));
    fixture.detectChanges();
    const brokenImage = (fixture.nativeElement as HTMLElement).querySelector('img')!;
    brokenImage.dispatchEvent(new Event('error'));
    expect(fixture.componentInstance.photoState()).toBe('error');
    expect(revokeUrl).toHaveBeenCalledWith('blob:broken-photo');
    brokenImage.dispatchEvent(new Event('load'));
    expect(fixture.componentInstance.photoState()).toBe('error');

    const closePhoto = new Subject<Blob>();
    catApi.getCatPhoto.mockReturnValueOnce(closePhoto.asObservable());
    fixture.componentInstance.back();
    fixture.componentInstance.openCatPhoto({ catId: 'cat-1', catName: 'Milo', ownerName: 'Ada' });
    expect(closePhoto.observers).toHaveLength(1);
    beforeClosed.next();
    expect(closePhoto.observers).toHaveLength(0);
    closePhoto.next(new Blob(['late'], { type: 'image/jpeg' }));
    expect(createUrl).toHaveBeenCalledTimes(3);

    const loadedBeforeClose = new Subject<Blob>();
    catApi.getCatPhoto.mockReturnValueOnce(loadedBeforeClose.asObservable());
    fixture.componentInstance.openCatPhoto({ catId: 'cat-1', catName: 'Milo', ownerName: 'Ada' });
    loadedBeforeClose.next(new Blob(['jpeg'], { type: 'image/jpeg' }));
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector('img')!.dispatchEvent(new Event('load'));
    expect(fixture.componentInstance.photoState()).toBe('success');
    beforeClosed.next();
    expect(revokeUrl).toHaveBeenCalledWith('blob:close-photo');
    const revokeCount = revokeUrl.mock.calls.length;
    fixture.destroy();
    expect(revokeUrl).toHaveBeenCalledTimes(revokeCount);
    vi.unstubAllGlobals();
  });
});
describe('Route-free StayEditor migrated coverage', () => {
  let component: StayEditor;
  let fixture: ComponentFixture<StayEditor>;
  let dialogClosed: Subject<boolean | undefined>;

  const stay: Stay = {
    stayId: 'stay-1',
    startAt: '2099-01-02T10:00:00',
    endAt: '2099-01-09T10:00:00',
    numberOfNights: 7,
    cancelledAt: null,
    createdAt: '2026-07-02T10:00:00',
    updatedAt: '2026-07-02T10:00:00',
    notes: 'needs quiet room',
    catIds: ['cat-1', 'cat-2'],
    ownerId: 'owner-1',
    ownerName: 'Ada Lovelace',
    cats: [
      { catId: 'cat-1', name: 'Milo' },
      { catId: 'cat-2', name: 'Luna' },
    ],
    retainedNightlyRate: '50',
    suggestedAmount: '100',
    agreedAmount: '100',
    totalPaid: '0',
    remainingAmount: '100',
    paymentCondition: 'NO_PAYMENT',
    outstandingCollectionEligible: true,
    payments: [],
  };

  const closedStay: Stay = {
    ...stay,
    startAt: '2020-01-02T10:00:00',
    endAt: '2020-01-09T10:00:00',
  };

  const stayApiService = {
    getStayById: vi.fn(),
    updateStay: vi.fn(),
    previewDateChangePricing: vi.fn(),
  };

  const nightlyReferenceRateApiService = {
    getCurrentRates: vi.fn(),
  };

  const authSessionService = {
    hasRole: vi.fn(),
  };

  const matDialog = {
    open: vi.fn(),
  };

  const vaccineConflict = {
    code: 'VACCINE_VALIDITY_CONFLICT',
    violations: [
      {
        catId: 'cat-1',
        catName: 'Milo',
        vaccineType: 'RABIES',
        reason: 'EXPIRED',
        vaccinatedOn: '2025-07-01',
        expiresOn: '2026-07-01',
      },
    ],
  };

  beforeEach(async () => {
    vi.resetAllMocks();
    authSessionService.hasRole.mockReturnValue(true);
    dialogClosed = new Subject<boolean | undefined>();
    matDialog.open.mockReturnValue({
      afterClosed: () => dialogClosed.asObservable(),
    });
    stayApiService.getStayById.mockReturnValue(of(stay));
    stayApiService.previewDateChangePricing.mockReturnValue(
      of({
        pricingDecisionRequired: false,
        currentNumberOfNights: 7,
        currentAgreedAmount: '100',
        numberOfNights: 7,
        retainedNightlyRate: '50',
        suggestedAmount: '100',
        confirmation: null,
      }),
    );
    nightlyReferenceRateApiService.getCurrentRates.mockReturnValue(of([]));
    window.scrollTo = vi.fn();

    await TestBed.configureTestingModule({
      imports: [StayEditor],
      providers: [
        provideNoopAnimations(),
        {
          provide: StayApiService,
          useValue: stayApiService,
        },
        {
          provide: NightlyReferenceRateApiService,
          useValue: nightlyReferenceRateApiService,
        },
        {
          provide: AuthSessionService,
          useValue: authSessionService,
        },
        {
          provide: MatDialog,
          useValue: matDialog,
        },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  function createComponent(entity: Stay = stay): void {
    fixture = TestBed.createComponent(StayEditor);
    fixture.componentRef.setInput('entity', entity);
    fixture.componentRef.setInput('showCancel', true);
    fixture.detectChanges();
    component = fixture.componentInstance;
  }

  it('does not offer suggested amount adoption in existing-stay repricing', () => {
    stayApiService.previewDateChangePricing.mockReturnValue(
      of({
        pricingDecisionRequired: true,
        currentNumberOfNights: 7,
        currentAgreedAmount: '100',
        numberOfNights: 8,
        retainedNightlyRate: '50',
        suggestedAmount: '400',
        confirmation: {
          previousNumberOfNights: 7,
          previousAgreedAmount: '100',
          numberOfNights: 8,
          retainedNightlyRate: '50',
          suggestedAmount: '400',
        },
      }),
    );
    createComponent();
    fixture.detectChanges();

    const button = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')].find(
      (candidate) =>
        candidate.textContent?.trim() === component.text().stays.pricing.useSuggestedAmount,
    );

    expect(button).toBeUndefined();
  });

  it('does not offer suggested amount adoption when repricing has no suggestion', () => {
    const nullRateStay = { ...stay, retainedNightlyRate: null, suggestedAmount: null };
    stayApiService.previewDateChangePricing.mockReturnValue(
      of({
        pricingDecisionRequired: true,
        currentNumberOfNights: 7,
        currentAgreedAmount: '100',
        numberOfNights: 8,
        retainedNightlyRate: null,
        suggestedAmount: null,
        confirmation: {
          previousNumberOfNights: 7,
          previousAgreedAmount: '100',
          numberOfNights: 8,
          retainedNightlyRate: null,
          suggestedAmount: null,
        },
      }),
    );
    createComponent(nullRateStay);
    fixture.detectChanges();

    const actions = [...(fixture.nativeElement as HTMLElement).querySelectorAll('button')];
    expect(
      actions.some(
        (candidate) =>
          candidate.textContent?.trim() === component.text().stays.pricing.useSuggestedAmount,
      ),
    ).toBe(false);
  });

  it('toggles between original and current retained rates and invalidates confirmation', () => {
    nightlyReferenceRateApiService.getCurrentRates.mockReturnValue(
      of([{ minimumCatCount: 2, nightlyRate: '60' }]),
    );
    stayApiService.previewDateChangePricing.mockReturnValue(
      of({
        pricingDecisionRequired: true,
        currentNumberOfNights: 7,
        currentAgreedAmount: '100',
        numberOfNights: 8,
        retainedNightlyRate: '50',
        suggestedAmount: '400',
        confirmation: {
          previousNumberOfNights: 7,
          previousAgreedAmount: '100',
          numberOfNights: 8,
          retainedNightlyRate: '50',
          suggestedAmount: '400',
        },
      }),
    );
    createComponent();
    component.pricingConfirmed.set(true);

    component.toggleRetainedRate();
    expect(component.workingRetainedNightlyRate()).toBe('60');
    expect(component.workingSuggestedAmount()).toBe('480');
    expect(component.agreedAmount()).toBe('480');
    expect(component.pricingConfirmed()).toBe(false);
    expect(component.retainedRateActionLabel()).toBe(
      component.text().stays.pricing.useOriginalRate,
    );
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      component.text().stays.pricing.useOriginalRate,
    );
    expect(
      (fixture.nativeElement as HTMLElement).querySelectorAll('.pricing-helper-actions button'),
    ).toHaveLength(1);
    const localizedOriginalAction = component.text().stays.pricing.useOriginalRate;
    TestBed.inject(I18nService).toggleLanguage();
    TestBed.flushEffects();
    fixture.detectChanges();
    expect(component.text().stays.pricing.useOriginalRate).not.toBe(localizedOriginalAction);
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      component.text().stays.pricing.useOriginalRate,
    );

    component.toggleRetainedRate();
    expect(component.workingRetainedNightlyRate()).toBe('50');
    expect(component.agreedAmount()).toBe('400');
  });

  it('returns a null original rate and restores its pre-switch agreement', () => {
    const nullRateStay = {
      ...stay,
      retainedNightlyRate: null,
      suggestedAmount: null,
      agreedAmount: '123',
    };
    nightlyReferenceRateApiService.getCurrentRates.mockReturnValue(
      of([{ minimumCatCount: 2, nightlyRate: '60' }]),
    );
    stayApiService.previewDateChangePricing.mockReturnValue(
      of({
        pricingDecisionRequired: true,
        currentNumberOfNights: 7,
        currentAgreedAmount: '123',
        numberOfNights: 8,
        retainedNightlyRate: null,
        suggestedAmount: null,
        confirmation: {
          previousNumberOfNights: 7,
          previousAgreedAmount: '123',
          numberOfNights: 8,
          retainedNightlyRate: null,
          suggestedAmount: null,
        },
      }),
    );
    createComponent(nullRateStay);

    component.toggleRetainedRate();
    expect(component.agreedAmount()).toBe('480');
    expect(component.retainedRateActionLabel()).toBe(
      component.text().stays.pricing.returnWithoutRate,
    );
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      component.text().stays.pricing.returnWithoutRate,
    );

    component.toggleRetainedRate();
    expect(component.workingRetainedNightlyRate()).toBeNull();
    expect(component.workingSuggestedAmount()).toBeNull();
    expect(component.agreedAmount()).toBe('123');
  });

  it('resets the agreement to the selected-rate suggestion when the night count changes', () => {
    createComponent();
    component.workingRetainedNightlyRate.set('60');
    component.agreedAmount.set('777');
    component.pricingConfirmed.set(true);
    stayApiService.previewDateChangePricing.mockReturnValue(
      of({
        pricingDecisionRequired: true,
        currentNumberOfNights: 7,
        currentAgreedAmount: '100',
        numberOfNights: 8,
        retainedNightlyRate: '50',
        suggestedAmount: '400',
        confirmation: {
          previousNumberOfNights: 7,
          previousAgreedAmount: '100',
          numberOfNights: 8,
          retainedNightlyRate: '50',
          suggestedAmount: '400',
        },
      }),
    );

    component.onEndAtChange('2099-01-10T10:00');

    expect(component.workingRetainedNightlyRate()).toBe('60');
    expect(component.workingSuggestedAmount()).toBe('480');
    expect(component.agreedAmount()).toBe('480');
    expect(component.pricingConfirmed()).toBe(false);
  });

  it('restores the persisted agreement when nights change with no retained rate', () => {
    const nullRateStay = {
      ...stay,
      retainedNightlyRate: null,
      suggestedAmount: null,
      agreedAmount: '123',
    };
    nightlyReferenceRateApiService.getCurrentRates.mockReturnValue(
      of([{ minimumCatCount: 2, nightlyRate: '60' }]),
    );
    createComponent(nullRateStay);
    component.agreedAmount.set('777');
    component.pricingConfirmed.set(true);
    stayApiService.previewDateChangePricing.mockReturnValue(
      of({
        pricingDecisionRequired: true,
        currentNumberOfNights: 7,
        currentAgreedAmount: '123',
        numberOfNights: 8,
        retainedNightlyRate: null,
        suggestedAmount: null,
        confirmation: {
          previousNumberOfNights: 7,
          previousAgreedAmount: '123',
          numberOfNights: 8,
          retainedNightlyRate: null,
          suggestedAmount: null,
        },
      }),
    );

    component.onEndAtChange('2099-01-10T10:00');

    expect(component.workingRetainedNightlyRate()).toBeNull();
    expect(component.workingSuggestedAmount()).toBeNull();
    expect(component.agreedAmount()).toBe('123');
    expect(component.pricingConfirmed()).toBe(false);

    component.toggleRetainedRate();
    expect(component.agreedAmount()).toBe('480');
    component.toggleRetainedRate();
    expect(component.agreedAmount()).toBe('123');
  });

  it('preserves a manual agreement when a date edit keeps the same night count', () => {
    createComponent();
    component.agreedAmount.set('777');
    stayApiService.previewDateChangePricing.mockReturnValue(
      of({
        pricingDecisionRequired: false,
        currentNumberOfNights: 7,
        currentAgreedAmount: '100',
        numberOfNights: 7,
        retainedNightlyRate: '50',
        suggestedAmount: '350',
        confirmation: null,
      }),
    );

    component.onStartAtChange('2099-01-02T11:00');
    fixture.detectChanges();

    expect(component.workingRetainedNightlyRate()).toBe('50');
    expect(component.workingSuggestedAmount()).toBe('350');
    expect(component.agreedAmount()).toBe('777');
    expect(
      (fixture.nativeElement as HTMLElement)
        .querySelector('.pricing-summary > div:nth-child(4) dd')
        ?.textContent?.trim(),
    ).toBe('350');
    expect((fixture.nativeElement as HTMLElement).textContent).toContain(
      component.text().stays.pricing.noReconfirmation,
    );
  });

  it('restores persisted pricing state after returning to the original night count', () => {
    const nullRateStay = {
      ...stay,
      retainedNightlyRate: null,
      suggestedAmount: null,
      agreedAmount: '123',
    };
    nightlyReferenceRateApiService.getCurrentRates.mockReturnValue(
      of([{ minimumCatCount: 2, nightlyRate: '60' }]),
    );
    createComponent(nullRateStay);
    stayApiService.previewDateChangePricing.mockReturnValue(
      of({
        pricingDecisionRequired: true,
        currentNumberOfNights: 7,
        currentAgreedAmount: '123',
        numberOfNights: 8,
        retainedNightlyRate: null,
        suggestedAmount: null,
        confirmation: {
          previousNumberOfNights: 7,
          previousAgreedAmount: '123',
          numberOfNights: 8,
          retainedNightlyRate: null,
          suggestedAmount: null,
        },
      }),
    );
    component.onEndAtChange('2099-01-10T10:00');
    component.toggleRetainedRate();
    expect(component.workingRetainedNightlyRate()).toBe('60');
    expect(component.workingSuggestedAmount()).toBe('480');

    stayApiService.previewDateChangePricing.mockReturnValue(
      of({
        pricingDecisionRequired: false,
        currentNumberOfNights: 7,
        currentAgreedAmount: '123',
        numberOfNights: 7,
        retainedNightlyRate: null,
        suggestedAmount: null,
        confirmation: null,
      }),
    );
    component.onEndAtChange('2099-01-09T10:00');

    expect(component.pricingPreview()?.pricingDecisionRequired).toBe(false);
    expect(component.workingRetainedNightlyRate()).toBeNull();
    expect(component.workingSuggestedAmount()).toBeNull();
    expect(component.retainedRateActionLabel()).toBeNull();
    expect(component.pricingConfirmed()).toBe(false);
  });

  it.each([null, 'malformed', '0', '50'])(
    'hides the retained-rate action on the visible surface for current rate %s',
    (nightlyRate) => {
      nightlyReferenceRateApiService.getCurrentRates.mockReturnValue(
        of(nightlyRate === null ? [] : [{ minimumCatCount: 2, nightlyRate }]),
      );
      stayApiService.previewDateChangePricing.mockReturnValue(
        of({
          pricingDecisionRequired: true,
          currentNumberOfNights: 7,
          currentAgreedAmount: '100',
          numberOfNights: 8,
          retainedNightlyRate: '50',
          suggestedAmount: '400',
          confirmation: {
            previousNumberOfNights: 7,
            previousAgreedAmount: '100',
            numberOfNights: 8,
            retainedNightlyRate: '50',
            suggestedAmount: '400',
          },
        }),
      );
      createComponent();
      fixture.detectChanges();

      expect(component.retainedRateActionLabel()).toBeNull();
      const visibleActions = [
        ...(fixture.nativeElement as HTMLElement).querySelectorAll('button'),
      ].map((button) => button.textContent?.trim());
      expect(visibleActions).not.toContain(component.text().stays.pricing.useCurrentRate);
      expect(
        (fixture.nativeElement as HTMLElement).querySelectorAll('.pricing-helper-actions button'),
      ).toHaveLength(0);
    },
  );

  it('renders route-free Stay inputs and actions from its authoritative entity input', async () => {
    createComponent();
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;

    expect(compiled.querySelectorAll('mat-form-field')).toHaveLength(3);
    expect((compiled.querySelector('input[name="startAt"]') as HTMLInputElement).value).toBe(
      '2099-01-02T10:00',
    );
    expect(compiled.querySelector('.stay-summary')?.textContent).toContain('Milo, Luna');
    expect(compiled.querySelector('button[mat-flat-button]')).not.toBeNull();
    expect(compiled.querySelector('button.cancel-edit')).not.toBeNull();
  });

  it('does not update when the end date is not after the start date', () => {
    createComponent();

    component.startAt.set('2099-01-09T10:00');
    component.endAt.set('2099-01-02T10:00');

    component.submit();
    fixture.detectChanges();

    expect(stayApiService.updateStay).not.toHaveBeenCalled();
    expect(component.error()).toBe(component.text().stays.edit.errors.endAfterStart);
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      component.text().stays.edit.errors.endAfterStart,
    );
  });

  it('completes an accepted non-extending update without opening the vaccine dialog', () => {
    createComponent();
    stayApiService.updateStay.mockReturnValue(of(stay));

    component.startAt.set('2099-01-02T10:00');
    component.endAt.set('2099-01-09T10:00');
    component.notes.set('  ');

    component.submit();

    expect(stayApiService.updateStay).toHaveBeenCalledWith('stay-1', {
      startAt: '2099-01-02T10:00',
      endAt: '2099-01-09T10:00',
      notes: null,
      overrideVaccineConflicts: false,
    });
    expect(matDialog.open).not.toHaveBeenCalled();
    expect(component.submitting()).toBe(false);
  });

  it('shows update errors through shared Material error state', () => {
    createComponent();
    stayApiService.updateStay.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: { startAt: 'overlaps another stay' },
            status: 400,
          }),
      ),
    );

    component.startAt.set('2099-01-02T10:00');
    component.endAt.set('2099-01-09T10:00');

    component.submit();
    fixture.detectChanges();

    expect(component.error()).toBe('startAt: overlaps another stay');
    expect(fixture.nativeElement.querySelector('[role="alert"]')?.textContent).toContain(
      'startAt: overlaps another stay',
    );
  });

  it('preserves values when an administrator cancels and keeps a later update normal', () => {
    createComponent();
    stayApiService.updateStay
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              error: vaccineConflict,
              status: 409,
            }),
        ),
      )
      .mockReturnValueOnce(of(stay));

    component.startAt.set('2099-02-02T10:00');
    component.endAt.set('2099-02-09T10:00');
    component.notes.set('  updated notes  ');

    component.submit();

    expect(matDialog.open).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        data: {
          violations: vaccineConflict.violations,
          canOverride: true,
        },
      }),
    );

    dialogClosed.next(false);

    expect(stayApiService.updateStay).toHaveBeenCalledTimes(1);
    expect(component.startAt()).toBe('2099-02-02T10:00');
    expect(component.endAt()).toBe('2099-02-09T10:00');
    expect(component.notes()).toBe('  updated notes  ');

    component.submit();

    expect(stayApiService.updateStay).toHaveBeenNthCalledWith(2, 'stay-1', {
      startAt: '2099-02-02T10:00',
      endAt: '2099-02-09T10:00',
      notes: 'updated notes',
      overrideVaccineConflicts: false,
    });
  });

  it('retries once with the captured update when an administrator continues', () => {
    createComponent();
    stayApiService.updateStay
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              error: vaccineConflict,
              status: 409,
            }),
        ),
      )
      .mockReturnValueOnce(of(stay));

    component.startAt.set('2099-02-02T10:00');
    component.endAt.set('2099-02-09T10:00');
    component.notes.set('updated notes');

    component.submit();
    dialogClosed.next(true);

    expect(stayApiService.updateStay).toHaveBeenNthCalledWith(2, 'stay-1', {
      startAt: '2099-02-02T10:00',
      endAt: '2099-02-09T10:00',
      notes: 'updated notes',
      overrideVaccineConflicts: true,
    });
    expect(stayApiService.updateStay).toHaveBeenCalledTimes(2);
  });

  it('does not retry an update for staff even if the dialog produces a continue result', () => {
    authSessionService.hasRole.mockReturnValue(false);
    createComponent();
    stayApiService.updateStay.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            error: vaccineConflict,
            status: 409,
          }),
      ),
    );

    component.startAt.set('2099-02-02T10:00');
    component.endAt.set('2099-02-09T10:00');

    component.submit();

    expect(matDialog.open).toHaveBeenCalledWith(
      expect.any(Function),
      expect.objectContaining({
        data: {
          violations: vaccineConflict.violations,
          canOverride: false,
        },
      }),
    );

    dialogClosed.next(true);

    expect(stayApiService.updateStay).toHaveBeenCalledTimes(1);
  });

  it('uses the generic error path when the administrator update retry fails', () => {
    createComponent();
    stayApiService.updateStay
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              error: vaccineConflict,
              status: 409,
            }),
        ),
      )
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              error: 'Stay still conflicts',
              status: 409,
            }),
        ),
      )
      .mockReturnValueOnce(of(stay));

    component.startAt.set('2099-02-02T10:00');
    component.endAt.set('2099-02-09T10:00');

    component.submit();
    dialogClosed.next(true);

    expect(matDialog.open).toHaveBeenCalledTimes(1);
    expect(component.error()).toBe('Stay still conflicts');
    expect(component.submitting()).toBe(false);

    component.submit();

    expect(stayApiService.updateStay).toHaveBeenNthCalledWith(
      3,
      'stay-1',
      expect.objectContaining({ overrideVaccineConflicts: false }),
    );
  });

  it('preserves an approved override only through stale recovery for unchanged edit dates', () => {
    stayApiService.updateStay
      .mockReturnValueOnce(
        throwError(() => new HttpErrorResponse({ error: vaccineConflict, status: 409 })),
      )
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              error: { code: 'STALE_PRICING_CONFIRMATION' },
              status: 409,
            }),
        ),
      )
      .mockReturnValueOnce(of(stay));
    createComponent();

    component.submit();
    dialogClosed.next(true);
    component.submit();

    expect(stayApiService.updateStay).toHaveBeenNthCalledWith(
      3,
      'stay-1',
      expect.objectContaining({ overrideVaccineConflicts: true }),
    );
  });

  it('clears stale-recovery override approval when edit dates change', () => {
    stayApiService.updateStay
      .mockReturnValueOnce(
        throwError(() => new HttpErrorResponse({ error: vaccineConflict, status: 409 })),
      )
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              error: { code: 'STALE_PRICING_CONFIRMATION' },
              status: 409,
            }),
        ),
      )
      .mockReturnValueOnce(of(stay));
    createComponent();

    component.submit();
    dialogClosed.next(true);
    component.onEndAtChange('2099-01-10T10:00');
    component.submit();

    expect(stayApiService.updateStay).toHaveBeenNthCalledWith(
      3,
      'stay-1',
      expect.objectContaining({ overrideVaccineConflicts: false }),
    );
  });

  it('submits an admin repricing decision only when the backend requires it', () => {
    nightlyReferenceRateApiService.getCurrentRates.mockReturnValue(
      of([{ minimumCatCount: 2, nightlyRate: '60' }]),
    );
    stayApiService.previewDateChangePricing.mockReturnValue(
      of({
        pricingDecisionRequired: true,
        currentNumberOfNights: 7,
        currentAgreedAmount: '100',
        numberOfNights: 8,
        retainedNightlyRate: '50',
        suggestedAmount: '400',
        confirmation: {
          previousNumberOfNights: 7,
          previousAgreedAmount: '100',
          numberOfNights: 8,
          retainedNightlyRate: '50',
          suggestedAmount: '400',
        },
      }),
    );
    stayApiService.updateStay.mockReturnValue(of(stay));
    createComponent();
    component.toggleRetainedRate();
    component.agreedAmount.set('9999999999999999999');
    component.pricingReason.set('Administrative agreement');
    component.confirmPricing();

    component.submit();

    expect(stayApiService.updateStay).toHaveBeenCalledWith(
      'stay-1',
      expect.objectContaining({
        pricingDecision: {
          agreedAmount: '9999999999999999999',
          reason: 'Administrative agreement',
        },
        confirmation: expect.objectContaining({
          previousNumberOfNights: 7,
          numberOfNights: 8,
          retainedNightlyRate: '60',
          suggestedAmount: '480',
        }),
      }),
    );
  });

  it('preserves the entered pricing decision when stale recovery loads a fresh preview', () => {
    const initialPreview = {
      pricingDecisionRequired: true,
      currentNumberOfNights: 7,
      currentAgreedAmount: '100',
      numberOfNights: 8,
      retainedNightlyRate: '50',
      suggestedAmount: '400',
      confirmation: {
        previousNumberOfNights: 7,
        previousAgreedAmount: '100',
        numberOfNights: 8,
        retainedNightlyRate: '50',
        suggestedAmount: '400',
      },
    };
    const freshPreview = {
      ...initialPreview,
      suggestedAmount: '450',
      confirmation: { ...initialPreview.confirmation, suggestedAmount: '450' },
    };
    stayApiService.previewDateChangePricing
      .mockReturnValueOnce(of(initialPreview))
      .mockReturnValueOnce(of(freshPreview));
    stayApiService.updateStay.mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 409,
            error: { code: 'STALE_PRICING_CONFIRMATION' },
          }),
      ),
    );
    createComponent();
    component.agreedAmount.set('375');
    component.pricingReason.set('Client retained this amount');
    component.confirmPricing();

    component.submit();

    expect(stayApiService.updateStay).toHaveBeenCalledTimes(1);
    expect(stayApiService.previewDateChangePricing).toHaveBeenCalledTimes(2);
    expect(component.pricingPreview()).toEqual(freshPreview);
    expect(component.agreedAmount()).toBe('375');
    expect(component.pricingReason()).toBe('Client retained this amount');
    expect(component.pricingConfirmed()).toBe(false);
    expect(component.stalePricing()).toBe(true);
  });

  it('presents the administrator-required state for a rejected staff pricing preview', () => {
    authSessionService.hasRole.mockReturnValue(false);
    stayApiService.previewDateChangePricing.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 403 })),
    );

    createComponent();

    expect(component.previewError()).toBe(component.text().stays.pricing.errors.adminRequired);
    expect(component.pricingPreview()).toBeNull();
  });

  it('clears an active pricing-preview error when the language changes', () => {
    stayApiService.previewDateChangePricing.mockReturnValue(
      throwError(() => new HttpErrorResponse({ status: 500 })),
    );
    createComponent();

    expect(component.previewError()).toBe(component.text().stays.pricing.errors.previewFailed);

    TestBed.inject(I18nService).toggleLanguage();
    TestBed.flushEffects();

    expect(component.previewError()).toBeNull();
  });
});
