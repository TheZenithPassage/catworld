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
  dailyCounts: {
    singular: string;
    plural: string;
    accessibleSingular: string;
    accessiblePlural: string;
  };
  dailySummary: {
    title: string;
    dateLabel: string;
    totalSingular: string;
    totalPlural: string;
    entry: string;
    exit: string;
    close: string;
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
          description: 'Muestra un resumen compacto del total de gatos de cada día.',
        },
        'entry-exit-markers': {
          label: 'Entradas y salidas',
          description: 'Muestra solo el inicio y el final de cada estancia.',
        },
      },
    },
    loading: 'Cargando calendario...',
    empty: 'No hay estancias en el período mostrado.',
    emptyFiltered: 'Ninguna estancia coincide con los filtros seleccionados.',
    errorLoading: 'Error al cargar el calendario',
    openStayInList: 'Abrir los detalles de la estancia',
    compactMarkerLabels: {
      start: 'Entrada',
      end: 'Salida',
    },
    dailyCounts: {
      singular: '{{count}} gato',
      plural: '{{count}} gatos',
      accessibleSingular: 'Abrir el resumen diario de {{count}} gato',
      accessiblePlural: 'Abrir el resumen diario de {{count}} gatos',
    },
    dailySummary: {
      title: 'Resumen diario',
      dateLabel: 'Fecha',
      totalSingular: 'Total: {{count}} gato',
      totalPlural: 'Total: {{count}} gatos',
      entry: 'Entrada',
      exit: 'Salida',
      close: 'Cerrar',
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
          description: 'Shows a compact summary of the total cats for each day.',
        },
        'entry-exit-markers': {
          label: 'Entry and exit markers',
          description: 'Shows only the start and end of each stay.',
        },
      },
    },
    loading: 'Loading calendar...',
    empty: 'No stays in the displayed period.',
    emptyFiltered: 'No stays match the selected filters.',
    errorLoading: 'Error loading calendar',
    openStayInList: 'Open stay details',
    compactMarkerLabels: {
      start: 'Check-in',
      end: 'Check-out',
    },
    dailyCounts: {
      singular: '{{count}} cat',
      plural: '{{count}} cats',
      accessibleSingular: 'Open daily summary for {{count}} cat',
      accessiblePlural: 'Open daily summary for {{count}} cats',
    },
    dailySummary: {
      title: 'Daily summary',
      dateLabel: 'Date',
      totalSingular: 'Total: {{count}} cat',
      totalPlural: 'Total: {{count}} cats',
      entry: 'Entry',
      exit: 'Exit',
      close: 'Close',
    },
  },
} satisfies Record<AppLanguage, CalendarTranslations>;
