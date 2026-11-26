import { AppLanguage } from '../app-language';

interface ArrivalsTranslations {
  title: string;
  subtitle: string;
  settings: string;
  daysAhead: { arrivals: string; departures: string; suffix: string };
  invalidDaysAhead: string;
  tabs: { label: string; arrivals: string; departures: string };
  arrival: string;
  departure: string;
  openStay: string;
  shareProfile: string;
  reviewProposal: string;
  toConfirm: string;
  complete: string;
  loading: { arrivals: string; departures: string };
  empty: { arrivals: string; departures: string };
  error: { arrivals: string; departures: string };
  overdue: string;
  unrecordedArrival: string;
  plannedArrivalPassed: string;
  transfer: { arrivals: string; departures: string };
  retry: string;
  refresh: string;
}

export const OPERATIONS_ARRIVALS_TRANSLATIONS = {
  es: {
    title: 'Próximas estadías',
    subtitle: 'Revisá qué datos faltan para las próximas estadías.',
    settings: 'Configuración',
    daysAhead: {
      arrivals: 'Mostrar los ingresos de los próximos',
      departures: 'Mostrar las salidas de los próximos',
      suffix: 'días',
    },
    invalidDaysAhead: 'Ingresá un número entero de 0 o más.',
    tabs: { label: 'Movimientos de estadías', arrivals: 'Ingresos', departures: 'Salidas' },
    arrival: 'Ingreso',
    departure: 'Salida',
    openStay: 'Ver estadía',
    shareProfile: 'Compartir ficha',
    reviewProposal: 'Revisar propuesta de ficha',
    toConfirm: 'Por confirmar',
    complete: 'Sin pendientes de preparación',
    loading: { arrivals: 'Cargando próximos ingresos…', departures: 'Cargando próximas salidas…' },
    empty: {
      arrivals: 'No hay ingresos previstos para este período.',
      departures: 'No hay salidas previstas para este período.',
    },
    error: {
      arrivals: 'No se pudieron cargar los próximos ingresos.',
      departures: 'No se pudieron cargar las próximas salidas.',
    },
    overdue: 'Pendiente de un día anterior',
    unrecordedArrival: 'Ingreso sin registrar',
    plannedArrivalPassed: 'Ya pasó la fecha prevista de ingreso.',
    transfer: { arrivals: 'Traslado de ingreso', departures: 'Traslado de salida' },
    retry: 'Reintentar',
    refresh: 'Actualizar',
  },
  en: {
    title: 'Upcoming stays',
    subtitle: 'Check which information is missing for upcoming stays.',
    settings: 'Settings',
    daysAhead: {
      arrivals: 'Show arrivals for the next',
      departures: 'Show departures for the next',
      suffix: 'days',
    },
    invalidDaysAhead: 'Enter a whole number of 0 or more.',
    tabs: { label: 'Stay movements', arrivals: 'Arrivals', departures: 'Departures' },
    arrival: 'Arrival',
    departure: 'Departure',
    openStay: 'View stay',
    shareProfile: 'Share profile',
    reviewProposal: 'Review profile proposal',
    toConfirm: 'To confirm',
    complete: 'No preparation items pending',
    loading: { arrivals: 'Loading upcoming arrivals…', departures: 'Loading upcoming departures…' },
    empty: {
      arrivals: 'There are no arrivals scheduled for this period.',
      departures: 'There are no departures scheduled for this period.',
    },
    error: {
      arrivals: 'Upcoming arrivals could not be loaded.',
      departures: 'Upcoming departures could not be loaded.',
    },
    overdue: 'Pending from an earlier day',
    unrecordedArrival: 'Arrival not recorded',
    plannedArrivalPassed: 'The scheduled arrival date has passed.',
    transfer: { arrivals: 'Arrival transport', departures: 'Departure transport' },
    retry: 'Try again',
    refresh: 'Refresh',
  },
} satisfies Record<AppLanguage, ArrivalsTranslations>;
