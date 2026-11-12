import { AppLanguage } from '../app-language';

interface ArrivalsTranslations {
  title: string;
  period: string;
  arrival: string;
  departure: string;
  openStay: string;
  reviewProposal: string;
  toConfirm: string;
  loading: string;
  empty: string;
  error: string;
  retry: string;
  refresh: string;
}

export const OPERATIONS_ARRIVALS_TRANSLATIONS = {
  es: {
    title: 'Preparar ingresos',
    period: 'Próximas reservas de hoy y de los siguientes siete días.',
    arrival: 'Ingreso',
    departure: 'Salida',
    openStay: 'Ver estadía',
    reviewProposal: 'Revisar propuesta de ficha',
    toConfirm: 'Por confirmar',
    loading: 'Cargando próximos ingresos…',
    empty: 'No hay ingresos previstos para este período.',
    error: 'No se pudieron cargar los próximos ingresos.',
    retry: 'Reintentar',
    refresh: 'Actualizar',
  },
  en: {
    title: 'Prepare arrivals',
    period: 'Upcoming bookings for today and the next seven days.',
    arrival: 'Arrival',
    departure: 'Departure',
    openStay: 'View stay',
    reviewProposal: 'Review profile proposal',
    toConfirm: 'To confirm',
    loading: 'Loading upcoming arrivals…',
    empty: 'There are no arrivals scheduled for this period.',
    error: 'Upcoming arrivals could not be loaded.',
    retry: 'Try again',
    refresh: 'Refresh',
  },
} satisfies Record<AppLanguage, ArrivalsTranslations>;
