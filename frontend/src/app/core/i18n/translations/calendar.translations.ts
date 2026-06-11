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
      'compact-daily-labels': {
        label: string;
        description: string;
      };
      'entry-exit-markers': {
        label: string;
        description: string;
      };
    };
  };
  filteredDisplayOptions: {
    title: string;
    dailyLabels: string;
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
        'compact-daily-labels': {
          label: 'Compacto',
          description: 'Reduce el tamaño de las etiquetas.',
        },
        'entry-exit-markers': {
          label: 'Entradas y salidas',
          description: 'Muestra solo el inicio y el final de cada estancia.',
        },
      },
    },
    filteredDisplayOptions: {
      title: 'Vista del calendario',
      dailyLabels: 'Mostrar etiqueta en cada día',
    },
    loading: 'Cargando calendario...',
    empty: 'No hay estancias registradas.',
    emptyFiltered: 'Ninguna estancia coincide con los filtros seleccionados.',
    errorLoading: 'Error al cargar el calendario',
    openStayInList: 'Abrir estancia para ver los detalles',
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
      description: 'Choose how stays are displayed when no cat or owner filter is active.',
      options: {
        'daily-labels': {
          label: 'Standard',
          description: 'Standard design.',
        },
        'compact-daily-labels': {
          label: 'Compact',
          description: 'Reduce the size of the labels.',
        },
        'entry-exit-markers': {
          label: 'Entry and exit markers',
          description: 'Shows only the start and end of each stay.',
        },
      },
    },
    filteredDisplayOptions: {
      title: 'Calendar view',
      dailyLabels: 'Show label on each day',
    },
    loading: 'Loading calendar...',
    empty: 'No stays registered.',
    emptyFiltered: 'No stays match the selected filters.',
    errorLoading: 'Error loading calendar',
    openStayInList: 'Open stay to see details',
    compactMarkerLabels: {
      start: 'Check-in',
      end: 'Check-out',
    },
  },
} satisfies Record<AppLanguage, CalendarTranslations>;
