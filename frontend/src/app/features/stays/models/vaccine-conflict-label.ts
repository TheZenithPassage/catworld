import { STAYS_TRANSLATIONS } from '../../../core/i18n/translations/stays.translations';
import { formatLocalDate } from '../../../shared/date/local-date-format';
import type { VaccineConflictViolation } from './stay.model';

type VaccineConflictCopy = (typeof STAYS_TRANSLATIONS)['en']['vaccineConflict'];

export function vaccineConflictLabels(
  conflict: Pick<VaccineConflictViolation, 'vaccineType' | 'reason' | 'expiresOn'>,
  copy: VaccineConflictCopy,
  locale: string,
): { vaccine: string; reason: string } {
  const { vaccineType, reason, expiresOn } = conflict;
  return {
    vaccine: vaccineType === 'RABIES' ? copy.vaccine.rabies : copy.vaccine.tripleFeline,
    reason: expiresOn
      ? `${copy.reason[reason]} (${formatLocalDate(expiresOn, locale)})`
      : copy.reason[reason],
  };
}
