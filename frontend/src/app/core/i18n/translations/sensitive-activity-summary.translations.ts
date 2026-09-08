import { ActivitySummaryCopy } from '../../../features/sensitive-activity/models/filter-summary';
import { AppLanguage } from '../app-language';

export const ACTIVITY_SUMMARY_TRANSLATIONS: Record<AppLanguage, ActivitySummaryCopy> = {
  en: {
    preparing: 'Preparing filter description…',
    invalid: 'Review the filters to describe a valid query.',
    unavailable: {
      actor: 'an unavailable account',
      owner: 'an unavailable owner',
      cat: 'an unavailable cat',
      stay: 'the unavailable exact stay',
    },
    events: {
      '': 'sensitive economic changes',
      NIGHTLY_RATE_CHANGED: 'nightly-rate changes',
      PRICING_OVERRIDE: 'pricing overrides',
      AGREED_AMOUNT_CORRECTED: 'agreed-amount corrections',
      PAYMENT_EDITED: 'payment-amount edits',
      PAYMENT_ANNULLED: 'payment annulments',
      PAYMENT_REMOVED: 'payment removals',
    },
    dates: {
      OVERLAPS: {
        both: (f, t) => `present for at least one day between ${f} and ${t}`,
        sameDay: (d) => `present on ${d}`,
        from: (d) => `ending on or after ${d}`,
        to: (d) => `starting on or before ${d}`,
      },
      STAY_WITHIN_RANGE: {
        both: (f, t) => `starting on or after ${f} and ending on or before ${t}`,
        sameDay: (d) => `starting and ending on ${d}`,
        from: (d) => `starting on or after ${d}`,
        to: (d) => `ending on or before ${d}`,
      },
      RANGE_WITHIN_STAY: {
        both: (f, t) => `covering the entire period from ${f} through ${t}`,
        sameDay: (d) => `present on ${d}`,
        from: (d) => `present on ${d}`,
        to: (d) => `present on ${d}`,
      },
    },
    exact: (cats, owner, start, end) =>
      `the exact stay for ${cats} with owner ${owner}, from ${start} to ${end}`,
    sentence: (p) => {
      let sentence = `${p.pending ? 'When applied, showing' : 'Showing'} ${p.events}`;
      if (p.actor) sentence += ` by ${p.actor}`;
      if (p.occurredFrom && p.occurredTo)
        sentence += ` occurring at or after ${p.occurredFrom} and before ${p.occurredTo}`;
      else if (p.occurredFrom) sentence += ` occurring at or after ${p.occurredFrom}`;
      else if (p.occurredTo) sentence += ` occurring before ${p.occurredTo}`;
      let broad = p.owner
        ? `stays for owner ${p.owner}`
        : p.cat
          ? `stays for cat ${p.cat}`
          : p.dates
            ? 'stays'
            : '';
      if (p.dates) broad += ` ${p.dates}`;
      if (broad && p.exact) sentence += ` concerning ${broad}, limited to ${p.exact}`;
      else if (broad || p.exact) sentence += ` concerning ${broad || p.exact}`;
      return sentence + '.';
    },
  },
  es: {
    preparing: 'Preparando la descripción de los filtros…',
    invalid: 'Revisa los filtros para describir una consulta válida.',
    unavailable: {
      actor: 'una cuenta no disponible',
      owner: 'un propietario no disponible',
      cat: 'un gato no disponible',
      stay: 'la estancia exacta no disponible',
    },
    events: {
      '': 'cambios económicos sensibles',
      NIGHTLY_RATE_CHANGED: 'cambios de tarifa por noche',
      PRICING_OVERRIDE: 'ajustes de precio',
      AGREED_AMOUNT_CORRECTED: 'correcciones del importe acordado',
      PAYMENT_EDITED: 'modificaciones del importe de pagos',
      PAYMENT_ANNULLED: 'anulaciones de pagos',
      PAYMENT_REMOVED: 'eliminaciones de pagos',
    },
    dates: {
      OVERLAPS: {
        both: (f, t) => `presentes al menos un día entre ${f} y ${t}`,
        sameDay: (d) => `presentes el ${d}`,
        from: (d) => `que terminan el ${d} o después`,
        to: (d) => `que empiezan el ${d} o antes`,
      },
      STAY_WITHIN_RANGE: {
        both: (f, t) => `que empiezan el ${f} o después y terminan el ${t} o antes`,
        sameDay: (d) => `que empiezan y terminan el ${d}`,
        from: (d) => `que empiezan el ${d} o después`,
        to: (d) => `que terminan el ${d} o antes`,
      },
      RANGE_WITHIN_STAY: {
        both: (f, t) => `que cubren el período completo del ${f} al ${t}`,
        sameDay: (d) => `presentes el ${d}`,
        from: (d) => `presentes el ${d}`,
        to: (d) => `presentes el ${d}`,
      },
    },
    exact: (cats, owner, start, end) =>
      `la estancia exacta de ${cats}, con propietario ${owner}, del ${start} al ${end}`,
    sentence: (p) => {
      let sentence = `${p.pending ? 'Al aplicar, se mostrarán' : 'Mostrando'} ${p.events}`;
      if (p.actor) sentence += ` con autoría de ${p.actor}`;
      if (p.occurredFrom && p.occurredTo)
        sentence += `, desde ${p.occurredFrom} inclusive y antes de ${p.occurredTo}`;
      else if (p.occurredFrom) sentence += `, desde ${p.occurredFrom} inclusive`;
      else if (p.occurredTo) sentence += `, antes de ${p.occurredTo}`;
      let broad = p.owner
        ? `estancias del propietario ${p.owner}`
        : p.cat
          ? `estancias del gato ${p.cat}`
          : p.dates
            ? 'estancias'
            : '';
      if (p.dates) broad += ` ${p.dates}`;
      if (broad && p.exact) sentence += `, en relación con ${broad} y únicamente con ${p.exact}`;
      else if (broad || p.exact) sentence += `, en relación con ${broad || p.exact}`;
      return sentence + '.';
    },
  },
};
