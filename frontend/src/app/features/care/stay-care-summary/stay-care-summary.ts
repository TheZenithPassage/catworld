import {
  Component,
  DestroyRef,
  ElementRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { EMPTY, catchError, of, switchMap } from 'rxjs';

import { I18nService } from '../../../core/i18n/i18n.service';
import { CARE_TRANSLATIONS } from '../../../core/i18n/translations/care.translations';
import { BusinessTimeService } from '../../../core/time/business-time.service';
import { StayApiService } from '../../stays/services/stay-api.service';
import { CareApiService } from '../care-api.service';
import { CareRecord } from '../care.models';

const SUMMARY_COPY = {
  es: {
    title: 'Resumen de la estadía',
    loading: 'Cargando cuidados…',
    failed: 'No se pudo cargar el resumen.',
    retry: 'Reintentar',
    unavailable: 'El resumen está disponible cuando termina la estadía.',
    empty: 'No hay registros de cuidados para incluir.',
    choose: 'Elegí qué cuidados y observaciones querés compartir.',
    preview: 'Texto para compartir',
    close: 'Cerrar',
    copy: 'Copiar resumen',
    copied: 'Resumen copiado.',
    copyFailed: 'El resumen está seleccionado para que lo copies manualmente.',
    heading: 'Resumen de la estadía en CatWorld',
    reset: 'Volver al texto de los cuidados seleccionados',
    manualEdit:
      'Estás editando el resumen. Volvé al texto de los cuidados para cambiar la selección.',
  },
  en: {
    title: 'Stay summary',
    loading: 'Loading care records…',
    failed: 'Could not load the summary.',
    retry: 'Try again',
    unavailable: 'The summary is available after the stay ends.',
    empty: 'There are no care records to include.',
    choose: 'Choose the care records and observations to share.',
    preview: 'Text to share',
    close: 'Close',
    copy: 'Copy summary',
    copied: 'Summary copied.',
    copyFailed: 'The summary is selected so you can copy it manually.',
    heading: 'CatWorld stay summary',
    reset: 'Restore the text from selected care records',
    manualEdit: 'You are editing the summary. Restore the care text to change the selection.',
  },
};

interface CareGroup {
  id: string;
  name: string;
  records: CareRecord[];
}

@Component({
  selector: 'app-stay-care-summary',
  imports: [
    MatButton,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatFormField,
    MatInput,
    MatLabel,
  ],
  templateUrl: './stay-care-summary.html',
  styleUrl: './stay-care-summary.scss',
})
export class StayCareSummary {
  private readonly stayId = inject<string>(MAT_DIALOG_DATA);
  private readonly stays = inject(StayApiService);
  private readonly care = inject(CareApiService);
  private readonly i18n = inject(I18nService);
  private readonly time = inject(BusinessTimeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly previewInput = viewChild<ElementRef<HTMLTextAreaElement>>('previewInput');
  private readonly careCopy = computed(() => CARE_TRANSLATIONS[this.i18n.language()]);
  private readonly records = signal<CareRecord[]>([]);
  private readonly chosen = signal<ReadonlySet<string>>(new Set());
  private readonly editedText = signal<string | null>(null);

  readonly copy = computed(() => SUMMARY_COPY[this.i18n.language()]);
  readonly state = signal<'loading' | 'failed' | 'unavailable' | 'ready'>('loading');
  readonly copyStatus = signal<'copied' | 'copyFailed' | null>(null);
  readonly selectedCount = computed(() => this.chosen().size);
  readonly editingPreview = computed(() => this.editedText() !== null);
  readonly groups = computed(() => {
    const byCat = new Map<string, CareGroup>();
    for (const record of this.records()) {
      const group = byCat.get(record.catId);
      if (group) {
        group.records.push(record);
      } else {
        byCat.set(record.catId, { id: record.catId, name: record.catName, records: [record] });
      }
    }
    return Array.from(byCat.values());
  });
  readonly preview = computed(() => {
    const edited = this.editedText();
    if (edited !== null) return edited;
    const selected = this.chosen();
    const sections = this.groups().flatMap((cat) => {
      const lines = cat.records
        .filter((record) => selected.has(record.id))
        .map((record) => '• ' + this.describe(record));
      return lines.length ? [[cat.name, ...lines].join('\n')] : [];
    });
    return sections.length ? [this.copy().heading, ...sections].join('\n\n') : '';
  });

  constructor() {
    this.load();
  }

  load(): void {
    this.state.set('loading');
    this.records.set([]);
    this.chosen.set(new Set());
    this.restorePreview();
    this.stays
      .getStayDetail(this.stayId)
      .pipe(
        switchMap((stay) => {
          if (stay.status !== 'CHECKED_OUT') {
            this.state.set('unavailable');
            return EMPTY;
          }
          return this.care.history(this.stayId);
        }),
        catchError(() => {
          this.state.set('failed');
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((history) => {
        if (!history) return;
        this.records.set(history.records.filter((record) => !record.annulledAt));
        this.state.set('ready');
      });
  }

  isSelected(id: string): boolean {
    return this.chosen().has(id);
  }

  choose(id: string, checked: boolean): void {
    if (this.editingPreview() || !this.records().some((record) => record.id === id)) return;
    this.chosen.update((current) => {
      const next = new Set(current);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
    this.copyStatus.set(null);
  }

  restorePreview(): void {
    this.editedText.set(null);
    this.copyStatus.set(null);
  }

  edit(text: string): void {
    this.editedText.set(text);
    this.copyStatus.set(null);
  }

  describe(record: CareRecord): string {
    const care = this.careCopy();
    const label =
      record.note ??
      (record.routineSeedKey
        ? care.seeds[record.routineSeedKey]
        : (record.routineName ?? care.note));
    const shift = record.shift ? ' (' + care.shifts[record.shift] + ')' : '';
    const when = this.time.formatInstant(record.recordedAt, this.i18n.dateLocale());
    return when + ' · ' + label + shift;
  }

  async copySummary(): Promise<void> {
    const text = this.preview();
    if (!text.trim() || this.selectedCount() === 0) return;
    try {
      await navigator.clipboard.writeText(text);
      if (text === this.preview()) this.copyStatus.set('copied');
    } catch {
      if (text !== this.preview()) return;
      const input = this.previewInput()?.nativeElement;
      input?.focus();
      input?.select();
      this.copyStatus.set('copyFailed');
    }
  }
}
