import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../core/config/api.config';
import { CatalogManagement } from './catalog-management';

describe('CatalogManagement', () => {
  it('manages varieties within the selected brand and keeps hidden entries restorable', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
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
    function choose(select: HTMLSelectElement, value: string): void {
      select.value = value;
      select.dispatchEvent(new Event('change'));
      fixture.detectChanges();
    }
    choose(element.querySelector('select')!, 'foodDetail');
    choose(element.querySelectorAll('select')[1], 'second');
    expect(element.querySelector('.options')?.textContent).toContain('Adult');
    expect(element.querySelector('.options')?.textContent).not.toContain('Kitten');
    expect(element.querySelector('input')).toBeNull();

    choose(element.querySelectorAll('select')[1], 'first');
    expect(element.querySelector('.options')?.textContent).toContain('Kitten');
    expect(element.querySelector('.options')?.textContent).not.toContain('Adult');
    element.querySelector<HTMLButtonElement>('[aria-label="Restaurar Kitten"]')!.click();
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
    http.verify();
  });
});
