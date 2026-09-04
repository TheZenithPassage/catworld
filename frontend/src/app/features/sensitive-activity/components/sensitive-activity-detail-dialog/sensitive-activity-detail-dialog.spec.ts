import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { RuntimeConfigService } from '../../../../core/config/runtime-config.service';
import { SensitiveEconomicActivityEvent } from '../../models/sensitive-economic-activity';
import { SensitiveActivityDetailDialog } from './sensitive-activity-detail-dialog';

describe('SensitiveActivityDetailDialog', () => {
  const common = {
    occurredAt: '2026-08-01T12:00:00Z',
    actor: { id: 'actor-id', username: 'admin-user' },
    affectedContext: {
      stayId: 'stay-id',
      startAt: '2026-08-01T10:00:00',
      endAt: '2026-08-03T10:00:00',
      cancelledAt: null,
      owner: { id: 'owner-id', fullName: 'Ada Owner' },
      cats: [
        { id: 'cat-id-1', name: 'Miso' },
        { id: 'cat-id-2', name: 'Nori' },
      ],
    },
  };
  const payment = {
    paymentId: 'payment-id',
    paymentDate: '2026-08-01',
    note: null,
    registeredBy: { id: 'registrar-id', username: 'registrar-user' },
    registeredAt: '2026-08-02T12:00:00Z',
    reason: 'A deliberately long retained reason',
  };
  const events: SensitiveEconomicActivityEvent[] = [
    {
      eventId: 'rate-event-id',
      occurredAt: common.occurredAt,
      actor: common.actor,
      affectedContext: null,
      eventType: 'NIGHTLY_RATE_CHANGED',
      category: 'ONE_CAT',
      previousRate: null,
      newRate: '9999999999999999999.123456789',
    },
    {
      ...common,
      eventId: 'override-event-id',
      eventType: 'PRICING_OVERRIDE',
      retainedNightlyRate: '10.123456789',
      numberOfNights: 2,
      agreedAmount: '20.246913578',
      reason: 'Override reason',
    },
    {
      ...common,
      eventId: 'correction-event-id',
      eventType: 'AGREED_AMOUNT_CORRECTED',
      previousAgreedAmount: null,
      newAgreedAmount: '21.000000001',
      reason: 'Correction reason',
    },
    {
      ...common,
      ...payment,
      eventId: 'edited-event-id',
      eventType: 'PAYMENT_EDITED',
      previousAmount: '5.000000001',
      newAmount: '6.000000002',
    },
    {
      ...common,
      ...payment,
      eventId: 'annulled-event-id',
      eventType: 'PAYMENT_ANNULLED',
      amount: '6.000000003',
    },
    {
      ...common,
      ...payment,
      eventId: 'removed-event-id',
      eventType: 'PAYMENT_REMOVED',
      amount: '6.000000004',
      annulled: true,
    },
  ];
  let selectedEvent = events[0];
  let fixture: ComponentFixture<SensitiveActivityDetailDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SensitiveActivityDetailDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useFactory: () => selectedEvent },
      ],
    }).compileComponents();
    TestBed.inject(I18nService).language.set('en');
  });

  afterEach(() => fixture?.destroy());

  it.each([
    [
      0,
      [
        'Nightly rate changed',
        'rate-event-id',
        'actor-id',
        'Global · Nightly rate',
        'One cat',
        'Unavailable',
        '9999999999999999999.123456789',
      ],
    ],
    [
      1,
      [
        'Pricing override',
        'override-event-id',
        '10.123456789',
        '2',
        '20.246913578',
        'Override reason',
      ],
    ],
    [
      2,
      [
        'Agreed amount corrected',
        'correction-event-id',
        'Unavailable',
        '21.000000001',
        'Correction reason',
      ],
    ],
    [3, ['Payment edited', 'edited-event-id', '5.000000001', '6.000000002']],
    [4, ['Payment annulled', 'annulled-event-id', '6.000000003']],
    [5, ['Payment removed', 'removed-event-id', '6.000000004', 'Yes']],
  ])('renders every response value for variant %s', (index, expectedTokens) => {
    selectedEvent = events[index];
    fixture = TestBed.createComponent(SensitiveActivityDetailDialog);
    fixture.detectChanges();
    const root = fixture.nativeElement as HTMLElement;
    const text = root.textContent ?? '';

    for (const token of expectedTokens) expect(text).toContain(token);
    expect(text).toContain('admin-user');
    expect(text).toContain('1 Aug 2026, 09:00');
    expect(root.querySelector('h2[mat-dialog-title]')?.textContent).toContain(
      'Sensitive activity details',
    );
    expect(root.querySelector('button[mat-dialog-close]')?.textContent).toContain('Close');
    expect(root.querySelectorAll('a')).toHaveLength(0);

    if (selectedEvent.affectedContext) {
      for (const token of [
        'stay-id',
        'Ada Owner',
        'owner-id',
        'Miso',
        'cat-id-1',
        'Nori',
        'cat-id-2',
        '1 Aug 2026, 10:00',
        '3 Aug 2026, 10:00',
      ]) {
        expect(text).toContain(token);
      }
    }
    if (selectedEvent.eventType.startsWith('PAYMENT_')) {
      for (const token of [
        'payment-id',
        '01/08/2026',
        'Unavailable',
        'registrar-user',
        'registrar-id',
        '2 Aug 2026, 09:00',
        'A deliberately long retained reason',
      ]) {
        expect(text).toContain(token);
      }
    }
  });

  it('uses the distinct Instant, LocalDateTime, and LocalDate formatting paths', () => {
    selectedEvent = events[3];
    fixture = TestBed.createComponent(SensitiveActivityDetailDialog);
    const component = fixture.componentInstance;
    TestBed.inject(RuntimeConfigService).businessTimeZone.set('Europe/Madrid');
    TestBed.inject(I18nService).language.set('es');

    expect(component.formatInstant('2026-08-12T13:00:00Z')).toContain('15:00');
    expect(component.formatStayDateTime('2026-08-12T23:30:00')).toContain('23:30');
    expect(component.formatPaymentDate('2026-01-01')).toBe('01/01/2026');
  });
});
