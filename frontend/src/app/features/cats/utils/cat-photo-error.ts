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
  const key = errorKeys[body.code as keyof typeof errorKeys];
  return key ? errors[key] : null;
}

function isErrorBody(value: unknown): value is { code: string } {
  return (
    typeof value === 'object' && value !== null && 'code' in value && typeof value.code === 'string'
  );
}
