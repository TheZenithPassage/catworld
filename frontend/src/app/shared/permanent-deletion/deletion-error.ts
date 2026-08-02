import { HttpErrorResponse } from '@angular/common/http';

import { DeletionTranslations } from '../../core/i18n/translations/deletion.translations';

export type DeletionErrorKind = 'forbidden' | 'notFound' | 'conflict' | 'generic';

export function deletionErrorKind(error: unknown): DeletionErrorKind {
  if (!(error instanceof HttpErrorResponse)) {
    return 'generic';
  }

  switch (error.status) {
    case 403:
      return 'forbidden';
    case 404:
      return 'notFound';
    case 409:
      return 'conflict';
    default:
      return 'generic';
  }
}

export function deletionErrorMessage(error: unknown, translations: DeletionTranslations): string {
  return translations.errors[deletionErrorKind(error)];
}
