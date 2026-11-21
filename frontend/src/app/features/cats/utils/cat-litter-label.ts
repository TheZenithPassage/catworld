import type { CatsTranslations } from '../../../core/i18n/translations/cats.translations';
import { CATWORLD_LITTER, OWN_LITTER } from '../models/cat.model';

export function catLitterChoice(value: string | null | undefined): 'shared' | 'own' | '' {
  if (value === CATWORLD_LITTER) return 'shared';
  return value?.trim() ? 'own' : '';
}

export function catOwnLitterDetail(value: string | null | undefined): string {
  return catLitterChoice(value) === 'own' && value !== OWN_LITTER ? (value ?? '') : '';
}

export function catLitterLabel(
  value: string | null | undefined,
  labels: Pick<CatsTranslations['form'], 'ownLitter' | 'sharedLitter' | 'unconfirmedLitter'>,
): string {
  const choice = catLitterChoice(value);
  if (choice === 'shared') return labels.sharedLitter;
  if (!choice) return labels.unconfirmedLitter;
  const detail = catOwnLitterDetail(value);
  return detail ? labels.ownLitter + ' · ' + detail : labels.ownLitter;
}
