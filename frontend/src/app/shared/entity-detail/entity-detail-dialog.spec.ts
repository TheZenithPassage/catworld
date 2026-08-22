import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { OwnerEditor } from '../../features/owners/components/owner-editor/owner-editor';
import { Owner } from '../../features/owners/models/owner.model';
import { OwnerApiService } from '../../features/owners/services/owner-api.service';
import { CatApiService } from '../../features/cats/services/cat-api.service';
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
  };
  const updated = { ...owner, fullName: 'Ada Byron' };
  const secondOwner = { ...owner, id: 'owner-2', fullName: 'Grace Hopper' };
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
    getOwnerCats: vi.fn(),
    getOwnerStays: vi.fn(),
    updateOwner: vi.fn(() => of(updated)),
  };
  const catApi = {
    getCatDetail: vi.fn((id: string) =>
      of({
        cat: {
          id,
          name: 'Milo',
          birthDate: '2020-01-01',
          sex: 'MALE',
          breed: null,
          coat: null,
          color: null,
          foodBrand: null,
          litterBrand: null,
          personality: null,
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
        stays: { totalElements: 0, items: [] },
      }),
    ),
    getCatStays: vi.fn(),
  };
  const vetApi = { getVetCats: vi.fn(), getVetDetail: vi.fn() };
  const stayApi = {
    getStayDetail: vi.fn(() =>
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
  const dialogRef = { disableClose: false };

  beforeEach(() => {
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
    expect(fixture.nativeElement.textContent).toContain('Ada Lovelace');

    (
      fixture.nativeElement.querySelector(
        'app-owner-detail button[mat-flat-button]',
      ) as HTMLButtonElement
    ).click();
    fixture.detectChanges();
    editor = fixture.debugElement.query(By.directive(OwnerEditor)).componentInstance as OwnerEditor;
    expect(editor.fullName()).toBe('Ada Lovelace');

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
    expect(fixture.nativeElement.textContent).toContain(
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
    requestedPage.next({
      items: [catItem('cat-6')],
      page: 2,
      pageSize: 5,
      totalElements: 11,
      totalPages: 3,
    });
    fixture.detectChanges();
    (fixture.nativeElement.querySelector('h3 + button') as HTMLButtonElement).click();
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
      fixture.componentInstance.text().owners.detail.title,
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

  it('uses the shared paged history for Owner and Cat Stay lists and Stay Cat lists', async () => {
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
    api.getOwnerStays.mockReturnValue(of(stayPage));
    catApi.getCatStays.mockReturnValue(of(stayPage));
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

    fixture.componentInstance.openStays({ entityType: 'owner', entityId: 'owner-1' });
    fixture.detectChanges();
    expect(api.getOwnerStays).toHaveBeenCalledWith('owner-1', 0);
    expect(fixture.nativeElement.textContent).toContain('Reserved');
    fixture.componentInstance.showReference({ entityType: 'stay', entityId: 'stay-1' });
    fixture.detectChanges();
    fixture.componentInstance.back();
    fixture.detectChanges();
    expect(fixture.componentInstance.relationshipPage()?.page).toBe(0);

    fixture.componentInstance.back();
    fixture.componentInstance.showReference({ entityType: 'cat', entityId: 'cat-1' });
    fixture.componentInstance.openStays({ entityType: 'cat', entityId: 'cat-1' });
    fixture.detectChanges();
    expect(catApi.getCatStays).toHaveBeenCalledWith('cat-1', 0);

    fixture.componentInstance.back();
    fixture.componentInstance.showReference({ entityType: 'stay', entityId: 'stay-1' });
    fixture.componentInstance.openCats({ entityType: 'stay', entityId: 'stay-1' });
    fixture.detectChanges();
    expect(stayApi.getStayCats).toHaveBeenCalledWith('stay-1', 0);
    fixture.componentInstance.showReference({ entityType: 'cat', entityId: 'cat-1' });
    fixture.componentInstance.back();
    fixture.detectChanges();
    expect(fixture.componentInstance.relationshipPage()?.page).toBe(0);
  });

  it('lets the reactive dialog title provide the accessible name', () => {
    const dialog = {
      open: vi.fn(() => ({
        componentInstance: { stayUpdated: { subscribe: vi.fn() } },
        afterClosed: () => of(undefined),
      })),
    };
    TestBed.configureTestingModule({
      providers: [EntityDetailDialogService, { provide: MatDialog, useValue: dialog }],
    });
    TestBed.inject(EntityDetailDialogService).open({ entityType: 'owner', entityId: 'owner-1' });
    expect(dialog.open).toHaveBeenCalledWith(
      EntityDetailDialog,
      expect.not.objectContaining({ ariaLabel: expect.anything() }),
    );
  });

  it('keeps the operational edit load failure separate and retries the operational GET', async () => {
    const failed = new Subject<Stay>();
    const retried = new Subject<Stay>();
    stayApi.getStayById.mockImplementationOnce(() => failed).mockImplementationOnce(() => retried);
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
    expect(stayApi.getStayById).toHaveBeenCalledTimes(2);
    expect(fixture.componentInstance.operationalLoading()).toBe(false);
    expect(fixture.debugElement.query(By.directive(StayEditor))).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.cancel-edit')).not.toBeNull();
  });

  it('never exposes late operational success or error under a newer Stay reference', async () => {
    const first = new Subject<Stay>();
    const second = new Subject<Stay>();
    const third = new Subject<Stay>();
    const fourth = new Subject<Stay>();
    stayApi.getStayById
      .mockImplementationOnce(() => first)
      .mockImplementationOnce(() => second)
      .mockImplementationOnce(() => third)
      .mockImplementationOnce(() => fourth);
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

  it('locks every dialog dismissal path only while an authoritative Stay update is in flight', async () => {
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
    fixture.componentInstance.submissionChanged(true);
    fixture.detectChanges();
    expect(dialogRef.disableClose).toBe(true);
    expect(
      (fixture.nativeElement.querySelector('.close-button') as HTMLButtonElement).disabled,
    ).toBe(true);
    fixture.componentInstance.submissionChanged(false);
    fixture.detectChanges();
    expect(dialogRef.disableClose).toBe(false);
    const emitted = vi.fn();
    fixture.componentInstance.stayUpdated.subscribe(emitted);
    const authoritative = { ...operationalStay, notes: 'authoritative update' };
    fixture.componentInstance.staySaved(authoritative);
    expect(emitted).toHaveBeenCalledWith(authoritative);
  });

  function catItem(id: string) {
    return { id, name: 'Milo', ownerId: 'owner-1', ownerName: 'Ada Lovelace' };
  }
});
