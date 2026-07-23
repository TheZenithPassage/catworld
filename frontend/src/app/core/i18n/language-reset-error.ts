import { linkedSignal, Signal, WritableSignal } from '@angular/core';

import { AppLanguage } from './app-language';

export function createLanguageResetError(
  language: Signal<AppLanguage>,
): WritableSignal<string | null> {
  return linkedSignal<AppLanguage, string | null>({
    source: language,
    computation: () => null,
  });
}
