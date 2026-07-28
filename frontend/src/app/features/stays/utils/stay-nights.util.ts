const LOCAL_DATE_TIME_PATTERN =
  /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?$/;
const MILLISECONDS_PER_DAY = 86_400_000;

interface LocalDateTime {
  dateTimeValue: number;
  dateValue: number;
}

export function calculateStayNights(startAt: string, endAt: string): number | null {
  const start = parseLocalDateTime(startAt);
  const end = parseLocalDateTime(endAt);

  if (!start || !end || end.dateTimeValue <= start.dateTimeValue) {
    return null;
  }

  return (end.dateValue - start.dateValue) / MILLISECONDS_PER_DAY;
}

function parseLocalDateTime(value: string): LocalDateTime | null {
  const match = LOCAL_DATE_TIME_PATTERN.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const hours = Number(match[4]);
  const minutes = Number(match[5]);
  const seconds = Number(match[6] ?? 0);
  const milliseconds = Number((match[7] ?? '').padEnd(3, '0'));
  const normalized = new Date(0);

  normalized.setUTCFullYear(year, month - 1, day);
  normalized.setUTCHours(hours, minutes, seconds, milliseconds);

  if (
    normalized.getUTCFullYear() !== year ||
    normalized.getUTCMonth() !== month - 1 ||
    normalized.getUTCDate() !== day ||
    normalized.getUTCHours() !== hours ||
    normalized.getUTCMinutes() !== minutes ||
    normalized.getUTCSeconds() !== seconds ||
    normalized.getUTCMilliseconds() !== milliseconds
  ) {
    return null;
  }

  const date = new Date(0);

  date.setUTCFullYear(year, month - 1, day);
  date.setUTCHours(0, 0, 0, 0);

  return {
    dateTimeValue: normalized.getTime(),
    dateValue: date.getTime(),
  };
}
