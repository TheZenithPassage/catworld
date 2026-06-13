import { computed, effect, inject, Injectable, signal } from '@angular/core';
import { DOCUMENT } from '@angular/common';

import { AppLanguage, DEFAULT_APP_LANGUAGE, isAppLanguage } from './app-language';
import { APP_TRANSLATIONS } from './app-translations';

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly storageKey = 'catworld.language';
  private readonly document = inject(DOCUMENT);

  readonly language = signal<AppLanguage>(this.readStoredLanguage());
  readonly text = computed(() => APP_TRANSLATIONS[this.language()]);
  readonly dateLocale = computed(() => (this.language() === 'es' ? 'es-ES' : 'en-GB'));

  constructor() {
    effect(() => {
      const language = this.language();

      this.storeLanguage(language);
      this.document.documentElement.lang = language;
    });
  }

  toggleLanguage(): void {
    this.language.update((currentLanguage) => (currentLanguage === 'es' ? 'en' : 'es'));
  }

  private readStoredLanguage(): AppLanguage {
    try {
      const storedLanguage = localStorage.getItem(this.storageKey);

      return isAppLanguage(storedLanguage) ? storedLanguage : DEFAULT_APP_LANGUAGE;
    } catch {
      return DEFAULT_APP_LANGUAGE;
    }
  }

  private storeLanguage(language: AppLanguage): void {
    try {
      localStorage.setItem(this.storageKey, language);
    } catch {
      return;
    }
  }
}
