import { HttpErrorResponse } from '@angular/common/http';
import { CatsTranslations } from '../../../core/i18n/translations/cats.translations';

type PhotoErrors = CatsTranslations['photo']['errors'];

const errorKeys = {
  CAT_PHOTO_FILE_TOO_LARGE: 'fileTooLarge',
  CAT_PHOTO_UNSUPPORTED_FORMAT: 'unsupportedFormat',
  CAT_PHOTO_DIMENSIONS_TOO_LARGE: 'dimensionsTooLarge',
  CAT_PHOTO_UNDECODABLE: 'undecodable',
  CAT_PHOTO_INTENT_CONFLICT: 'intentConflict',
} as const satisfies Record<string, keyof PhotoErrors>;

export function catPhotoErrorMessage(error: unknown, errors: PhotoErrors): string | null {
  if (!(error instanceof HttpErrorResponse)) return null;
  const body: unknown = error.error;
  if (!isErrorBody(body)) return null;
  const key = errorKeys[body.error.code as keyof typeof errorKeys];
  return key ? errors[key] : null;
}

function isErrorBody(value: unknown): value is { error: { code: string } } {
  if (typeof value !== 'object' || value === null || !('error' in value)) return false;
  const nested = value.error;
  return (
    typeof nested === 'object' &&
    nested !== null &&
    'code' in nested &&
    typeof nested.code === 'string'
  );
}
