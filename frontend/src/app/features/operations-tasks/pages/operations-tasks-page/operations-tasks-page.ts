import { HttpErrorResponse } from '@angular/common/http';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule, NgForm } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatError, MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { MatPaginator } from '@angular/material/paginator';
import { Subscription } from 'rxjs';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { BusinessTimeService } from '../../../../core/time/business-time.service';
import { formatLocalDate } from '../../../../shared/date/local-date-format';
import { EntityDetailDialogService } from '../../../../shared/entity-detail/entity-detail-dialog.service';
import { OwnerLookupAdapter } from '../../../../shared/entity-lookup/domain-lookup.adapters';
import { EntityLookupPage } from '../../../../shared/entity-lookup/entity-lookup.models';
import { RemoteEntitySelector } from '../../../../shared/entity-lookup/remote-entity-selector';
import { NativeBadInputDirective } from '../../../../shared/forms/native-bad-input.directive';
import { UiStateComponent } from '../../../../shared/ui-state/ui-state';
import { OwnerLookup } from '../../../owners/models/owner.model';
import {
  ActivityLookupService,
  StayLookup,
} from '../../../sensitive-activity/data-access/activity-lookup.service';
import {
  OperationsTask,
  OperationsTaskApiService,
  OperationsTaskBucket,
} from '../../data-access/operations-task-api.service';

const BUCKETS: readonly OperationsTaskBucket[] = [
  'OVERDUE',
  'TODAY',
  'UPCOMING',
  'UNDATED',
  'RESOLVED',
];

type CreateError =
  | 'descriptionRequired'
  | 'invalidDate'
  | 'chooseStay'
  | 'createFailed'
  | 'stayMissing';
type ResolutionError = 'resolutionFailed' | 'resolutionConflict';

@Component({
  selector: 'app-operations-tasks-page',
  imports: [
    FormsModule,
    MatButton,
    MatCard,
    MatCardContent,
    MatError,
    MatFormField,
    MatInput,
    MatLabel,
    MatPaginator,
    NativeBadInputDirective,
    RemoteEntitySelector,
    UiStateComponent,
  ],
  templateUrl: './operations-tasks-page.html',
  styleUrl: './operations-tasks-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationsTasksPage {
  private readonly api = inject(OperationsTaskApiService);
  private readonly stayLookup = inject(ActivityLookupService);
  private readonly details = inject(EntityDetailDialogService);
  private readonly businessTime = inject(BusinessTimeService);
  private readonly i18n = inject(I18nService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly ownerSelector =
    viewChild.required<RemoteEntitySelector<OwnerLookup>>('ownerSelector');
  private listRequest?: Subscription;
  private stayRequest?: Subscription;

  readonly copy = computed(() => this.i18n.text().operationsTasks);
  readonly ownerLookup = inject(OwnerLookupAdapter);
  readonly description = signal('');
  readonly dueDate = signal('');
  readonly selectedStay = signal<StayLookup | null>(null);
  readonly ownerId = signal<string | null>(null);
  readonly stays = signal<EntityLookupPage<StayLookup> | null>(null);
  readonly stayLoading = signal(false);
  readonly stayError = signal(false);
  private stayPage = 0;

  readonly tasks = signal<OperationsTask[]>([]);
  readonly groups = computed(() =>
    BUCKETS.map((bucket) => ({
      bucket,
      tasks: this.tasks().filter((task) => task.bucket === bucket),
    })),
  );
  readonly loading = signal(false);
  readonly loadError = signal(false);
  readonly saving = signal(false);
  readonly createError = signal<CreateError | null>(null);
  readonly changingId = signal<string | null>(null);
  readonly resolutionError = signal<ResolutionError | null>(null);

  constructor() {
    this.loadTasks();
  }

  loadTasks(): void {
    this.listRequest?.unsubscribe();
    this.loading.set(true);
    this.loadError.set(false);
    this.listRequest = this.api
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (tasks) => {
          this.tasks.set(tasks);
          this.loading.set(false);
        },
        error: () => {
          this.loadError.set(true);
          this.loading.set(false);
        },
      });
  }

  selectOwner(id: string | null): void {
    this.stayRequest?.unsubscribe();
    this.ownerId.set(id);
    this.selectedStay.set(null);
    this.stays.set(null);
    this.stayLoading.set(false);
    this.stayError.set(false);
    this.createError.set(null);
    if (id) this.findStays(0);
  }

  findStays(page: number): void {
    const ownerId = this.ownerId();
    if (!ownerId) return;
    this.stayRequest?.unsubscribe();
    this.stayPage = page;
    this.stayLoading.set(true);
    this.stayError.set(false);
    this.stayRequest = this.stayLookup
      .searchStays({ ownerId }, page)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stays) => {
          this.stays.set(stays);
          this.stayLoading.set(false);
        },
        error: () => {
          this.stayError.set(true);
          this.stayLoading.set(false);
        },
      });
  }

  retryStays(): void {
    this.findStays(this.stayPage);
  }

  selectStay(stay: StayLookup | null): void {
    this.selectedStay.set(stay);
    this.createError.set(null);
  }

  create(form: NgForm, dateInput: HTMLInputElement, stayPicker: HTMLDetailsElement): void {
    if (this.saving()) return;
    this.createError.set(null);
    const description = this.description().trim();
    const stayId = this.selectedStay()?.stayId ?? null;
    if (!description) {
      this.createError.set('descriptionRequired');
      return;
    }
    if (!dateInput.validity.valid) {
      this.createError.set('invalidDate');
      return;
    }
    if (form.invalid) return;
    if (!this.ownerSelector().markSubmitted()) {
      stayPicker.open = true;
      return;
    }
    if (this.ownerId() && !stayId) {
      stayPicker.open = true;
      this.createError.set('chooseStay');
      return;
    }

    this.saving.set(true);
    this.api
      .create({ description, dueDate: this.dueDate() || null, stayId })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.saving.set(false);
          form.resetForm({ description: '', dueDate: '' });
          this.ownerSelector().reset();
          this.loadTasks();
        },
        error: (error: HttpErrorResponse) => {
          this.saving.set(false);
          const missingStay = error.status === 404 && stayId !== null;
          if (missingStay) stayPicker.open = true;
          this.createError.set(missingStay ? 'stayMissing' : 'createFailed');
        },
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

  openStay(id: string): void {
    this.details
      .open({ entityType: 'stay', entityId: id })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.loadTasks());
  }

  displayDueDate(value: string): string {
    return formatLocalDate(value, this.i18n.dateLocale());
  }

  stayLabel(stay: StayLookup): string {
    const locale = this.i18n.dateLocale();
    const start = this.businessTime.formatLocalDateTime(stay.startAt, locale, 'short');
    const end = this.businessTime.formatLocalDateTime(stay.endAt, locale, 'short');
    return [start + ' – ' + end, ...stay.cats.map((cat) => cat.name)].join(' · ');
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
