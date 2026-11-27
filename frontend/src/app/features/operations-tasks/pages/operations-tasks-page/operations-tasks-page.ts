import { DOCUMENT } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { fromEvent, Subscription } from 'rxjs';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { BusinessTimeService } from '../../../../core/time/business-time.service';
import { formatLocalDate } from '../../../../shared/date/local-date-format';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import type { EntityReference } from '../../../../shared/entity-detail/entity-reference';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { CreateOperationsTaskDialog } from '../../components/create-operations-task-dialog/create-operations-task-dialog';
import {
  OperationsTask,
  OperationsTaskApiService,
  OperationsTaskBucket,
} from '../../data-access/operations-task-api.service';

type TaskTab = 'ALL' | OperationsTaskBucket;
type ResolutionError = 'resolutionFailed' | 'resolutionConflict';
type TaskLink = EntityReference & { entityType: 'owner' | 'cat' | 'stay' };

const OPEN_BUCKETS = ['OVERDUE', 'TODAY', 'UPCOMING', 'UNDATED'] as const;
const REFRESH_INTERVAL_MS = 60_000;

@Component({
  selector: 'app-operations-tasks-page',
  imports: [MatButton, MatTabLink, MatTabNav, MatTabNavPanel, UiStateComponent],
  templateUrl: './operations-tasks-page.html',
  styleUrl: './operations-tasks-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationsTasksPage {
  private readonly api = inject(OperationsTaskApiService);
  private readonly details = inject(EntityDetailDialogService);
  private readonly dialog = inject(MatDialog);
  private readonly document = inject(DOCUMENT);
  private readonly businessTime = inject(BusinessTimeService);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);
  private listRequest?: Subscription;
  private refreshTimer?: ReturnType<typeof setTimeout>;

  readonly copy = computed(() => this.i18n.text().operationsTasks);
  readonly tabs: readonly TaskTab[] = [
    'ALL',
    'TODAY',
    'OVERDUE',
    'UPCOMING',
    'UNDATED',
    'RESOLVED',
  ];
  readonly tab = signal<TaskTab>('ALL');
  readonly tasks = signal<OperationsTask[]>([]);
  readonly groups = computed(() => {
    const tab = this.tab();
    const buckets: readonly OperationsTaskBucket[] = tab === 'ALL' ? OPEN_BUCKETS : [tab];
    return buckets
      .map((bucket) => ({
        bucket,
        tasks: this.tasks().filter((task) => task.bucket === bucket),
      }))
      .filter((group) => group.tasks.length > 0);
  });
  readonly loading = signal(false);
  readonly loaded = signal(false);
  readonly loadError = signal(false);
  readonly changingId = signal<string | null>(null);
  readonly resolutionError = signal<ResolutionError | null>(null);

  constructor() {
    this.destroyRef.onDestroy(() => clearTimeout(this.refreshTimer));
    fromEvent(this.document, 'visibilitychange')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        if (this.document.visibilityState === 'visible') {
          this.loadTasks();
        } else {
          clearTimeout(this.refreshTimer);
        }
      });
    this.loadTasks();
  }

  loadTasks(): void {
    clearTimeout(this.refreshTimer);
    this.listRequest?.unsubscribe();
    this.loading.set(true);
    this.listRequest = this.api
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tasks) => {
          this.tasks.set(tasks);
          this.loaded.set(true);
          this.loadError.set(false);
          this.scheduleRefresh();
        },
        error: () => {
          this.loadError.set(true);
          this.scheduleRefresh();
        },
      });
  }

  private scheduleRefresh(): void {
    this.loading.set(false);
    if (this.document.visibilityState === 'visible') {
      this.refreshTimer = setTimeout(() => this.loadTasks(), REFRESH_INTERVAL_MS);
    }
  }

  openCreate(): void {
    this.dialog
      .open<CreateOperationsTaskDialog, void, OperationsTask>(CreateOperationsTaskDialog, {
        width: '32rem',
        maxWidth: 'calc(100vw - 2rem)',
        autoFocus: 'textarea[name="description"]',
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((task) => {
        if (!task) return;
        if (this.tab() !== 'ALL' && this.tab() !== task.bucket) {
          this.tab.set(task.bucket);
        }
        this.loadTasks();
      });
  }

  toggleResolution(task: OperationsTask): void {
    if (this.changingId()) return;
    this.changingId.set(task.id);
    this.resolutionError.set(null);
    this.api
      .changeResolution(task, task.bucket !== 'RESOLVED')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.changingId.set(null);
          this.loadTasks();
        },
        error: (error: HttpErrorResponse) => {
          this.changingId.set(null);
          const stale = error.status === 409;
          this.resolutionError.set(stale ? 'resolutionConflict' : 'resolutionFailed');
          if (stale) this.loadTasks();
        },
      });
  }

  linkFor(task: OperationsTask): TaskLink | null {
    if (task.catId) return { entityType: 'cat', entityId: task.catId };
    if (task.ownerId) return { entityType: 'owner', entityId: task.ownerId };
    if (task.stayId) return { entityType: 'stay', entityId: task.stayId };
    return null;
  }

  openLink(link: TaskLink): void {
    this.details
      .open(link)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadTasks());
  }

  displayDueDate(value: string): string {
    return formatLocalDate(value, this.i18n.dateLocale());
  }

  attribution(task: OperationsTask): string {
    const copy = this.copy();
    const event = task.lastTransition ?? task.created;
    const at = this.businessTime.formatInstant(event.at, this.i18n.dateLocale());
    if (!task.lastTransition) return copy.createdBy(event.username, at);
    const label = task.bucket === 'RESOLVED' ? copy.resolvedBy : copy.reopenedBy;
    return label(event.username, at);
  }
}
