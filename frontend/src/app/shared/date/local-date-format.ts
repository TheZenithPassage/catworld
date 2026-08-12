export function formatLocalDate(value: string, locale: string): string {
  const [year, month, day] = value.split('-').map(Number);

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
}
