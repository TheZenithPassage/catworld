import { MatPaginatorIntl } from '@angular/material/paginator';
import { localizedPaginatorIntl } from '../pagination/localized-paginator-intl';

export function lookupPaginatorIntl(): MatPaginatorIntl {
  return localizedPaginatorIntl((translations) => translations.entityLookup.paginator);
}
