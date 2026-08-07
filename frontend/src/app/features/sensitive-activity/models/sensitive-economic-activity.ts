export const SENSITIVE_EVENT_TYPES = [
  'NIGHTLY_RATE_CHANGED',
  'PRICING_OVERRIDE',
  'AGREED_AMOUNT_CORRECTED',
  'PAYMENT_EDITED',
  'PAYMENT_ANNULLED',
  'PAYMENT_REMOVED',
] as const;

export type SensitiveEconomicEventType = (typeof SENSITIVE_EVENT_TYPES)[number];

export const NIGHTLY_RATE_CATEGORIES = ['ONE_CAT', 'TWO_CATS', 'THREE_PLUS_CATS'] as const;

export type NightlyRateCategory = (typeof NIGHTLY_RATE_CATEGORIES)[number];

export interface SensitiveActor {
  id: string;
  username: string;
}

export interface SensitiveStayContext {
  stayId: string;
  startAt: string;
  endAt: string;
  cancelledAt: string | null;
  owner: { id: string; fullName: string };
  cats: readonly { id: string; name: string }[];
}

interface BaseEvent {
  eventId: string;
  occurredAt: string;
  actor: SensitiveActor;
}

interface NightlyRateEventBase extends BaseEvent {
  affectedContext: null;
}

interface StayScopedEventBase extends BaseEvent {
  affectedContext: SensitiveStayContext;
}

interface PaymentContext {
  paymentId: string;
  paymentDate: string;
  note: string | null;
  registeredBy: SensitiveActor;
  registeredAt: string;
  reason: string;
}

export type SensitiveEconomicActivityEvent =
  | (NightlyRateEventBase & {
      eventType: 'NIGHTLY_RATE_CHANGED';
      category: NightlyRateCategory;
      previousRate: string | null;
      newRate: string | null;
    })
  | (StayScopedEventBase & {
      eventType: 'PRICING_OVERRIDE';
      retainedNightlyRate: string;
      numberOfNights: number;
      agreedAmount: string;
      reason: string;
    })
  | (StayScopedEventBase & {
      eventType: 'AGREED_AMOUNT_CORRECTED';
      previousAgreedAmount: string | null;
      newAgreedAmount: string;
      reason: string;
    })
  | (StayScopedEventBase &
      PaymentContext & {
        eventType: 'PAYMENT_EDITED';
        previousAmount: string;
        newAmount: string;
      })
  | (StayScopedEventBase &
      PaymentContext & {
        eventType: 'PAYMENT_ANNULLED';
        amount: string;
      })
  | (StayScopedEventBase &
      PaymentContext & {
        eventType: 'PAYMENT_REMOVED';
        amount: string;
        annulled: boolean;
      });

export interface SensitiveActivityFilters {
  actorId: string;
  occurredFrom: string;
  occurredTo: string;
  eventType: SensitiveEconomicEventType | '';
  ownerId: string;
  catId: string;
  stayId: string;
}

export const EMPTY_SENSITIVE_ACTIVITY_FILTERS: SensitiveActivityFilters = {
  actorId: '',
  occurredFrom: '',
  occurredTo: '',
  eventType: '',
  ownerId: '',
  catId: '',
  stayId: '',
};

export class MalformedSensitiveActivityError extends Error {}

export function parseSensitiveActivity(value: unknown): SensitiveEconomicActivityEvent[] {
  if (!Array.isArray(value)) throw new MalformedSensitiveActivityError('Expected an array');
  return value.map(parseEvent);
}

function parseEvent(value: unknown): SensitiveEconomicActivityEvent {
  const item = object(value);
  const common: BaseEvent = {
    eventId: text(item['eventId']),
    occurredAt: instant(item['occurredAt']),
    actor: actor(item['actor']),
  };
  const eventType = text(item['eventType']);
  switch (eventType) {
    case 'NIGHTLY_RATE_CHANGED':
      return {
        ...common,
        affectedContext: absentContext(item['affectedContext']),
        eventType,
        category: category(item['category']),
        previousRate: money(item['previousRate'], true),
        newRate: money(item['newRate'], true),
      };
    case 'PRICING_OVERRIDE':
      return {
        ...common,
        affectedContext: context(item['affectedContext']),
        eventType,
        retainedNightlyRate: money(item['retainedNightlyRate']),
        numberOfNights: integer(item['numberOfNights']),
        agreedAmount: money(item['agreedAmount']),
        reason: text(item['reason']),
      };
    case 'AGREED_AMOUNT_CORRECTED':
      return {
        ...common,
        affectedContext: context(item['affectedContext']),
        eventType,
        previousAgreedAmount: money(item['previousAgreedAmount'], true),
        newAgreedAmount: money(item['newAgreedAmount']),
        reason: text(item['reason']),
      };
    case 'PAYMENT_EDITED':
      return {
        ...common,
        affectedContext: context(item['affectedContext']),
        ...payment(item),
        eventType,
        previousAmount: money(item['previousAmount']),
        newAmount: money(item['newAmount']),
      };
    case 'PAYMENT_ANNULLED':
      return {
        ...common,
        affectedContext: context(item['affectedContext']),
        ...payment(item),
        eventType,
        amount: money(item['amount']),
      };
    case 'PAYMENT_REMOVED':
      return {
        ...common,
        affectedContext: context(item['affectedContext']),
        ...payment(item),
        eventType,
        amount: money(item['amount']),
        annulled: bool(item['annulled']),
      };
    default:
      throw new MalformedSensitiveActivityError(`Unknown event type: ${eventType}`);
  }
}

function payment(item: Record<string, unknown>): PaymentContext {
  return {
    paymentId: text(item['paymentId']),
    paymentDate: localDate(item['paymentDate']),
    note: nullableText(item['note']),
    registeredBy: actor(item['registeredBy']),
    registeredAt: instant(item['registeredAt']),
    reason: text(item['reason']),
  };
}

function actor(value: unknown): SensitiveActor {
  const item = object(value);
  return { id: text(item['id']), username: text(item['username']) };
}

function context(value: unknown): SensitiveStayContext {
  const item = object(value);
  const cats = item['cats'];
  if (!Array.isArray(cats) || cats.length === 0) {
    throw new MalformedSensitiveActivityError('Invalid cats');
  }
  const owner = object(item['owner']);
  return {
    stayId: text(item['stayId']),
    startAt: localDateTime(item['startAt']),
    endAt: localDateTime(item['endAt']),
    cancelledAt: nullableLocalDateTime(item['cancelledAt']),
    owner: { id: text(owner['id']), fullName: text(owner['fullName']) },
    cats: cats.map((catValue) => {
      const cat = object(catValue);
      return { id: text(cat['id']), name: text(cat['name']) };
    }),
  };
}

function absentContext(value: unknown): null {
  if (value !== null) {
    throw new MalformedSensitiveActivityError('Nightly rate changes cannot have stay context');
  }
  return null;
}

function category(value: unknown): NightlyRateCategory {
  const candidate = text(value);
  if (!NIGHTLY_RATE_CATEGORIES.includes(candidate as NightlyRateCategory)) {
    throw new MalformedSensitiveActivityError('Unknown nightly rate category');
  }
  return candidate as NightlyRateCategory;
}

function object(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new MalformedSensitiveActivityError('Expected an object');
  }
  return value as Record<string, unknown>;
}

function text(value: unknown): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new MalformedSensitiveActivityError('Expected text');
  }
  return value;
}

function nullableText(value: unknown): string | null {
  return value === null ? null : text(value);
}

function instant(value: unknown): string {
  const candidate = text(value);
  const match =
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?(Z|([+-])(\d{2}):(\d{2}))$/.exec(
      candidate,
    );
  const offsetHour = match?.[9] ? Number(match[9]) : 0;
  const offsetMinute = match?.[10] ? Number(match[10]) : 0;
  if (
    !match ||
    !validCalendarDate(Number(match[1]), Number(match[2]), Number(match[3])) ||
    Number(match[4]) > 23 ||
    Number(match[5]) > 59 ||
    Number(match[6]) > 59 ||
    offsetHour > 18 ||
    offsetMinute > 59 ||
    (offsetHour === 18 && offsetMinute !== 0) ||
    Number.isNaN(Date.parse(candidate))
  ) {
    throw new MalformedSensitiveActivityError('Expected an ISO instant');
  }
  return candidate;
}

function localDate(value: unknown): string {
  const candidate = text(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(candidate);
  if (!match || !validCalendarDate(Number(match[1]), Number(match[2]), Number(match[3]))) {
    throw new MalformedSensitiveActivityError('Expected an ISO local date');
  }
  return candidate;
}

function localDateTime(value: unknown): string {
  const candidate = text(value);
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,9})?$/.exec(candidate);
  if (
    !match ||
    !validCalendarDate(Number(match[1]), Number(match[2]), Number(match[3])) ||
    Number(match[4]) > 23 ||
    Number(match[5]) > 59 ||
    Number(match[6]) > 59
  ) {
    throw new MalformedSensitiveActivityError('Expected an ISO local date-time');
  }
  return candidate;
}

function nullableLocalDateTime(value: unknown): string | null {
  return value === null ? null : localDateTime(value);
}

function validCalendarDate(year: number, month: number, day: number): boolean {
  if (month < 1 || month > 12 || day < 1) return false;
  return day <= new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function money(value: unknown): string;
function money(value: unknown, nullable: true): string | null;
function money(value: unknown, nullable = false): string | null {
  if (nullable && value === null) return null;
  if (typeof value !== 'string' || !/^-?\d+(?:\.\d+)?$/.test(value)) {
    throw new MalformedSensitiveActivityError('Expected exact decimal string');
  }
  return value;
}

function integer(value: unknown): number {
  if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) {
    throw new MalformedSensitiveActivityError('Expected non-negative safe integer');
  }
  return value;
}

function bool(value: unknown): boolean {
  if (typeof value !== 'boolean') throw new MalformedSensitiveActivityError('Expected boolean');
  return value;
}
