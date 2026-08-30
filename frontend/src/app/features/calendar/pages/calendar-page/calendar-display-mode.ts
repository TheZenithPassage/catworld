export type CalendarDisplayMode = 'daily-labels' | 'daily-counts' | 'entry-exit-markers';

export const DEFAULT_CALENDAR_DISPLAY_MODE: CalendarDisplayMode = 'daily-labels';

export const CALENDAR_DISPLAY_MODES: CalendarDisplayMode[] = [
  'daily-labels',
  'daily-counts',
  'entry-exit-markers',
];

export function isCalendarDisplayMode(value: unknown): value is CalendarDisplayMode {
  return value === 'daily-labels' || value === 'daily-counts' || value === 'entry-exit-markers';
}
