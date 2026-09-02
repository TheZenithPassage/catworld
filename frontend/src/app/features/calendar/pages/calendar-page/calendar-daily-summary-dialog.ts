import { Component, computed, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle,
} from '@angular/material/dialog';

import { I18nService } from '../../../../core/i18n/i18n.service';
import { formatLocalDate } from '../../../../shared/date/local-date-format';
import { CalendarDailyAggregate } from './calendar-daily-aggregate';

@Component({
  selector: 'app-calendar-daily-summary-dialog',
  imports: [MatButton, MatDialogActions, MatDialogClose, MatDialogContent, MatDialogTitle],
  templateUrl: './calendar-daily-summary-dialog.html',
  styleUrl: './calendar-daily-summary-dialog.scss',
})
export class CalendarDailySummaryDialog {
  readonly data = inject<CalendarDailyAggregate>(MAT_DIALOG_DATA);

  private readonly i18nService = inject(I18nService);

  readonly text = this.i18nService.text;
  readonly formattedDate = computed(() =>
    formatLocalDate(this.data.date, this.i18nService.dateLocale()),
  );
  readonly totalLabel = computed(() => {
    const translations = this.text().calendar.dailySummary;
    const template = this.data.count === 1 ? translations.totalSingular : translations.totalPlural;

    return template.replace('{{count}}', String(this.data.count));
  });
}
