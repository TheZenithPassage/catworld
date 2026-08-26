import { DOCUMENT } from '@angular/common';
import { inject, Injectable, signal } from '@angular/core';

const DEFAULT_BUSINESS_TIME_ZONE = 'America/Argentina/Buenos_Aires';

interface RuntimeConfig {
  businessTimeZone?: unknown;
  buildId?: unknown;
}

@Injectable({ providedIn: 'root' })
export class RuntimeConfigService {
  private readonly document = inject(DOCUMENT);
  private executingBuildId?: string;
  private buildCheckInFlight?: Promise<void>;
  private lifecycleListenersRegistered = false;
  private reloadRequested = false;

  readonly businessTimeZone = signal(DEFAULT_BUSINESS_TIME_ZONE);

  async load(): Promise<void> {
    const config = await this.fetchRuntimeConfig();
    if (!config) return;

    this.applyBusinessTimeZone(config.businessTimeZone);

    const buildId = this.readBuildId(config.buildId);
    if (!buildId || this.executingBuildId) return;

    this.executingBuildId = buildId;
    this.registerLifecycleListeners();
  }

  private readonly onPageShow = (): void => {
    this.checkDeployedBuild();
  };

  private readonly onVisibilityChange = (): void => {
    if (this.document.visibilityState === 'visible') {
      this.checkDeployedBuild();
    }
  };

  private async fetchRuntimeConfig(): Promise<RuntimeConfig | undefined> {
    try {
      const response = await fetch('/runtime-config.json', { cache: 'no-store' });
      if (!response.ok) return undefined;

      const config: unknown = await response.json();
      if (!config || typeof config !== 'object' || Array.isArray(config)) return undefined;

      return config as RuntimeConfig;
    } catch {
      // Runtime configuration is optional outside the container deployment.
      return undefined;
    }
  }

  private applyBusinessTimeZone(value: unknown): void {
    if (typeof value !== 'string') return;

    try {
      new Intl.DateTimeFormat('en', { timeZone: value }).format();
      this.businessTimeZone.set(value);
    } catch {
      // Keep the deployment default when the configured timezone is invalid.
    }
  }

  private readBuildId(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined;

    const buildId = value.trim();
    return buildId || undefined;
  }

  private registerLifecycleListeners(): void {
    const browserWindow = this.document.defaultView;
    if (!browserWindow || this.lifecycleListenersRegistered) return;

    browserWindow.addEventListener('pageshow', this.onPageShow);
    this.document.addEventListener('visibilitychange', this.onVisibilityChange);
    this.lifecycleListenersRegistered = true;
  }

  private checkDeployedBuild(): void {
    if (!this.executingBuildId || this.reloadRequested || this.buildCheckInFlight) return;

    const buildCheck = this.compareDeployedBuild();
    this.buildCheckInFlight = buildCheck;

    const clearBuildCheck = (): void => {
      if (this.buildCheckInFlight === buildCheck) {
        this.buildCheckInFlight = undefined;
      }
    };
    void buildCheck.then(clearBuildCheck, clearBuildCheck);
  }

  private async compareDeployedBuild(): Promise<void> {
    const config = await this.fetchRuntimeConfig();
    const deployedBuildId = this.readBuildId(config?.buildId);
    if (!deployedBuildId || deployedBuildId === this.executingBuildId) return;

    const browserWindow = this.document.defaultView;
    if (!browserWindow) return;

    this.reloadRequested = true;
    try {
      browserWindow.location.reload();
    } catch {
      this.reloadRequested = false;
    }
  }
}
