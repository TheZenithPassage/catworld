import { composeActivitySummary, ActivitySummarySnapshot } from './filter-summary';
import { ACTIVITY_SUMMARY_TRANSLATIONS } from '../../../core/i18n/translations/sensitive-activity-summary.translations';
import { describeStayDates } from '../../../shared/stay-date-filters/stay-date-description';
import { StayDateMatchMode } from '../../../shared/stay-date-filters/stay-date-filter.model';

const base: ActivitySummarySnapshot = { pending: false, eventType: '', dates: {} };
const format = (value: string) => ({ from: 'local start', to: 'local end' })[value] ?? value;
describe('Sensitive Activity semantic summary', () => {
  it.each(['en', 'es'] as const)(
    'narrates every plural event set in %s without Stay context',
    (language) => {
      const copy = ACTIVITY_SUMMARY_TRANSLATIONS[language];
      for (const eventType of Object.keys(copy.events) as ActivitySummarySnapshot['eventType'][]) {
        const text = composeActivitySummary({ ...base, eventType }, copy, format, format, format);
        expect(text).toBe(
          (language === 'en' ? 'Showing ' : 'Mostrando ') + copy.events[eventType] + '.',
        );
      }
    },
  );
  it('lets each locale own a fully composed sentence and preserves broad plus exact predicates', () => {
    const snapshot: ActivitySummarySnapshot = {
      ...base,
      pending: true,
      eventType: 'PAYMENT_ANNULLED',
      actor: 'Alex',
      owner: 'Ada',
      occurredFrom: 'from',
      occurredTo: 'to',
      dates: { dateFrom: 'Monday', dateTo: 'Tuesday', dateMatchMode: 'STAY_WITHIN_RANGE' },
      exactStay: { owner: 'Ada', cats: ['Miso', 'Luna'], startAt: 'from', endAt: 'to' },
    };
    expect(
      composeActivitySummary(snapshot, ACTIVITY_SUMMARY_TRANSLATIONS.en, format, format, format),
    ).toBe(
      'When applied, showing payment annulments by Alex occurring at or after local start and before local end concerning stays for owner Ada starting on or after Monday and ending on or before Tuesday, limited to the exact stay for Miso, Luna with owner Ada, from local start to local end.',
    );
    expect(
      composeActivitySummary(snapshot, ACTIVITY_SUMMARY_TRANSLATIONS.es, format, format, format),
    ).toBe(
      'Al aplicar, se mostrarán anulaciones de pagos con autoría de Alex, desde local start inclusive y antes de local end, en relación con estancias del propietario Ada que empiezan el Monday o después y terminan el Tuesday o antes y únicamente con la estancia exacta de Miso, Luna, con propietario Ada, del local start al local end.',
    );
  });
  it.each(['en', 'es'] as const)(
    'keeps one-sided occurrence boundaries and unavailable descriptions in %s',
    (language) => {
      const copy = ACTIVITY_SUMMARY_TRANSLATIONS[language];
      const lower = composeActivitySummary(
        { ...base, occurredFrom: 'from', cat: null, exactStay: null },
        copy,
        format,
        format,
        format,
      );
      const upper = composeActivitySummary(
        { ...base, occurredTo: 'to', actor: null },
        copy,
        format,
        format,
        format,
      );
      expect(lower).toContain(
        language === 'en' ? 'at or after local start' : 'desde local start inclusive',
      );
      expect(upper).toContain(language === 'en' ? 'before local end' : 'antes de local end');
      expect(lower).toContain(copy.unavailable.cat);
      expect(lower).toContain(copy.unavailable.stay);
      expect(upper).toContain(copy.unavailable.actor);
    },
  );
  it.each([
    ['OVERLAPS', 'ending on or after Monday', 'starting on or before Monday', 'present on Monday'],
    [
      'STAY_WITHIN_RANGE',
      'starting on or after Monday',
      'ending on or before Monday',
      'starting and ending on Monday',
    ],
    ['RANGE_WITHIN_STAY', 'present on Monday', 'present on Monday', 'present on Monday'],
  ] as const)(
    'preserves %s boundary variants shared with Stay date explanations',
    (mode, from, to, same) => {
      const describe = (dateFrom?: string, dateTo?: string) =>
        describeStayDates(
          { dateFrom, dateTo, dateMatchMode: mode as StayDateMatchMode },
          ACTIVITY_SUMMARY_TRANSLATIONS.en.dates,
          format,
        );
      expect(describe('Monday')).toBe(from);
      expect(describe(undefined, 'Monday')).toBe(to);
      expect(describe('Monday', 'Monday')).toBe(same);
      expect(describe()).toBeUndefined();
      expect(describe('Monday', 'Tuesday')).toContain('Monday');
      expect(describe('Monday', 'Tuesday')).toContain('Tuesday');
    },
  );
});
