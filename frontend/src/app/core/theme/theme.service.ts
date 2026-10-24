import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';

export type AppTheme = 'light' | 'dark';

const STORAGE_KEY = 'catworld.theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);
  private readonly window = this.document.defaultView;
  private preference = this.readPreference();
  private readonly systemPreference = this.readSystemPreference();
  private readonly resolvedTheme = signal<AppTheme>(
    this.preference ?? (this.systemPreference?.matches ? 'dark' : 'light'),
  );

  readonly theme = this.resolvedTheme.asReadonly();

  constructor() {
    this.applyTheme(this.theme());

    const onSystemChange = (event: MediaQueryListEvent) => {
      if (this.preference === null) {
        this.applyTheme(event.matches ? 'dark' : 'light');
      }
    };
    this.systemPreference?.addEventListener('change', onSystemChange);
    inject(DestroyRef).onDestroy(() =>
      this.systemPreference?.removeEventListener('change', onSystemChange),
    );
  }

  setTheme(theme: AppTheme): void {
    // Keep the explicit choice in memory even when browser storage is unavailable.
    this.preference = theme;
    this.applyTheme(theme);
    try {
      this.window?.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // Switching remains available in restricted/private browser contexts.
    }
  }

  private applyTheme(theme: AppTheme): void {
    this.resolvedTheme.set(theme);
    this.document.documentElement.dataset['theme'] = theme;
    this.document.documentElement.style.colorScheme = theme;
  }

  private readPreference(): AppTheme | null {
    try {
      const stored = this.window?.localStorage.getItem(STORAGE_KEY);
      return stored === 'light' || stored === 'dark' ? stored : null;
    } catch {
      return null;
    }
  }

  private readSystemPreference(): MediaQueryList | null {
    try {
      return this.window?.matchMedia('(prefers-color-scheme: dark)') ?? null;
    } catch {
      return null;
    }
  }
}
