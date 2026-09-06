import { OverlayContainer } from '@angular/cdk/overlay';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { SensitiveEconomicActivityEvent } from '../../models/sensitive-economic-activity';
import { SensitiveActivityDetailDialog } from './sensitive-activity-detail-dialog';

describe('SensitiveActivityDetailDialog', () => {
  let dialog: MatDialog;
  let overlay: HTMLElement;
  const common = {
    occurredAt: '2026-08-01T12:00:00Z',
    actor: { id: 'actor-secret', username: 'admin-user' },
    affectedContext: {
      stayId: 'stay-secret',
      startAt: '2026-08-01T10:00:00',
      endAt: '2026-08-03T10:00:00',
      cancelledAt: null,
      owner: { id: 'owner-secret', fullName: 'Ada Owner' },
      cats: [{ id: 'cat-secret', name: 'Miso' }],
    },
  };
  const payment = {
    paymentId: 'payment-secret',
    paymentDate: '2026-08-01',
    note: null,
    registeredBy: { id: 'registrant-secret', username: 'register-user' },
    registeredAt: '2026-08-01T11:00:00Z',
    reason: 'Operational reason',
  };
  const events: SensitiveEconomicActivityEvent[] = [
    {
      ...common,
      affectedContext: null,
      eventId: 'event-secret',
      eventType: 'NIGHTLY_RATE_CHANGED',
      category: 'ONE_CAT',
      previousRate: null,
      newRate: '9999999999999999999.123',
    },
    {
      ...common,
      eventId: 'event-secret',
      eventType: 'PRICING_OVERRIDE',
      retainedNightlyRate: '10.50',
      numberOfNights: 2,
      agreedAmount: '19.25',
      reason: 'Override reason',
    },
    {
      ...common,
      eventId: 'event-secret',
      eventType: 'AGREED_AMOUNT_CORRECTED',
      previousAgreedAmount: null,
      newAgreedAmount: '21.00',
      reason: 'Correction reason',
    },
    {
      ...common,
      ...payment,
      eventId: 'event-secret',
      eventType: 'PAYMENT_EDITED',
      previousAmount: '5.00',
      newAmount: '6.25',
    },
    {
      ...common,
      ...payment,
      eventId: 'event-secret',
      eventType: 'PAYMENT_ANNULLED',
      amount: '6.25',
    },
    {
      ...common,
      ...payment,
      eventId: 'event-secret',
      eventType: 'PAYMENT_REMOVED',
      amount: '6.25',
      annulled: true,
    },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [SensitiveActivityDetailDialog],
      providers: [provideNoopAnimations()],
    });
    TestBed.inject(I18nService).language.set('en');
    dialog = TestBed.inject(MatDialog);
    overlay = TestBed.inject(OverlayContainer).getContainerElement();
  });

  afterEach(() => dialog.closeAll());

  it('renders every semantic variant from the supplied complete event without technical IDs or links', () => {
    const expected = [
      ['Nightly rate changed', 'One cat', 'Unavailable', '9999999999999999999.123'],
      ['Pricing override', '10.50', '2', '21.00', '19.25', 'Override reason'],
      ['Agreed amount corrected', 'Unavailable', '21.00', 'Correction reason'],
      ['Payment edited', '5.00', '6.25', 'register-user', 'Operational reason'],
      ['Payment annulled', '6.25', 'register-user', 'Operational reason'],
      ['Payment removed', '6.25', 'Yes', 'register-user', 'Operational reason'],
    ];

    events.forEach((event, index) => {
      const ref = dialog.open(SensitiveActivityDetailDialog, { data: event });
      ref.componentRef?.changeDetectorRef.detectChanges();
      const text = overlay.textContent ?? '';
      expected[index].forEach((value) => expect(text).toContain(value));
      if (event.affectedContext) {
        expect(text).toContain('Ada Owner');
        expect(text).toContain('Miso');
        expect(text).toContain('Unavailable');
      }
      [
        'event-secret',
        'actor-secret',
        'stay-secret',
        'owner-secret',
        'cat-secret',
        'payment-secret',
        'registrant-secret',
      ].forEach((id) => expect(text).not.toContain(id));
      expect(overlay.querySelector('a')).toBeNull();
      expect(overlay.querySelector('button[mat-dialog-close]')?.textContent).toContain('Close');
      ref.close();
    });
  });
});
