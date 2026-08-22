import { TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of, Subject } from 'rxjs';
import { vi } from 'vitest';
import { OwnerEditor } from '../../features/owners/components/owner-editor/owner-editor';
import { Owner } from '../../features/owners/models/owner.model';
import { OwnerApiService } from '../../features/owners/services/owner-api.service';
import { CatApiService } from '../../features/cats/services/cat-api.service';
import { VetApiService } from '../../features/vets/services/vet-api.service';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { I18nService } from '../../core/i18n/i18n.service';
import { EntityDetailDialog } from './entity-detail-dialog';
import { EntityDetailDialogService } from './entity-detail-dialog.service';
import { OwnerDetailResponse } from './relationship.models';

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
  };
  const vetApi = { getVetCats: vi.fn(), getVetDetail: vi.fn() };

  beforeEach(() => vi.clearAllMocks());
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
    expect(fixture.nativeElement.textContent).toContain(
      fixture.componentInstance.text().owners.detail.unsupportedStay,
    );
    expect(fixture.componentInstance.title()).toBe(
      fixture.componentInstance.text().stays.edit.title,
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

  it('lets the reactive dialog title provide the accessible name', () => {
    const dialog = { open: vi.fn() };
    TestBed.configureTestingModule({
      providers: [EntityDetailDialogService, { provide: MatDialog, useValue: dialog }],
    });
    TestBed.inject(EntityDetailDialogService).open({ entityType: 'owner', entityId: 'owner-1' });
    expect(dialog.open).toHaveBeenCalledWith(
      EntityDetailDialog,
      expect.not.objectContaining({ ariaLabel: expect.anything() }),
    );
  });

  function catItem(id: string) {
    return { id, name: 'Milo', ownerId: 'owner-1', ownerName: 'Ada Lovelace' };
  }
});
