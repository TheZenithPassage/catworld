import { AppLanguage } from '../../../../core/i18n/app-language';
import { AgendaMovementType } from '../../models/operations-agenda.model';

interface OperationsTransfersTranslations {
  loading: string;
  error: string;
  empty: string;
  leg: Record<AgendaMovementType, string>;
  scheduledMovement: Record<AgendaMovementType, string>;
  contact: string;
  contactFor: (owner: string) => string;
}

export const OPERATIONS_TRANSFERS_TRANSLATIONS = {
  es: {
    loading: 'Cargando los traslados…',
    error: 'No se pudieron cargar los traslados.',
    empty: 'No hay traslados programados para este día.',
    leg: { ARRIVAL: 'Retiro antes del ingreso', DEPARTURE: 'Entrega al salir' },
    scheduledMovement: { ARRIVAL: 'Ingreso previsto', DEPARTURE: 'Salida prevista' },
    contact: 'Ver contacto',
    contactFor: (owner) => `Ver contacto de ${owner}`,
  },
  en: {
    loading: 'Loading transfers…',
    error: 'Transfers could not be loaded.',
    empty: 'No transfers scheduled for this day.',
    leg: { ARRIVAL: 'Pickup before check-in', DEPARTURE: 'Drop-off at checkout' },
    scheduledMovement: { ARRIVAL: 'Scheduled check-in', DEPARTURE: 'Scheduled checkout' },
    contact: 'View contact',
    contactFor: (owner) => `View contact for ${owner}`,
  },
} satisfies Record<AppLanguage, OperationsTransfersTranslations>;
