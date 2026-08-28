import { AppLanguage } from '../app-language';

export interface EntityLookupTranslations {
  clear: string;
  loading: string;
  noResults: string;
  loadFailed: string;
  retry: string;
  required: string;
  unresolved: string;
  progress: (loaded: number, total: number) => string;
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
    progress: (loaded, total) => `${loaded} de ${total} resultados cargados.`,
  },
  en: {
    clear: 'Clear selection',
    loading: 'Searching…',
    noResults: 'No results found.',
    loadFailed: 'Results could not be loaded.',
    retry: 'Retry',
    required: 'Select a result.',
    unresolved: 'Select a result or clear the text.',
    progress: (loaded, total) => `${loaded} of ${total} results loaded.`,
  },
} satisfies Record<AppLanguage, EntityLookupTranslations>;
