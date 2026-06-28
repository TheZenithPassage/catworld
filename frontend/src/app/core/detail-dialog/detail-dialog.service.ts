import { computed, DestroyRef, Injectable, signal } from '@angular/core';
import { Dialog, DialogRef } from '@angular/cdk/dialog';
import { NavigationEnd, Params, Router } from '@angular/router';
import { filter, take } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import {
  DetailDialogEntry,
  DetailDialogOpenOptions,
  DetailDialogRouteSync,
  DetailDialogStackItem,
} from './detail-dialog.model';
import { DetailDialogShellComponent } from './detail-dialog-shell/detail-dialog-shell';

@Injectable({ providedIn: 'root' })
export class DetailDialogService {
  private readonly history = signal<DetailDialogStackItem[]>([]);
  private readonly activeIndex = signal(-1);
  private dialogRef: DialogRef<void, DetailDialogShellComponent> | null = null;
  private closingThroughService = false;

  readonly currentEntry = computed(() => this.currentItem()?.entry ?? null);
  readonly canGoBack = computed(() => this.activeIndex() > 0);

  constructor(
    private readonly dialog: Dialog,
    private readonly router: Router,
    destroyRef: DestroyRef,
  ) {
    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntilDestroyed(destroyRef),
      )
      .subscribe(() => {
        this.reconcileWithRoute();
      });
  }

  open(entry: DetailDialogEntry, options: DetailDialogOpenOptions = {}): void {
    const item: DetailDialogStackItem = {
      entry,
      routeSync: options.routeSync,
    };

    if (this.dialogRef) {
      this.history.set([item]);
      this.activeIndex.set(0);
      this.syncRoute(item.routeSync);
      return;
    }

    this.history.set([item]);
    this.activeIndex.set(0);
    this.dialogRef = this.dialog.open<void, DetailDialogService, DetailDialogShellComponent>(
      DetailDialogShellComponent,
      {
        id: 'catworld-detail-dialog',
        data: this,
        role: 'dialog',
        panelClass: 'catworld-detail-dialog-panel',
        backdropClass: 'catworld-detail-dialog-backdrop',
        width: 'min(44rem, calc(100vw - 2rem))',
        maxWidth: 'calc(100vw - 2rem)',
        maxHeight: 'calc(100dvh - 2rem)',
        ariaLabelledBy: 'detail-dialog-title',
        autoFocus: 'dialog',
        restoreFocus: true,
        closeOnNavigation: false,
      },
    );

    this.dialogRef.closed.pipe(take(1)).subscribe(() => {
      if (!this.closingThroughService) {
        this.syncCloseRoute(this.currentRouteSync());
      }

      this.reset();
    });

    this.syncRoute(item.routeSync);
  }

  replace(entry: DetailDialogEntry, options: DetailDialogOpenOptions = {}): void {
    if (!this.dialogRef) {
      this.open(entry, options);
      return;
    }

    const item: DetailDialogStackItem = {
      entry,
      routeSync: options.routeSync,
    };

    const retainedHistory = this.history().slice(0, this.activeIndex() + 1);
    this.history.set([...retainedHistory, item]);
    this.activeIndex.set(retainedHistory.length);
    this.syncRoute(item.routeSync);
  }

  back(): void {
    if (this.activeIndex() <= 0) {
      this.close();
      return;
    }

    this.activeIndex.update((currentIndex) => currentIndex - 1);
    this.syncRoute(this.currentRouteSync());
  }

  close(): void {
    if (!this.dialogRef) {
      return;
    }

    this.closingThroughService = true;
    this.syncCloseRoute(this.currentRouteSync());
    this.dialogRef.close();
  }

  editCurrent(): void {
    const entry = this.currentEntry();

    if (!entry?.editCommands) {
      return;
    }

    this.closeWithoutRouteSync();
    void this.router.navigate(entry.editCommands, {
      queryParams: entry.editQueryParams,
    });
  }

  private currentItem(): DetailDialogStackItem | undefined {
    const currentIndex = this.activeIndex();

    if (currentIndex < 0) {
      return undefined;
    }

    return this.history()[currentIndex];
  }

  private currentRouteSync(): DetailDialogRouteSync | undefined {
    return this.currentItem()?.routeSync;
  }

  private reconcileWithRoute(): void {
    if (!this.dialogRef || this.closingThroughService) {
      return;
    }

    const matchingIndex = this.history().findIndex((item) =>
      this.routeSyncMatchesCurrentUrl(item.routeSync),
    );

    if (matchingIndex >= 0) {
      this.activeIndex.set(matchingIndex);
      return;
    }

    if (this.currentRouteSync()) {
      this.closeWithoutRouteSync();
    }
  }

  private routeSyncMatchesCurrentUrl(routeSync: DetailDialogRouteSync | undefined): boolean {
    if (!routeSync) {
      return false;
    }

    const currentQueryParams = this.router.parseUrl(this.router.url).queryParams;

    return Object.entries(routeSync.queryParams).every(([key, expectedValue]) =>
      this.queryParamValueMatches(currentQueryParams[key], expectedValue),
    );
  }

  private queryParamValueMatches(actualValue: unknown, expectedValue: unknown): boolean {
    if (expectedValue === null || expectedValue === undefined) {
      return actualValue === undefined;
    }

    if (Array.isArray(actualValue)) {
      return actualValue.map(String).includes(String(expectedValue));
    }

    return String(actualValue) === String(expectedValue);
  }

  private syncRoute(routeSync: DetailDialogRouteSync | undefined): void {
    if (!routeSync) {
      return;
    }

    void this.router.navigate([], {
      relativeTo: routeSync.relativeTo,
      queryParams: routeSync.queryParams,
      queryParamsHandling: 'merge',
      replaceUrl: routeSync.replaceUrl ?? false,
    });
  }

  private syncCloseRoute(routeSync: DetailDialogRouteSync | undefined): void {
    if (!routeSync) {
      return;
    }

    const closeQueryParams =
      routeSync.closeQueryParams ?? this.toClearedQueryParams(routeSync.queryParams);

    void this.router.navigate([], {
      relativeTo: routeSync.relativeTo,
      queryParams: closeQueryParams,
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  private toClearedQueryParams(queryParams: Params): Params {
    return Object.keys(queryParams).reduce<Params>((clearedQueryParams, key) => {
      clearedQueryParams[key] = null;
      return clearedQueryParams;
    }, {});
  }

  private closeWithoutRouteSync(): void {
    if (!this.dialogRef) {
      return;
    }

    this.closingThroughService = true;
    this.dialogRef.close();
  }

  private reset(): void {
    this.history.set([]);
    this.activeIndex.set(-1);
    this.dialogRef = null;
    this.closingThroughService = false;
  }
}
