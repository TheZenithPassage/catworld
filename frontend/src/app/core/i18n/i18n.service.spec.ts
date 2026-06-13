import { TestBed } from '@angular/core/testing';

import { I18nService } from './i18n.service';

describe('I18nService', () => {
  const storageKey = 'catworld.language';

  let service: I18nService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';

    TestBed.configureTestingModule({});
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.lang = '';
    TestBed.resetTestingModule();
  });

  it('uses Spanish by default when no language preference is stored', () => {
    service = TestBed.inject(I18nService);
    TestBed.tick();

    expect(service.language()).toBe('es');
    expect(service.dateLocale()).toBe('es-ES');
    expect(localStorage.getItem(storageKey)).toBe('es');
    expect(document.documentElement.lang).toBe('es');
  });

  it('reads English from localStorage when stored preference exists', () => {
    localStorage.setItem(storageKey, 'en');

    service = TestBed.inject(I18nService);
    TestBed.tick();

    expect(service.language()).toBe('en');
    expect(service.dateLocale()).toBe('en-GB');
    expect(document.documentElement.lang).toBe('en');
  });

  it('ignores invalid stored language and falls back to Spanish', () => {
    localStorage.setItem(storageKey, 'fr');

    service = TestBed.inject(I18nService);
    TestBed.tick();

    expect(service.language()).toBe('es');
    expect(service.dateLocale()).toBe('es-ES');
    expect(localStorage.getItem(storageKey)).toBe('es');
    expect(document.documentElement.lang).toBe('es');
  });

  it('toggles language, persists it and updates the document language', () => {
    service = TestBed.inject(I18nService);
    TestBed.tick();

    service.toggleLanguage();
    TestBed.tick();

    expect(service.language()).toBe('en');
    expect(service.dateLocale()).toBe('en-GB');
    expect(localStorage.getItem(storageKey)).toBe('en');
    expect(document.documentElement.lang).toBe('en');

    service.toggleLanguage();
    TestBed.tick();

    expect(service.language()).toBe('es');
    expect(service.dateLocale()).toBe('es-ES');
    expect(localStorage.getItem(storageKey)).toBe('es');
    expect(document.documentElement.lang).toBe('es');
  });
});
