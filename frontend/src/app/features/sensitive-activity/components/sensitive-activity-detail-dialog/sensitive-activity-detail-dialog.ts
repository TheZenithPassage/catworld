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
  readonly dateLocale = this.i18n.dateLocale;

  eventLabel(): string {
    return this.text().sensitiveActivity.events[this.event.eventType];
  }

  categoryLabel(category: NightlyRateCategory): string {
    return this.text().sensitiveActivity.categories[category];
  }

  display(value: string | null | undefined): string {
    return value ?? this.text().sensitiveActivity.unavailable;
  }

  suggestedAmount(event: { retainedNightlyRate: string; numberOfNights: number }): string {
    const negative = event.retainedNightlyRate.startsWith('-');
    const unsignedAmount = negative
      ? event.retainedNightlyRate.slice(1)
      : event.retainedNightlyRate;
    const [whole, fraction = ''] = unsignedAmount.split('.');
    const scaledProduct = BigInt(`${whole}${fraction}`) * BigInt(event.numberOfNights);
    const scaledText = scaledProduct.toString().padStart(fraction.length + 1, '0');
    const amount = fraction.length
      ? `${scaledText.slice(0, -fraction.length)}.${scaledText.slice(-fraction.length)}`
      : scaledText;
    return negative && scaledProduct !== 0n ? `-${amount}` : amount;
  }

  formatInstant(value: string): string {
    return this.businessTime.formatInstant(value, this.dateLocale());
  }

  formatPaymentDate(value: string): string {
    return formatLocalDate(value, this.dateLocale());
  }

  formatStayDateTime(value: string): string {
    return this.businessTime.formatLocalDateTime(value, this.dateLocale());
  }
}
