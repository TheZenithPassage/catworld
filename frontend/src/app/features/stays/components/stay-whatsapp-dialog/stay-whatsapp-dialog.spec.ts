import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { vi } from 'vitest';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { Stay } from '../../models/stay.model';
import { StayApiService } from '../../services/stay-api.service';
import { StayWhatsAppDialog } from './stay-whatsapp-dialog';

describe('StayWhatsAppDialog', () => {
  const api = { getStayById: vi.fn() };
  const stay = {
    stayId: 'stay-1',
    ownerName: 'Tutor de prueba',
    cats: [
      { catId: 'cat-1', name: 'Mora' },
      { catId: 'cat-2', name: 'Luna' },
      { catId: 'cat-3', name: 'Simón' },
      { catId: 'cat-4', name: 'Pepa' },
    ],
    startAt: '2026-11-12T21:30:00',
    endAt: '2026-11-14T08:05:00',
    cancelledAt: null,
    arrivalTransferRequired: false,
    departureTransferRequired: true,
    notes: 'Nota interna privada',
    agreedAmount: '30000',
  } satisfies Partial<Stay>;

  let fixture: ComponentFixture<StayWhatsAppDialog>;
  let dialog: StayWhatsAppDialog;

  beforeEach(async () => {
    vi.resetAllMocks();
    api.getStayById.mockReturnValue(of(stay));
    await TestBed.configureTestingModule({
      imports: [StayWhatsAppDialog],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: stay.stayId },
        { provide: MatDialogRef, useValue: {} },
        { provide: StayApiService, useValue: api },
      ],
    }).compileComponents();
    TestBed.inject(I18nService).language.set('es');
  });

  function open() {
    fixture = TestBed.createComponent(StayWhatsAppDialog);
    dialog = fixture.componentInstance;
    fixture.detectChanges();
  }

  it('uses the complete cat list and only the requested transfer leg', () => {
    open();
    expect(api.getStayById).toHaveBeenCalledWith(stay.stayId);
    expect(dialog.draft()).toContain('21:30');
    dialog.choose('transfer');
    for (const cat of stay.cats) expect(dialog.draft()).toContain(cat.name);
    expect(dialog.draft()).toContain('Salida prevista:');
    expect(dialog.draft()).toContain('Coordinemos el horario de entrega.');
    expect(dialog.draft()).toContain('08:05');
    expect(dialog.draft()).not.toContain('horario de retiro');
    expect(dialog.draft()).not.toContain(stay.notes);
    expect(dialog.draft()).not.toContain(stay.agreedAmount);
  });

  it('preserves an edited draft when switching messages and omits unavailable transfers', () => {
    api.getStayById.mockReturnValue(of({ ...stay, departureTransferRequired: false }));
    open();
    expect(dialog.kinds()).not.toContain('transfer');
    dialog.edit('Texto ajustado para el tutor');
    dialog.choose('proof');
    expect(dialog.draft()).toContain('comprobantes de vacunación');
    dialog.choose('arrival');
    expect(dialog.draft()).toBe('Texto ajustado para el tutor');
  });

  it('does not offer to copy reminders for a canceled stay', () => {
    api.getStayById.mockReturnValue(of({ ...stay, cancelledAt: '2026-11-10T08:00:00' }));
    open();
    const screen = fixture.nativeElement as HTMLElement;
    expect(screen.textContent).toContain('Esta estadía está cancelada.');
    expect(screen.querySelector('textarea')).toBeNull();
    expect(screen.textContent).not.toContain('Copiar mensaje');
  });
});
