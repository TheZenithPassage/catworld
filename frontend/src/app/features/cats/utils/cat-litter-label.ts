import type { CatsTranslations } from '../../../core/i18n/translations/cats.translations';
import { CATWORLD_LITTER, OWN_LITTER } from '../models/cat.model';

export function catLitterLabel(
  value: string,
  labels: Pick<CatsTranslations['form'], 'ownLitter' | 'sharedLitter'>,
): string {
  if (value === CATWORLD_LITTER) return labels.sharedLitter;
  if (value === OWN_LITTER) return labels.ownLitter;
  return value;
}
