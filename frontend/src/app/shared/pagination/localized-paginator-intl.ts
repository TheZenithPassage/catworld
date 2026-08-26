import { effect, inject } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';

import { I18nService } from '../../core/i18n/i18n.service';
import { AppTranslations } from '../../core/i18n/app-translations';

export interface PaginatorLabels {
  itemsPerPage: string;
  nextPage: string;
  previousPage: string;
  firstPage: string;
  lastPage: string;
  range: (page: number, pageSize: number, length: number) => string;
}

export function localizedPaginatorIntl(
  selectLabels: (translations: AppTranslations) => PaginatorLabels,
): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  const i18n = inject(I18nService);
  effect(() => {
    const labels = selectLabels(i18n.text());
    intl.itemsPerPageLabel = labels.itemsPerPage;
    intl.nextPageLabel = labels.nextPage;
    intl.previousPageLabel = labels.previousPage;
    intl.firstPageLabel = labels.firstPage;
    intl.lastPageLabel = labels.lastPage;
    intl.getRangeLabel = labels.range;
    intl.changes.next();
  });
  return intl;
}
