import { computed, effect, Injectable, signal } from '@angular/core';

import { AppLanguage, DEFAULT_APP_LANGUAGE, isAppLanguage } from './app-language';
import { APP_TRANSLATIONS } from './app-translations';

@Injectable({
  providedIn: 'root',
})
export class I18nService {
  private readonly storageKey = 'catworld.language';

  readonly language = signal<AppLanguage>(this.readStoredLanguage());
  readonly text = computed(() => APP_TRANSLATIONS[this.language()]);

  constructor() {
    effect(() => {
      this.storeLanguage(this.language());
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