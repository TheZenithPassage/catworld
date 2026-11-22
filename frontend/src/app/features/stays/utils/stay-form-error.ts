import { HttpErrorResponse } from '@angular/common/http';

export function stayFormError(
  error: unknown,
  fallback: string,
  bookingConflict: (catName: string) => string,
): string {
  const body: unknown = error instanceof HttpErrorResponse ? error.error : null;
  if (typeof body === 'string') return body.trim() || fallback;
  if (!body || typeof body !== 'object' || Array.isArray(body)) return fallback;
  const fields = body as Record<string, unknown>;
  if (fields['code'] === 'STAY_DATES_OVERLAP' && typeof fields['catName'] === 'string') {
    return bookingConflict(fields['catName']);
  }
  const entries = Object.entries(fields);
  if (!entries.every(([, message]) => typeof message === 'string')) return fallback;
  return entries.map(([field, message]) => field + ': ' + message).join('. ') || fallback;
}
