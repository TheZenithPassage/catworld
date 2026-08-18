import { Injectable, signal } from '@angular/core';

const DEFAULT_BUSINESS_TIME_ZONE = 'America/Argentina/Buenos_Aires';

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  readonly businessTimeZone = signal(DEFAULT_BUSINESS_TIME_ZONE);

  async load(): Promise<void> {
    try {
      const response = await fetch('/runtime-config.json', { cache: 'no-store' });
      if (!response.ok) return;
      const config = (await response.json()) as { businessTimeZone?: unknown };
      if (typeof config.businessTimeZone !== 'string') return;
      new Intl.DateTimeFormat('en', { timeZone: config.businessTimeZone }).format();
      this.businessTimeZone.set(config.businessTimeZone);
    } catch {
      // Keep the deployment default when runtime configuration is unavailable.
    }
  }
}
