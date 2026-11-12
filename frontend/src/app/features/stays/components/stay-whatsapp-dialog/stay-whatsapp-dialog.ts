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

import { I18nService } from '../../../../core/i18n/i18n.service';
import { BusinessTimeService } from '../../../../core/time/business-time.service';
import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';

type MessageKind = 'arrival' | 'departure' | 'transfer' | 'proof';

const MESSAGES = {
  es: {
    title: 'Textos para WhatsApp',
    description: 'Elegí un mensaje y revisalo antes de copiarlo.',
    kind: 'Tipo de mensaje',
    draft: 'Mensaje',
    close: 'Cerrar',
    copy: 'Copiar mensaje',
    copied: 'Mensaje copiado.',
    copyFailed: 'El mensaje está seleccionado para que lo copies manualmente.',
    loading: 'Cargando estadía…',
    loadFailed: 'No se pudo cargar la estadía.',
    canceled: 'Esta estadía está cancelada.',
    retry: 'Reintentar',
    choices: {
      arrival: 'Recordar ingreso',
      departure: 'Recordar salida',
      transfer: 'Coordinar traslado',
      proof: 'Pedir comprobantes',
    },
    greeting: (owner: string) => 'Hola, ' + owner + '.',
    arrival: (cats: string, when: string) =>
      'Te recordamos el ingreso de ' +
      cats +
      ' a CatWorld el ' +
      when +
      '. ¿Nos confirmás el horario?',
    departure: (cats: string, when: string) =>
      'Te recordamos la salida de ' +
      cats +
      ' de CatWorld el ' +
      when +
      '. ¿Nos confirmás el horario?',
    transfer: (cats: string) => 'Queremos coordinar el traslado de ' + cats + '.',
    pickup: (when: string) => 'Retiro para el ingreso: ' + when,
    dropoff: (when: string) => 'Entrega después de la estadía: ' + when,
    confirmTransfer: '¿Nos confirmás si te queda bien?',
    proof: (cats: string, when: string) =>
      '¿Nos podés mandar los comprobantes de vacunación de ' +
      cats +
      ' antes del ingreso del ' +
      when +
      '? Gracias.',
  },
  en: {
    title: 'WhatsApp messages',
    description: 'Choose a message and review it before copying.',
    kind: 'Message type',
    draft: 'Message',
    close: 'Close',
    copy: 'Copy message',
    copied: 'Message copied.',
    copyFailed: 'The message is selected so you can copy it manually.',
    loading: 'Loading stay…',
    loadFailed: 'Could not load the stay.',
    canceled: 'This stay has been canceled.',
    retry: 'Try again',
    choices: {
      arrival: 'Arrival reminder',
      departure: 'Departure reminder',
      transfer: 'Coordinate transfer',
      proof: 'Request proof of vaccination',
    },
    greeting: (owner: string) => 'Hi, ' + owner + '.',
    arrival: (cats: string, when: string) =>
      'A reminder that ' +
      cats +
      ' will arrive at CatWorld on ' +
      when +
      '. Can you confirm the time?',
    departure: (cats: string, when: string) =>
      'A reminder that ' + cats + ' will leave CatWorld on ' + when + '. Can you confirm the time?',
    transfer: (cats: string) => 'We would like to arrange transport for ' + cats + '.',
    pickup: (when: string) => 'Pick-up before the stay: ' + when,
    dropoff: (when: string) => 'Drop-off after the stay: ' + when,
    confirmTransfer: 'Can you confirm that works for you?',
    proof: (cats: string, when: string) =>
      'Could you send proof of vaccination for ' +
      cats +
      ' before their arrival on ' +
      when +
      '? Thank you.',
  },
};

@Component({
  selector: 'app-stay-whatsapp-dialog',
  imports: [
    MatButton,
    MatDialogActions,
    MatDialogClose,
    MatDialogContent,
    MatDialogTitle,
    MatFormField,
    MatLabel,
    MatInput,
  ],
  templateUrl: './stay-whatsapp-dialog.html',
  styleUrl: './stay-whatsapp-dialog.scss',
})
export class StayWhatsAppDialog {
  private readonly stayId = inject<string>(MAT_DIALOG_DATA);
  private readonly stayApi = inject(StayApiService);
  private readonly i18n = inject(I18nService);
  private readonly businessTime = inject(BusinessTimeService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly draftInput = viewChild<ElementRef<HTMLTextAreaElement>>('draftInput');
  private readonly edits = signal<Partial<Record<MessageKind, string>>>({});

  readonly stay = signal<Stay | null>(null);
  readonly loading = signal(false);
  readonly failed = signal(false);
  readonly copy = computed(() => MESSAGES[this.i18n.language()]);
  readonly selected = signal<MessageKind>('arrival');
  readonly copyStatus = signal<'copied' | 'copyFailed' | null>(null);
  readonly kinds = computed<MessageKind[]>(() => {
    const stay = this.stay();
    return stay?.arrivalTransferRequired || stay?.departureTransferRequired
      ? ['arrival', 'departure', 'transfer', 'proof']
      : ['arrival', 'departure', 'proof'];
  });
  readonly draft = computed(() => {
    const stay = this.stay();
    const kind = this.selected();
    return stay ? (this.edits()[kind] ?? this.compose(stay, kind)) : '';
  });

  constructor() {
    this.load();
  }

  load(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.failed.set(false);
    this.stayApi
      .getStayById(this.stayId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (stay) => {
          this.stay.set(stay);
          this.loading.set(false);
        },
        error: () => {
          this.failed.set(true);
          this.loading.set(false);
        },
      });
  }

  choose(kind: string): void {
    const choice = this.kinds().find((item) => item === kind);
    if (!choice) return;
    this.selected.set(choice);
    this.copyStatus.set(null);
  }

  edit(value: string): void {
    this.edits.update((drafts) => ({ ...drafts, [this.selected()]: value }));
    this.copyStatus.set(null);
  }

  async copyDraft(): Promise<void> {
    const draft = this.draft();
    if (!draft.trim()) return;
    try {
      await navigator.clipboard.writeText(draft);
      if (draft === this.draft()) this.copyStatus.set('copied');
    } catch {
      if (draft !== this.draft()) return;
      const input = this.draftInput()?.nativeElement;
      input?.focus();
      input?.select();
      this.copyStatus.set('copyFailed');
    }
  }

  private compose(stay: Stay, kind: MessageKind): string {
    const copy = this.copy();
    const locale = this.i18n.dateLocale();
    const names = new Intl.ListFormat(locale).format(stay.cats.map((cat) => cat.name));
    const start = this.businessTime.formatLocalDateTime(stay.startAt, locale);
    const end = this.businessTime.formatLocalDateTime(stay.endAt, locale);
    const greeting = copy.greeting(stay.ownerName);
    switch (kind) {
      case 'arrival':
        return [greeting, copy.arrival(names, start)].join('\n\n');
      case 'departure':
        return [greeting, copy.departure(names, end)].join('\n\n');
      case 'proof':
        return [greeting, copy.proof(names, start)].join('\n\n');
      case 'transfer':
        return [
          greeting,
          copy.transfer(names),
          ...(stay.arrivalTransferRequired ? [copy.pickup(start)] : []),
          ...(stay.departureTransferRequired ? [copy.dropoff(end)] : []),
          copy.confirmTransfer,
        ].join('\n');
    }
  }
}
