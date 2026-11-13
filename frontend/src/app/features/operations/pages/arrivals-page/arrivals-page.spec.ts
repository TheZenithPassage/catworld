import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { EMPTY } from 'rxjs';
import { vi } from 'vitest';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import { ArrivalsPage } from './arrivals-page';

describe('ArrivalsPage', () => {
  const cat = {
    id: 'cat-1',
    name: 'Milo',
    foodBrand: null,
    litterBrand: 'Example Litter',
    vaccineWarnings: [{ vaccineType: 'RABIES', reason: 'MISSING' }],
  };
  const stay = {
    id: 'stay-1',
    startAt: '2026-11-13T14:00:00',
    endAt: '2026-11-15T17:00:00',
    owner: { id: 'owner-1', fullName: 'Ana Example' },
  };
  const details = { open: vi.fn(() => EMPTY) };
  let fixture: ComponentFixture<ArrivalsPage>;
  let http: HttpTestingController;

  beforeEach(() => {
    details.open.mockClear();
    TestBed.configureTestingModule({
      imports: [ArrivalsPage],
      providers: [
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: EntityDetailDialogService, useValue: details },
      ],
    });
    TestBed.inject(I18nService).language.set('es');
    http = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ArrivalsPage);
  });

  afterEach(() => http.verify());

  it('shows arrival preparation and opens the existing stay detail', () => {
    http
      .expectOne({ method: 'GET', url: '/api/operations/arrivals' })
      .flush([{ ...stay, cats: [cat] }]);
    fixture.detectChanges();
    const row = (fixture.nativeElement as HTMLElement).querySelector('article')!;

    expect(row.textContent).toContain('Ana Example');
    expect(row.textContent).toContain('Milo');
    expect(row.textContent).toContain('14:00');
    expect(row.textContent).toContain('Rabia · Falta la fecha de vacunación');
    expect(row.textContent).toContain('Por confirmar');
    expect(row.textContent).toContain('Example Litter');
    expect(row.querySelector('a')).toBeNull();

    row.querySelector<HTMLButtonElement>('button[aria-label^="Ver estadía"]')!.click();
    expect(details.open).toHaveBeenCalledWith({ entityType: 'stay', entityId: stay.id });
  });

  it('links each returned profile proposal to its review', () => {
    const pendingReviews = [{ id: 'proposal-1', submittedAt: '2026-11-12T15:00:00Z' }];
    http
      .expectOne('/api/operations/arrivals')
      .flush([{ ...stay, cats: [{ ...cat, pendingReviews }] }]);
    fixture.detectChanges();

    const link = (fixture.nativeElement as HTMLElement).querySelector('article a')!;
    expect(link.getAttribute('href')).toBe('/cat-intake?reviewId=proposal-1');
    expect(link.textContent).toContain('Revisar propuesta de ficha');
  });
});
