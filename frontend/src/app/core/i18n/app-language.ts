export type AppLanguage = 'es' | 'en';

export const DEFAULT_APP_LANGUAGE: AppLanguage = 'es';

export function isAppLanguage(value: unknown): value is AppLanguage {
  return value === 'es' || value === 'en';
}
