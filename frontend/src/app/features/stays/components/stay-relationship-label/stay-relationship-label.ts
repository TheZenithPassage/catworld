import { Component, inject, input } from '@angular/core';
import { I18nService } from '../../../../core/i18n/i18n.service';
import { BusinessTimeService } from '../../../../core/time/business-time.service';
import { StayRelationshipItem } from '../../../../shared/entity-detail/relationship.models';

@Component({
  selector: 'app-stay-relationship-label',
  template: `{{ date(item().startAt) }} — {{ date(item().endAt) }} · {{ status(item().status) }}`,
})
export class StayRelationshipLabel {
  private readonly businessTime = inject(BusinessTimeService);
  private readonly i18n = inject(I18nService);
  readonly item = input.required<StayRelationshipItem>();
  date(value: string): string {
    return this.businessTime.formatLocalDateTime(value, this.i18n.dateLocale());
  }
  status(value: StayRelationshipItem['status']): string {
    const key =
      value === 'RESERVED'
        ? 'reserved'
        : value === 'CHECKED_IN'
          ? 'checked-in'
          : value === 'CHECKED_OUT'
            ? 'checked-out'
            : 'cancelled';
    return this.i18n.text().stays.status[key];
  }
}
