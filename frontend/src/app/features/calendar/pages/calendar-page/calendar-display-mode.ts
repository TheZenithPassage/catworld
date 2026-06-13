export type CalendarDisplayMode = 'daily-labels' | 'compact-daily-labels' | 'entry-exit-markers';

export interface CalendarDisplaySettings {
  dailyLabelsEnabled: boolean;
  compactModeEnabled: boolean;
}

export const DEFAULT_UNFILTERED_CALENDAR_DISPLAY_MODE: CalendarDisplayMode = 'daily-labels';

export const CALENDAR_DISPLAY_MODES: CalendarDisplayMode[] = [
  'daily-labels',
  'compact-daily-labels',
  'entry-exit-markers',
];

export function isCalendarDisplayMode(value: unknown): value is CalendarDisplayMode {
  return (
    value === 'daily-labels' || value === 'compact-daily-labels' || value === 'entry-exit-markers'
  );
}

export function toCalendarDisplaySettings(mode: CalendarDisplayMode): CalendarDisplaySettings {
  switch (mode) {
    case 'daily-labels':
      return {
        dailyLabelsEnabled: true,
        compactModeEnabled: false,
      };

    case 'compact-daily-labels':
      return {
        dailyLabelsEnabled: true,
        compactModeEnabled: true,
      };

    case 'entry-exit-markers':
      return {
        dailyLabelsEnabled: false,
        compactModeEnabled: true,
      };
  }
}

export function toUnfilteredCalendarDisplayModeFromLegacySettings(
  dailyLabelsEnabled: unknown,
  compactModeEnabled: unknown,
): CalendarDisplayMode {
  if (dailyLabelsEnabled === true && compactModeEnabled === true) {
    return 'compact-daily-labels';
  }

  if (dailyLabelsEnabled === false && compactModeEnabled === true) {
    return 'entry-exit-markers';
  }

  return DEFAULT_UNFILTERED_CALENDAR_DISPLAY_MODE;
}
