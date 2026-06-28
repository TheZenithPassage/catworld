import { Type } from '@angular/core';
import { ActivatedRoute, Params } from '@angular/router';

export interface DetailDialogEntry {
  readonly title: string;
  readonly bodyComponent: Type<unknown>;
  readonly bodyInputs?: Record<string, unknown>;
  readonly editCommands?: readonly unknown[];
  readonly editQueryParams?: Params;
}

export interface DetailDialogRouteSync {
  readonly relativeTo?: ActivatedRoute;
  readonly queryParams: Params;
  readonly closeQueryParams?: Params;
  readonly replaceUrl?: boolean;
}

export interface DetailDialogOpenOptions {
  readonly routeSync?: DetailDialogRouteSync;
}

export interface DetailDialogStackItem {
  readonly entry: DetailDialogEntry;
  readonly routeSync?: DetailDialogRouteSync;
}
