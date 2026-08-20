import { AppLanguage } from '../app-language';

export interface LookupTranslations {
  loading: string;
  empty: string;
  error: string;
  clear: string;
  navigation: {
    label: string;
    previous: string;
    next: string;
  };
  errors: {
    required: string;
    unresolved: string;
  };
}

export const LOOKUP_TRANSLATIONS = {
  es: {
    loading: 'Buscando opciones...',
    empty: 'No se han encontrado opciones.',
    error: 'No se han podido cargar las opciones. Inténtalo de nuevo.',
    clear: 'Limpiar selección',
    navigation: {
      label: 'Páginas de resultados',
      previous: 'Anterior',
      next: 'Siguiente',
    },
    errors: {
      required: 'Selecciona una opción.',
      unresolved: 'Elige una opción de la lista de resultados.',
    },
  },
  en: {
    loading: 'Searching for options...',
    empty: 'No options found.',
    error: 'The options could not be loaded. Try again.',
    clear: 'Clear selection',
    navigation: {
      label: 'Result pages',
      previous: 'Previous',
      next: 'Next',
    },
    errors: {
      required: 'Select an option.',
      unresolved: 'Choose an option from the result list.',
    },
  },
} satisfies Record<AppLanguage, LookupTranslations>;
