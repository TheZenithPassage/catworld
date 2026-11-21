import { AppLanguage } from '../app-language';

interface ArrivalsTranslations {
  title: string;
  subtitle: string;
  settings: string;
  daysAhead: string;
  invalidDaysAhead: string;
  includeStartedToday: string;
  arrival: string;
  departure: string;
  openStay: string;
  shareProfile: string;
  reviewProposal: string;
  toConfirm: string;
  complete: string;
  loading: string;
  empty: string;
  error: string;
  retry: string;
  refresh: string;
}

export const OPERATIONS_ARRIVALS_TRANSLATIONS = {
  es: {
    title: 'Próximas estadías',
    subtitle: 'Revisá qué datos faltan para las próximas estadías.',
    settings: 'Configuración',
    daysAhead: 'Días a mostrar después de hoy',
    invalidDaysAhead: 'Ingresá un número entero de 0 o más.',
    includeStartedToday: 'Mostrar todos los ingresos de hoy',
    arrival: 'Ingreso',
    departure: 'Salida',
    openStay: 'Ver estadía',
    shareProfile: 'Compartir ficha',
    reviewProposal: 'Revisar propuesta de ficha',
    toConfirm: 'Por confirmar',
    complete: 'Sin pendientes de preparación',
    loading: 'Cargando próximos ingresos…',
    empty: 'No hay ingresos previstos para este período.',
    error: 'No se pudieron cargar los próximos ingresos.',
    retry: 'Reintentar',
    refresh: 'Actualizar',
  },
  en: {
    title: 'Upcoming stays',
    subtitle: 'Check which information is missing for upcoming stays.',
    settings: 'Settings',
    daysAhead: 'Days to show after today',
    invalidDaysAhead: 'Enter a whole number of 0 or more.',
    includeStartedToday: 'Show all of today’s arrivals',
    arrival: 'Arrival',
    departure: 'Departure',
    openStay: 'View stay',
    shareProfile: 'Share profile',
    reviewProposal: 'Review profile proposal',
    toConfirm: 'To confirm',
    complete: 'No preparation items pending',
    loading: 'Loading upcoming arrivals…',
    empty: 'There are no arrivals scheduled for this period.',
    error: 'Upcoming arrivals could not be loaded.',
    retry: 'Try again',
    refresh: 'Refresh',
  },
} satisfies Record<AppLanguage, ArrivalsTranslations>;
