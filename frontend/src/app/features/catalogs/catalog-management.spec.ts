import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { API_BASE_URL } from '../../core/config/api.config';
import { I18nService } from '../../core/i18n/i18n.service';
import { CatalogManagement } from './catalog-management';

describe('CatalogManagement', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting(), provideNoopAnimations()],
    });
    TestBed.inject(I18nService).language.set('es');
  });

  it('expands only the requested brand and keeps hidden entries restorable', () => {
    const fixture = TestBed.createComponent(CatalogManagement);
    const http = TestBed.inject(HttpTestingController);
    const endpoint = `${API_BASE_URL}/cat-profile-options/manage`;
    const entries = [
      { id: 'first', field: 'foodBrand', name: 'First brand', active: true },
      { id: 'second', field: 'foodBrand', name: 'Second brand', active: false },
      { id: 'kitten', field: 'foodDetail', name: 'Kitten', brandId: 'first', active: false },
      { id: 'adult', field: 'foodDetail', name: 'Adult', brandId: 'second', active: true },
    ];
    http.expectOne(endpoint).flush(entries);
    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    const category = element.querySelector('select')!;
    expect([...category.options].map(({ value }) => value)).not.toContain('foodDetail');
    category.value = 'foodBrand';
    category.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    function expand(name: string): void {
      const label = `Variedades del alimento: ${name}`;
      const button = element.querySelector<HTMLButtonElement>(`[aria-label="${label}"]`);
      expect(button, label).not.toBeNull();
      button!.click();
      fixture.detectChanges();
    }
    expect(element.textContent).not.toContain('Adult');
    expand('Second brand');
    expect(element.querySelector('.varieties')?.textContent).toContain('Adult');
    expect(element.querySelector('.varieties')?.textContent).not.toContain('Kitten');
    expect(element.querySelector('.varieties input')).toBeNull();

    expand('First brand');
    expect(element.querySelector('.varieties')?.textContent).toContain('Kitten');
    expect(element.querySelector('.varieties')?.textContent).not.toContain('Adult');
    const restoreButton = element.querySelector<HTMLButtonElement>(
      '[aria-label="Restaurar Kitten"]',
    );
    expect(restoreButton, 'Restaurar Kitten').not.toBeNull();
    restoreButton!.click();
    const restore = http.expectOne(`${endpoint}/foodDetail/kitten`);
    expect(restore.request.method).toBe('PATCH');
    expect(restore.request.body).toEqual({ active: true });
    restore.flush({ ...entries[2], active: true });

    http
      .expectOne(endpoint)
      .flush(
        entries.map((option) => (option.id === 'kitten' ? { ...option, active: true } : option)),
      );
    http.expectOne(`${API_BASE_URL}/cat-profile-options`).flush({});
    http.expectOne(`${API_BASE_URL}/food-brands/varieties`).flush([]);
    fixture.detectChanges();
    expect(element.querySelector('[aria-label="Ocultar Kitten"]')).not.toBeNull();

    const varietyForm = element.querySelector<HTMLFormElement>('.varieties form')!;
    const input = varietyForm.querySelector('input')!;
    input.value = 'Adult';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    varietyForm.dispatchEvent(new Event('submit', { cancelable: true }));
    const publication = http.expectOne(API_BASE_URL + '/cat-profile-options');
    expect(publication.request.method).toBe('POST');
    expect(publication.request.body).toEqual({
      field: 'foodDetail',
      name: 'Adult',
      brandId: 'first',
    });
    publication.flush({ id: 'first-adult', name: 'Adult' });
    http
      .expectOne(endpoint)
      .flush([
        ...entries,
        { id: 'first-adult', field: 'foodDetail', name: 'Adult', brandId: 'first', active: true },
      ]);
    http.expectOne(API_BASE_URL + '/cat-profile-options').flush({});
    http.expectOne(API_BASE_URL + '/food-brands/varieties').flush([]);
    fixture.detectChanges();
    expect(element.querySelector('.varieties')?.textContent).toContain('Adult');
    http.verify();
  });

  it('offers to hide an in-use brand after confirmed deletion is refused', async () => {
    const fixture = TestBed.createComponent(CatalogManagement);
    const http = TestBed.inject(HttpTestingController);
    const endpoint = API_BASE_URL + '/cat-profile-options/manage';
    http
      .expectOne(endpoint)
      .flush([{ id: 'brand', field: 'foodBrand', name: 'My brand', brandId: null, active: true }]);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const category = root.querySelector('select')!;
    category.value = 'foodBrand';
    category.dispatchEvent(new Event('change'));
    fixture.detectChanges();

    const remove = root.querySelector<HTMLButtonElement>('[aria-label="Eliminar My brand"]');
    expect(remove, 'Eliminar My brand').not.toBeNull();
    remove!.click();
    await fixture.whenStable();
    let dialog = document.querySelector('mat-dialog-container')!;
    expect(dialog.textContent).toContain('sus variedades');
    expect(dialog.textContent).toContain('propuestas pendientes');
    dialog.querySelector<HTMLButtonElement>('mat-dialog-actions button')!.click();
    await fixture.whenStable();
    http.expectNone(endpoint + '/foodBrand/brand');

    remove!.click();
    await fixture.whenStable();
    dialog = document.querySelector('mat-dialog-container')!;
    dialog.querySelector<HTMLButtonElement>('mat-dialog-actions button:last-child')!.click();
    await fixture.whenStable();
    const deletion = http.expectOne(endpoint + '/foodBrand/brand');
    expect(deletion.request.method).toBe('DELETE');
    deletion.flush({ code: 'CAT_CATALOG_OPTION_IN_USE' }, { status: 409, statusText: 'Conflict' });
    fixture.detectChanges();
    http.expectNone((request) => request.method === 'PATCH');
    const hide = root.querySelector<HTMLButtonElement>('.catalog-in-use button')!;
    expect(hide.textContent).toContain('Ocultar');
    hide.click();
    const request = http.expectOne(endpoint + '/foodBrand/brand');
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual({ active: false });
    request.flush(null);
    http.expectOne(API_BASE_URL + '/cat-profile-options').flush({});
    http.expectOne(API_BASE_URL + '/food-brands/varieties').flush([]);
    http
      .expectOne(endpoint)
      .flush([{ id: 'brand', field: 'foodBrand', name: 'My brand', brandId: null, active: false }]);
    fixture.detectChanges();
    expect(root.querySelector('[aria-label="Restaurar My brand"]')).not.toBeNull();
    http.verify();
  });
});
