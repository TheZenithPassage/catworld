import { AppLanguage } from '../app-language';

interface ArrivalsTranslations {
  title: string;
  period: string;
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
    title: 'Preparar ingresos',
    period: 'Próximas reservas de hoy y de los siguientes siete días.',
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
    title: 'Prepare arrivals',
    period: 'Upcoming bookings for today and the next seven days.',
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
