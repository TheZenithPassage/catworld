import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { vi } from 'vitest';

import { clearErrorsOnLanguageChange } from './clear-errors-on-language-change';

describe('clearErrorsOnLanguageChange', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('preserves errors on the initial effect run and clears them on a language transition', () => {
    const language = signal<'es' | 'en'>('es');
    const error = signal<string | null>('existing error');

    TestBed.runInInjectionContext(() => {
      clearErrorsOnLanguageChange(language, () => error.set(null));
    });

    TestBed.tick();
    expect(error()).toBe('existing error');

    language.set('en');
    TestBed.tick();

    expect(error()).toBeNull();
  });

  it('does not reset for the current language or track error state read by the callback', () => {
    const language = signal<'es' | 'en'>('es');
    const error = signal<string | null>('existing error');
    const clearErrors = vi.fn(() => error.set(null));

    TestBed.runInInjectionContext(() => {
      clearErrorsOnLanguageChange(language, () => {
        error();
        clearErrors();
      });
    });

    TestBed.tick();
    language.set('es');
    TestBed.tick();

    expect(clearErrors).not.toHaveBeenCalled();

    language.set('en');
    TestBed.tick();
    expect(clearErrors).toHaveBeenCalledOnce();

    error.set('new error');
    TestBed.tick();

    expect(error()).toBe('new error');
    expect(clearErrors).toHaveBeenCalledOnce();
  });
});
