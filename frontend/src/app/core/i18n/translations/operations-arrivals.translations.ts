import { AppLanguage } from '../app-language';

interface ArrivalsTranslations {
  title: string;
  subtitle: string;
  daysAhead: string;
  invalidDaysAhead: string;
  includeStartedToday: string;
  arrival: string;
  departure: string;
  openStay: string;
  familyLink: string;
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
    daysAhead: 'Días a partir de hoy',
    invalidDaysAhead: 'Ingresá un número entero de 0 o más.',
    includeStartedToday: 'Incluir los ingresos de hoy que ya empezaron',
    arrival: 'Ingreso',
    departure: 'Salida',
    openStay: 'Ver estadía',
    familyLink: 'Enlace familiar',
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
    daysAhead: 'Days from today',
    invalidDaysAhead: 'Enter a whole number of 0 or more.',
    includeStartedToday: 'Include today’s arrivals that have already started',
    arrival: 'Arrival',
    departure: 'Departure',
    openStay: 'View stay',
    familyLink: 'Household link',
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
