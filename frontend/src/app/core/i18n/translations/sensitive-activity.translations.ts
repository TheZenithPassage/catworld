import { AppLanguage } from '../app-language';
import {
  NightlyRateCategory,
  SensitiveEconomicEventType,
} from '../../../features/sensitive-activity/models/sensitive-economic-activity';

export interface SensitiveActivityTranslations {
  title: string;
  description: string;
  loading: string;
  empty: string;
  forbidden: string;
  malformed: string;
  failure: string;
  retry: string;
  openDetail: string;
  detailTitle: string;
  close: string;
  unavailable: string;
  filters: {
    label: string;
    actorId: string;
    occurredFrom: string;
    occurredTo: string;
    eventType: string;
    allTypes: string;
    ownerId: string;
    catId: string;
    stayId: string;
    apply: string;
    refresh: string;
    clear: string;
    invalidPeriod: string;
    invalidBusinessDateTime: string;
    invalidDateTime: string;
    invalidId: string;
  };
  events: Record<SensitiveEconomicEventType, string>;
  categories: Record<NightlyRateCategory, string>;
  fields: Record<
    | 'actor'
    | 'occurredAt'
    | 'category'
    | 'previousRate'
    | 'newRate'
    | 'retainedRate'
    | 'nights'
    | 'suggestedAmount'
    | 'agreement'
    | 'previousAgreement'
    | 'newAgreement'
    | 'amount'
    | 'previousAmount'
    | 'newAmount'
    | 'paymentDate'
    | 'note'
    | 'registeredBy'
    | 'registeredAt'
    | 'annulled'
    | 'reason'
    | 'stay'
    | 'owner'
    | 'cats'
    | 'stayDates'
    | 'cancelledAt',
    string
  >;
  yes: string;
  no: string;
}

const sharedEvents = {
  NIGHTLY_RATE_CHANGED: 'Nightly rate changed',
  PRICING_OVERRIDE: 'Pricing override',
  AGREED_AMOUNT_CORRECTED: 'Agreed amount corrected',
  PAYMENT_EDITED: 'Payment edited',
  PAYMENT_ANNULLED: 'Payment annulled',
  PAYMENT_REMOVED: 'Payment removed',
} satisfies Record<SensitiveEconomicEventType, string>;

export const SENSITIVE_ACTIVITY_TRANSLATIONS = {
  es: {
    title: 'Actividad económica sensible',
    description: 'Revisa cambios económicos sensibles y su contexto histórico conservado.',
    loading: 'Cargando actividad económica sensible…',
    empty: 'No hay actividad sensible que coincida con estos filtros.',
    forbidden: 'Ya no tienes permiso para consultar esta actividad.',
    malformed: 'El servidor devolvió actividad con un formato no reconocido.',
    failure: 'No se pudo cargar la actividad económica sensible.',
    retry: 'Reintentar',
    openDetail: 'Abrir detalle',
    detailTitle: 'Detalle de actividad',
    close: 'Cerrar',
    unavailable: 'No disponible',
    filters: {
      label: 'Filtros de actividad sensible',
      actorId: 'ID de cuenta del actor',
      occurredFrom: 'Desde',
      occurredTo: 'Hasta',
      eventType: 'Tipo de evento',
      allTypes: 'Todos los tipos',
      ownerId: 'ID del dueño',
      catId: 'ID del gato',
      stayId: 'ID de la estancia',
      apply: 'Aplicar filtros',
      refresh: 'Actualizar',
      clear: 'Limpiar filtros',
      invalidPeriod: 'La fecha inicial debe ser anterior a la final.',
      invalidBusinessDateTime: 'La fecha y hora no existe en la zona horaria del negocio.',
      invalidDateTime: 'Introduce una fecha y hora válidas.',
      invalidId: 'El ID debe tener un formato válido.',
    },
    events: {
      NIGHTLY_RATE_CHANGED: 'Tarifa nocturna cambiada',
      PRICING_OVERRIDE: 'Excepción de precio',
      AGREED_AMOUNT_CORRECTED: 'Importe acordado corregido',
      PAYMENT_EDITED: 'Pago editado',
      PAYMENT_ANNULLED: 'Pago anulado',
      PAYMENT_REMOVED: 'Pago eliminado',
    },
    categories: {
      ONE_CAT: 'Un gato',
      TWO_CATS: 'Dos gatos',
      THREE_PLUS_CATS: 'Tres o más gatos',
    },
    fields: {
      actor: 'Actor',
      occurredAt: 'Fecha y hora',
      category: 'Categoría',
      previousRate: 'Tarifa anterior',
      newRate: 'Tarifa nueva',
      retainedRate: 'Tarifa conservada',
      nights: 'Noches',
      suggestedAmount: 'Importe sugerido',
      agreement: 'Importe acordado',
      previousAgreement: 'Acuerdo anterior',
      newAgreement: 'Acuerdo nuevo',
      amount: 'Importe',
      previousAmount: 'Importe anterior',
      newAmount: 'Importe nuevo',
      paymentDate: 'Fecha del pago',
      note: 'Nota',
      registeredBy: 'Registrado por',
      registeredAt: 'Registrado el',
      annulled: 'Anulado',
      reason: 'Motivo',
      stay: 'Estancia',
      owner: 'Dueño',
      cats: 'Gatos',
      stayDates: 'Fechas de estancia',
      cancelledAt: 'Cancelada el',
    },
    yes: 'Sí',
    no: 'No',
  },
  en: {
    title: 'Sensitive economic activity',
    description: 'Review sensitive economic changes and their retained historical context.',
    loading: 'Loading sensitive economic activity…',
    empty: 'No sensitive activity matches these filters.',
    forbidden: 'You no longer have permission to view this activity.',
    malformed: 'The server returned activity in an unrecognized format.',
    failure: 'Sensitive economic activity could not be loaded.',
    retry: 'Retry',
    openDetail: 'Open detail',
    detailTitle: 'Activity detail',
    close: 'Close',
    unavailable: 'Unavailable',
    filters: {
      label: 'Sensitive activity filters',
      actorId: 'Actor account ID',
      occurredFrom: 'From',
      occurredTo: 'To',
      eventType: 'Event type',
      allTypes: 'All event types',
      ownerId: 'Owner ID',
      catId: 'Cat ID',
      stayId: 'Stay ID',
      apply: 'Apply filters',
      refresh: 'Refresh',
      clear: 'Clear filters',
      invalidPeriod: 'The start date must be earlier than the end date.',
      invalidBusinessDateTime: 'The date and time does not exist in the business timezone.',
      invalidDateTime: 'Enter a valid date and time.',
      invalidId: 'The ID must have a valid format.',
    },
    events: sharedEvents,
    categories: {
      ONE_CAT: 'One cat',
      TWO_CATS: 'Two cats',
      THREE_PLUS_CATS: 'Three or more cats',
    },
    fields: {
      actor: 'Actor',
      occurredAt: 'Date and time',
      category: 'Category',
      previousRate: 'Previous rate',
      newRate: 'New rate',
      retainedRate: 'Retained rate',
      nights: 'Nights',
      suggestedAmount: 'Suggested amount',
      agreement: 'Agreed amount',
      previousAgreement: 'Previous agreement',
      newAgreement: 'New agreement',
      amount: 'Amount',
      previousAmount: 'Previous amount',
      newAmount: 'New amount',
      paymentDate: 'Payment date',
      note: 'Note',
      registeredBy: 'Registered by',
      registeredAt: 'Registered at',
      annulled: 'Annulled',
      reason: 'Reason',
      stay: 'Stay',
      owner: 'Owner',
      cats: 'Cats',
      stayDates: 'Stay dates',
      cancelledAt: 'Cancelled at',
    },
    yes: 'Yes',
    no: 'No',
  },
} satisfies Record<AppLanguage, SensitiveActivityTranslations>;
