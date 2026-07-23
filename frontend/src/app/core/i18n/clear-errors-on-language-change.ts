import { effect, Signal, untracked } from '@angular/core';

import { AppLanguage } from './app-language';

export function clearErrorsOnLanguageChange(
  language: Signal<AppLanguage>,
  clearErrors: () => void,
): void {
  let previousLanguage = language();

  effect(() => {
    const currentLanguage = language();

    if (currentLanguage === previousLanguage) {
      return;
    }

    previousLanguage = currentLanguage;
    untracked(clearErrors);
  });
}
