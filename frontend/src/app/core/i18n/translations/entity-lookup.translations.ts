import { AppLanguage } from '../app-language';

export interface EntityLookupTranslations {
  clear: string;
  loading: string;
  noResults: string;
  loadFailed: string;
  retry: string;
  required: string;
  unresolved: string;
  selected: (label: string) => string;
  paginator: {
    itemsPerPage: string;
    nextPage: string;
    previousPage: string;
    firstPage: string;
    lastPage: string;
    range: (page: number, pageSize: number, length: number) => string;
  };
}

export const ENTITY_LOOKUP_TRANSLATIONS = {
  es: {
    clear: 'Borrar selección',
    loading: 'Buscando…',
    noResults: 'No se encontraron resultados.',
    loadFailed: 'No se pudieron cargar los resultados.',
    retry: 'Reintentar',
    required: 'Selecciona un resultado.',
    unresolved: 'Selecciona un resultado o borra el texto.',
    selected: (label) => `Seleccionado: ${label}`,
    paginator: {
      itemsPerPage: 'Elementos por página',
      nextPage: 'Página siguiente',
      previousPage: 'Página anterior',
      firstPage: 'Primera página',
      lastPage: 'Última página',
      range: (page, pageSize, length) =>
        length === 0
          ? '0 de 0'
          : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, length)} de ${length}`,
    },
  },
  en: {
    clear: 'Clear selection',
    loading: 'Searching…',
    noResults: 'No results found.',
    loadFailed: 'Results could not be loaded.',
    retry: 'Retry',
    required: 'Select a result.',
    unresolved: 'Select a result or clear the text.',
    selected: (label) => `Selected: ${label}`,
    paginator: {
      itemsPerPage: 'Items per page',
      nextPage: 'Next page',
      previousPage: 'Previous page',
      firstPage: 'First page',
      lastPage: 'Last page',
      range: (page, pageSize, length) =>
        length === 0
          ? '0 of 0'
          : `${page * pageSize + 1}–${Math.min((page + 1) * pageSize, length)} of ${length}`,
    },
  },
} satisfies Record<AppLanguage, EntityLookupTranslations>;
