import type { CatsTranslations } from '../../../core/i18n/translations/cats.translations';
import { CatLitterPreference, CATWORLD_LITTER, OWN_LITTER } from '../models/cat.model';

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
  preference?: CatLitterPreference | null,
  ownDetail?: string | null,
): string {
  const choice = preference === undefined ? catLitterChoice(value) : preference?.toLowerCase();
  if (choice === 'shared') return labels.sharedLitter;
  if (!choice) return labels.unconfirmedLitter;
  const detail = preference === undefined ? catOwnLitterDetail(value) : ownDetail;
  return detail ? labels.ownLitter + ' · ' + detail : labels.ownLitter;
}

export function catLitterRequest(
  value: string,
  preference: CatLitterPreference | null | undefined,
) {
  const detail = value.trim() || null;
  if (preference === undefined) return { litterBrand: detail };
  return {
    litterPreference: preference,
    litterDetail: preference === 'OWN' ? detail : null,
    litterBrand:
      preference === 'SHARED'
        ? CATWORLD_LITTER
        : preference === 'OWN'
          ? detail === CATWORLD_LITTER
            ? OWN_LITTER
            : (detail ?? OWN_LITTER)
          : null,
  };
}
