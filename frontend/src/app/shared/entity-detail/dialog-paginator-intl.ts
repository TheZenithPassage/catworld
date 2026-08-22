import { effect, inject } from '@angular/core';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { I18nService } from '../../core/i18n/i18n.service';

export function dialogPaginatorIntl(): MatPaginatorIntl {
  const intl = new MatPaginatorIntl();
  const i18n = inject(I18nService);
  effect(() => {
    const labels = i18n.text().entityDetail.paginator;
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
