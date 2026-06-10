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
  displayOptions: {
    dailyLabels: string;
    compactMode: string;
  };
  loading: string;
  empty: string;
  emptyFiltered: string;
  help: string;
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
    displayOptions: {
      dailyLabels: 'Etiquetas diarias',
      compactMode: 'Modo compacto',
    },
    loading: 'Cargando calendario...',
    empty: 'No hay estancias registradas.',
    emptyFiltered: 'Ninguna entrada del calendario coincide con los filtros seleccionados.',
    help: 'Selecciona una entrada del calendario para abrirla en la lista de estancias.',
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
    displayOptions: {
      dailyLabels: 'Daily labels',
      compactMode: 'Compact mode',
    },
    loading: 'Loading calendar...',
    empty: 'No stays registered.',
    emptyFiltered: 'No calendar entries match the selected filters.',
    help: 'Select a calendar entry to open it in the stays list.',
    errorLoading: 'Error loading calendar',
    openStayInList: 'Open stay to see details',
    compactMarkerLabels: {
      start: 'Check-in',
      end: 'Check-out',
    },
  },
} satisfies Record<AppLanguage, CalendarTranslations>;
