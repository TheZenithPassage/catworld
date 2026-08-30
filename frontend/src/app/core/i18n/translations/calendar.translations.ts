import { AppLanguage } from '../app-language';

export interface CalendarTranslations {
  title: string;
  description: string;
  actions: {
    viewStays: string;
    createStay: string;
    retry: string;
  };
  statusFiltersAriaLabel: string;
  displayModes: {
    title: string;
    description: string;
    options: {
      'daily-labels': {
        label: string;
        description: string;
      };
      'daily-counts': {
        label: string;
        description: string;
      };
      'entry-exit-markers': {
        label: string;
        description: string;
      };
    };
  };
  loading: string;
  empty: string;
  emptyFiltered: string;
  errorLoading: string;
  openStayInList: string;
  compactMarkerLabels: {
    start: string;
    end: string;
  };
}

export const CALENDAR_TRANSLATIONS = {
  es: {
    title: 'Calendario',
    description: 'Vista gráfica de las estancias registradas.',
    actions: {
      viewStays: 'Ver estancias',
      createStay: 'Crear estancia',
      retry: 'Reintentar',
    },
    statusFiltersAriaLabel: 'Filtros de estado del calendario',
    displayModes: {
      title: 'Vista del calendario',
      description: 'Elige cómo mostrar las estancias.',
      options: {
        'daily-labels': {
          label: 'Estándar',
          description: 'Diseño estándar.',
        },
        'daily-counts': {
          label: 'Totales diarios',
          description: 'Muestra un resumen compacto del total de estancias de cada día.',
        },
        'entry-exit-markers': {
          label: 'Entradas y salidas',
          description: 'Muestra solo el inicio y el final de cada estancia.',
        },
      },
    },
    loading: 'Cargando calendario...',
    empty: 'No hay estancias registradas.',
    emptyFiltered: 'Ninguna estancia coincide con los filtros seleccionados.',
    errorLoading: 'Error al cargar el calendario',
    openStayInList: 'Abrir los detalles de la estancia',
    compactMarkerLabels: {
      start: 'Entrada',
      end: 'Salida',
    },
  },
  en: {
    title: 'Calendar',
    description: 'Visual overview of registered stays.',
    actions: {
      viewStays: 'View stays',
      createStay: 'Create stay',
      retry: 'Retry',
    },
    statusFiltersAriaLabel: 'Calendar status filters',
    displayModes: {
      title: 'Calendar view',
      description: 'Choose how stays are displayed, with or without a cat or owner filter.',
      options: {
        'daily-labels': {
          label: 'Standard',
          description: 'Standard design.',
        },
        'daily-counts': {
          label: 'Daily counts',
          description: 'Shows a compact summary of the total stays for each day.',
        },
        'entry-exit-markers': {
          label: 'Entry and exit markers',
          description: 'Shows only the start and end of each stay.',
        },
      },
    },
    loading: 'Loading calendar...',
    empty: 'No stays registered.',
    emptyFiltered: 'No stays match the selected filters.',
    errorLoading: 'Error loading calendar',
    openStayInList: 'Open stay details',
    compactMarkerLabels: {
      start: 'Check-in',
      end: 'Check-out',
    },
  },
} satisfies Record<AppLanguage, CalendarTranslations>;
