import { Injectable } from '@angular/core';

import {
  getDefaultStayStatusVisibility,
  STAY_STATUS_FILTER_OPTIONS,
  StayStatusVisibility,
} from '../utils/stay-status.util';

@Injectable({
  providedIn: 'root',
})
export class StayStatusVisibilityPreferencesService {
  private readonly storageKey = 'catworld.stay.statusVisibility';

  read(): StayStatusVisibility {
    const defaultVisibility = getDefaultStayStatusVisibility();

    try {
      const storedValue = localStorage.getItem(this.storageKey);

      if (!storedValue) {
        return defaultVisibility;
      }

      const parsedValue: unknown = JSON.parse(storedValue);

      if (!this.isObjectRecord(parsedValue)) {
        return defaultVisibility;
      }

      const statusVisibility: StayStatusVisibility = { ...defaultVisibility };

      for (const option of STAY_STATUS_FILTER_OPTIONS) {
        const storedStatusValue = parsedValue[option.status];

        statusVisibility[option.status] =
          typeof storedStatusValue === 'boolean'
            ? storedStatusValue
            : defaultVisibility[option.status];
      }

      return statusVisibility;
    } catch {
      return defaultVisibility;
    }
  }

  store(statusVisibility: StayStatusVisibility): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(statusVisibility));
    } catch {
      return;
    }
  }

  private isObjectRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null && !Array.isArray(value);
  }
}
