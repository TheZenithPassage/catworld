import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  output,
  Renderer2,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatAutocomplete, MatAutocompleteTrigger } from '@angular/material/autocomplete';
import { MatIconButton } from '@angular/material/button';
import { MatOptgroup, MatOption } from '@angular/material/core';
import { MatFormField, MatLabel, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { Subscription, switchMap, timer } from 'rxjs';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { BusinessTimeService } from '../../../../core/time/business-time.service';
import { DeceasedMarker } from '../../../../shared/deceased-marker/deceased-marker';
import {
  OperationsTaskApiService,
  OperationsTaskLinkKind,
  OperationsTaskLinkOptions,
  OperationsTaskLinkTarget,
} from '../../data-access/operations-task-api.service';

interface Name {
  name: string;
  deceased?: boolean;
}

interface LinkOption extends OperationsTaskLinkTarget {
  primary: Name;
  context: Name[];
}

interface LinkGroup {
  kind: OperationsTaskLinkKind;
  options: LinkOption[];
  hasMore: boolean;
  page: number;
}

type PanelAction = { more: OperationsTaskLinkKind } | { retry: true };
type PanelValue = LinkOption | PanelAction;

const STAY_STATUS = {
  RESERVED: 'reserved',
  CHECKED_IN: 'checked-in',
  CHECKED_OUT: 'checked-out',
  CANCELLED: 'cancelled',
} as const;

@Directive({
  selector: 'mat-option[taskLinkAction]',
  host: { '(mousedown)': '$event.preventDefault()' },
})
export class OperationsTaskLinkAction {
  readonly actionRequested = output<void>();

  constructor() {
    const option = inject(MatOption);
    const renderer = inject(Renderer2);
    const element = inject(ElementRef<HTMLElement>).nativeElement;
    // Keep action rows from being selected by the autocomplete.
    const disconnect = renderer.listen(
      element,
      'click',
      (event: MouseEvent) => {
        event.stopImmediatePropagation();
        if (!option.disabled) this.actionRequested.emit();
      },
      { capture: true },
    );
    inject(DestroyRef).onDestroy(disconnect);
  }
}

@Component({
  selector: 'app-operations-task-link-picker',
  imports: [
    DeceasedMarker,
    MatAutocomplete,
    MatAutocompleteTrigger,
    MatFormField,
    MatIconButton,
    MatInput,
    MatLabel,
    MatOptgroup,
    MatOption,
    MatSuffix,
    OperationsTaskLinkAction,
  ],
  templateUrl: './operations-task-link-picker.html',
  styleUrl: './operations-task-link-picker.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OperationsTaskLinkPicker implements AfterViewInit {
  private readonly api = inject(OperationsTaskApiService);
  private readonly i18n = inject(I18nService);
  private readonly businessTime = inject(BusinessTimeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly renderer = inject(Renderer2);
  private readonly linkInput = viewChild.required<ElementRef<HTMLInputElement>>('linkInput');
  private readonly trigger = viewChild.required(MatAutocompleteTrigger);
  private request?: Subscription;

  readonly disabled = input(false);
  readonly selectionChange = output<OperationsTaskLinkTarget | null>();
  readonly copy = computed(() => this.i18n.text().operationsTasks);
  readonly query = signal('');
  readonly selected = signal<LinkOption | null>(null);
  readonly groups = signal<LinkGroup[]>([]);
  readonly loading = signal(false);
  readonly loadingMore = signal<OperationsTaskLinkKind | null>(null);
  readonly failed = signal<'search' | OperationsTaskLinkKind | null>(null);
  readonly selectedLabel = computed(() => this.displayValue(this.selected()));
  readonly displayValue = (value: PanelValue | null): string => {
    if (!value || typeof value !== 'object' || !('primary' in value)) return this.query();
    const context = value.kind === 'OWNER' ? [] : value.context.map(({ name }) => name);
    return [this.copy().linkTypes[value.kind], value.primary.name, ...context].join(' · ');
  };

  ngAfterViewInit(): void {
    const disconnect = this.renderer.listen(
      this.linkInput().nativeElement,
      'keydown',
      (event: KeyboardEvent) => this.handleActionKey(event),
      { capture: true },
    );
    this.destroyRef.onDestroy(disconnect);
  }

  search(value: string): void {
    this.request?.unsubscribe();
    this.query.set(value);
    this.groups.set([]);
    this.failed.set(null);
    this.loadingMore.set(null);
    const query = value.trim();
    this.loading.set(!!query);
    if (!query) return;

    this.request = timer(250)
      .pipe(
        switchMap(() => this.api.searchLinks(query)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (results) => {
          const kinds: OperationsTaskLinkKind[] = results.ownersFirst
            ? ['OWNER', 'CAT', 'STAY']
            : ['CAT', 'OWNER', 'STAY'];
          this.groups.set(
            kinds
              .map((kind) => this.readGroup(kind, results, 0))
              .filter((group) => group.options.length),
          );
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.failed.set('search');
        },
      });
  }

  choose(value: PanelValue): void {
    if (this.disabled() || !('primary' in value)) return;
    this.request?.unsubscribe();
    this.selected.set(value);
    this.selectionChange.emit({ kind: value.kind, id: value.id });
  }

  runAction(action: PanelAction): void {
    if (this.disabled()) return;
    if ('more' in action) this.loadMore(action.more);
    else this.search(this.query());
  }

  private handleActionKey(event: KeyboardEvent): void {
    if (
      event.key !== 'Enter' ||
      event.isComposing ||
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      !this.trigger().panelOpen
    )
      return;
    const option = this.trigger().activeOption;
    const action = option?.value as PanelValue | undefined;
    if (!option || !action || 'primary' in action) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (!option.disabled) this.runAction(action);
  }

  clear(): void {
    this.selected.set(null);
    this.search('');
    this.selectionChange.emit(null);
    this.linkInput().nativeElement.focus();
  }

  private loadMore(kind: OperationsTaskLinkKind): void {
    const current = this.groups().find((group) => group.kind === kind);
    if (this.loadingMore() || !current?.hasMore) return;
    this.loadingMore.set(kind);
    this.failed.set(null);
    const nextPage = current.page + 1;
    this.request = this.api
      .searchLinks(this.query().trim(), kind, nextPage)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (results) => {
          const more = this.readGroup(kind, results, nextPage);
          const displayedIds = new Set(current.options.map(({ id }) => id));
          more.options = [
            ...current.options,
            ...more.options.filter(({ id }) => !displayedIds.has(id)),
          ];
          this.groups.update((groups) =>
            groups.map((group) => (group.kind === kind ? more : group)),
          );
          this.loadingMore.set(null);
        },
        error: () => {
          this.loadingMore.set(null);
          this.failed.set(kind);
        },
      });
  }

  private readGroup(
    kind: OperationsTaskLinkKind,
    results: OperationsTaskLinkOptions,
    page: number,
  ): LinkGroup {
    if (kind === 'OWNER') {
      return {
        kind,
        page,
        options: (results.owners?.items ?? []).map((owner) => ({
          kind,
          id: owner.id,
          primary: { name: owner.fullName, deceased: owner.deceased },
          context: owner.currentCats,
        })),
        hasMore: results.owners?.hasMore ?? false,
      };
    }
    if (kind === 'CAT') {
      return {
        kind,
        page,
        options: (results.cats?.items ?? []).map((cat) => ({
          kind,
          id: cat.id,
          primary: cat,
          context: [{ name: cat.ownerName, deceased: cat.ownerDeceased }],
        })),
        hasMore: results.cats?.hasMore ?? false,
      };
    }

    const locale = this.i18n.dateLocale();
    return {
      kind,
      page,
      options: (results.stays?.items ?? []).map((stay) => {
        const start = this.businessTime.formatLocalDateTime(stay.startAt, locale, 'short');
        const end = this.businessTime.formatLocalDateTime(stay.endAt, locale, 'short');
        const status = this.i18n.text().stays.status[STAY_STATUS[stay.status]];
        return {
          kind,
          id: stay.id,
          primary: { name: start + ' – ' + end + ' · ' + status },
          context: [...stay.cats, { name: stay.ownerName, deceased: stay.ownerDeceased }],
        };
      }),
      hasMore: results.stays?.hasMore ?? false,
    };
  }
}
