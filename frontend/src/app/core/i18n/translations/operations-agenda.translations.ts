import { AppLanguage } from '../app-language';

export interface OperationsAgendaTranslations {
  title: string;
  date: string;
  today: string;
  movements: string;
  boardingNow: string;
  boardingOnDate: string;
  scheduledDeparture: string;
  upcoming: string;
  noMovements: string;
  noBoarding: string;
  loading: string;
  error: string;
  retry: string;
  movement: { ARRIVAL: string; DEPARTURE: string };
  transfer: string;
}

export const OPERATIONS_AGENDA_TRANSLATIONS = {
  es: {
    title: 'Agenda operativa',
    date: 'Fecha',
    today: 'Hoy',
    movements: 'Entradas y salidas',
    boardingNow: 'Gatos alojados ahora',
    boardingOnDate: 'Gatos alojados ese día',
    scheduledDeparture: 'Salida prevista',
    upcoming: 'Próximos 7 días',
    noMovements: 'Sin entradas ni salidas.',
    noBoarding: 'No hay gatos alojados.',
    loading: 'Cargando la agenda…',
    error: 'No se pudo cargar la agenda.',
    retry: 'Reintentar',
    movement: { ARRIVAL: 'Entrada', DEPARTURE: 'Salida' },
    transfer: 'Traslado',
  },
  en: {
    title: 'Operations agenda',
    date: 'Date',
    today: 'Today',
    movements: 'Arrivals and departures',
    boardingNow: 'Cats boarding now',
    boardingOnDate: 'Cats boarding that day',
    scheduledDeparture: 'Scheduled departure',
    upcoming: 'Next 7 days',
    noMovements: 'No arrivals or departures.',
    noBoarding: 'No cats boarding.',
    loading: 'Loading the agenda…',
    error: 'The agenda could not be loaded.',
    retry: 'Retry',
    movement: { ARRIVAL: 'Arrival', DEPARTURE: 'Departure' },
    transfer: 'Transfer',
  },
} satisfies Record<AppLanguage, OperationsAgendaTranslations>;
