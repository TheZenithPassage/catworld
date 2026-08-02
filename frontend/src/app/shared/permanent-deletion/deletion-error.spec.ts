import { HttpErrorResponse } from '@angular/common/http';

import { DELETION_TRANSLATIONS } from '../../core/i18n/translations/deletion.translations';
import { deletionErrorKind, deletionErrorMessage } from './deletion-error';

describe('deletion error handling', () => {
  it.each([
    [403, 'forbidden'],
    [404, 'notFound'],
    [409, 'conflict'],
    [400, 'generic'],
    [500, 'generic'],
  ] as const)('classifies HTTP %s as %s', (status, expectedKind) => {
    expect(deletionErrorKind(new HttpErrorResponse({ status }))).toBe(expectedKind);
  });

  it('uses the generic category for non-HTTP failures', () => {
    expect(deletionErrorKind(new Error('network failure'))).toBe('generic');
    expect(deletionErrorKind(null)).toBe('generic');
  });

  it('selects the current English or Spanish message without changing classification', () => {
    const forbidden = new HttpErrorResponse({ status: 403 });
    const conflict = new HttpErrorResponse({ status: 409 });

    expect(deletionErrorMessage(forbidden, DELETION_TRANSLATIONS.en)).toBe(
      'You no longer have permission to delete this record.',
    );
    expect(deletionErrorMessage(conflict, DELETION_TRANSLATIONS.es)).toBe(
      'Este registro no se puede eliminar porque está siendo utilizado.',
    );
  });
});
