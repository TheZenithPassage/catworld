import { AppLanguage } from '../app-language';

export interface EntityDetailTranslations {
  back: string;
  cats: string;
  stays: string;
  loading: string;
  empty: string;
  loadFailed: string;
  retry: string;
  associatedRecords: (count: number) => string;
  paginator: {
    itemsPerPage: string;
    nextPage: string;
    previousPage: string;
    firstPage: string;
    lastPage: string;
    range: (page: number, pageSize: number, length: number) => string;
  };
}

export const ENTITY_DETAIL_TRANSLATIONS = {
  es: {
    back: 'Atrás',
    cats: 'Gatos',
    stays: 'Estancias',
    loading: 'Cargando registros relacionados…',
    empty: 'No hay registros relacionados.',
    loadFailed: 'No se pudieron cargar los registros relacionados.',
    retry: 'Reintentar',
    associatedRecords: (count) => `Ver ${count} registros relacionados`,
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
    back: 'Back',
    cats: 'Cats',
    stays: 'Stays',
    loading: 'Loading related records…',
    empty: 'There are no related records.',
    loadFailed: 'Related records could not be loaded.',
    retry: 'Retry',
    associatedRecords: (count) => `View ${count} associated records`,
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
} satisfies Record<AppLanguage, EntityDetailTranslations>;
