import { Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { BusinessTimeService } from '../../../../core/time/business-time.service';
import { formatLocalDate } from '../../../../shared/date/local-date-format';
import {
  NightlyRateCategory,
  SensitiveEconomicActivityEvent,
  SensitiveStayContext,
} from '../../models/sensitive-economic-activity';

@Component({
  selector: 'app-sensitive-activity-detail-dialog',
  imports: [MatButton, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle],
  templateUrl: './sensitive-activity-detail-dialog.html',
  styleUrl: './sensitive-activity-detail-dialog.scss',
})
export class SensitiveActivityDetailDialog {
  readonly event = inject<SensitiveEconomicActivityEvent>(MAT_DIALOG_DATA);
  private readonly i18n = inject(I18nService);
  private readonly businessTime = inject(BusinessTimeService);
  readonly text = this.i18n.text;

  eventLabel(): string {
    return this.text().sensitiveActivity.events[this.event.eventType];
  }

  categoryLabel(category: NightlyRateCategory): string {
    return this.text().sensitiveActivity.categories[category];
  }

  display(value: string | null): string {
    return value ?? this.text().sensitiveActivity.unavailable;
  }

  yesNo(value: boolean): string {
    return value ? this.text().sensitiveActivity.yes : this.text().sensitiveActivity.no;
  }

  formatInstant(value: string): string {
    return this.businessTime.formatInstant(value, this.i18n.dateLocale());
  }

  formatPaymentDate(value: string): string {
    return formatLocalDate(value, this.i18n.dateLocale());
  }

  formatStayDateTime(value: string): string {
    return this.businessTime.formatLocalDateTime(value, this.i18n.dateLocale());
  }

  catsLabel(cats: SensitiveStayContext['cats']): string {
    return cats.map((cat) => cat.name).join(', ');
  }

  suggestedAmount(event: { retainedNightlyRate: string; numberOfNights: number }): string {
    const negative = event.retainedNightlyRate.startsWith('-');
    const unsigned = negative ? event.retainedNightlyRate.slice(1) : event.retainedNightlyRate;
    const [whole, fraction = ''] = unsigned.split('.');
    const product = BigInt(`${whole}${fraction}`) * BigInt(event.numberOfNights);
    const scaled = product.toString().padStart(fraction.length + 1, '0');
    const amount = fraction.length
      ? `${scaled.slice(0, -fraction.length)}.${scaled.slice(-fraction.length)}`
      : scaled;
    return negative && product !== 0n ? `-${amount}` : amount;
  }
}
