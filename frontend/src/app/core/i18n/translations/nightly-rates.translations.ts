import { AppLanguage } from '../app-language';

export interface NightlyRatesTranslations {
  title: string;
  description: string;
  totalPriceExplanation: string;
  loading: string;
  loadError: string;
  retry: string;
  unavailable: string;
  categories: Record<'one' | 'two' | 'threePlus', string>;
  form: {
    rateLabel: string;
    configure: string;
    change: string;
    clear: string;
    saving: string;
    clearing: string;
    errors: { required: string; positiveWhole: string; tooLong: string };
  };
  errors: {
    validation: string;
    forbidden: string;
    conflict: string;
    mutation: string;
    refresh: string;
  };
}

export const NIGHTLY_RATES_TRANSLATIONS = {
  es: {
    title: 'Tarifas nocturnas de referencia',
    description: 'Consulta y gestiona la orientación de precios según el número de gatos.',
    totalPriceExplanation:
      'Cada valor es el precio total de toda la estancia por noche para esa categoría, no un importe por gato.',
    loading: 'Cargando las tarifas nocturnas…',
    loadError: 'No se pudieron cargar las tarifas nocturnas actuales.',
    retry: 'Reintentar',
    unavailable: 'No disponible temporalmente',
    categories: { one: 'Un gato', two: 'Dos gatos', threePlus: 'Tres o más gatos' },
    form: {
      rateLabel: 'Precio total por noche',
      configure: 'Configurar',
      change: 'Cambiar',
      clear: 'Quitar tarifa',
      saving: 'Guardando…',
      clearing: 'Quitando…',
      errors: {
        required: 'Introduce un importe entero positivo.',
        positiveWhole: 'El importe debe ser un número entero positivo sin decimales.',
        tooLong: 'El importe puede tener como máximo 19 dígitos.',
      },
    },
    errors: {
      validation: 'El servidor rechazó el importe. Revísalo e inténtalo de nuevo.',
      forbidden: 'Ya no tienes permiso para cambiar esta tarifa.',
      conflict: 'La tarifa cambió al mismo tiempo. Vuelve a intentarlo con los valores actuales.',
      mutation: 'No se pudo guardar el cambio. Inténtalo de nuevo.',
      refresh: 'El cambio se guardó, pero no se pudieron actualizar las tarifas actuales.',
    },
  },
  en: {
    title: 'Nightly reference rates',
    description: 'View and manage pricing guidance for each cat-count category.',
    totalPriceExplanation:
      'Each value is the total whole-stay price per night for that category, not a per-cat amount.',
    loading: 'Loading nightly rates…',
    loadError: 'The current nightly rates could not be loaded.',
    retry: 'Retry',
    unavailable: 'Temporarily unavailable',
    categories: { one: 'One cat', two: 'Two cats', threePlus: 'Three or more cats' },
    form: {
      rateLabel: 'Total price per night',
      configure: 'Configure',
      change: 'Change',
      clear: 'Clear rate',
      saving: 'Saving…',
      clearing: 'Clearing…',
      errors: {
        required: 'Enter a positive whole-unit amount.',
        positiveWhole: 'The amount must be a positive whole number without decimals.',
        tooLong: 'The amount can contain at most 19 digits.',
      },
    },
    errors: {
      validation: 'The server rejected this amount. Review it and try again.',
      forbidden: 'You no longer have permission to change this rate.',
      conflict: 'The rate changed at the same time. Try again with the current values.',
      mutation: 'The change could not be saved. Try again.',
      refresh: 'The change was saved, but the current rates could not be refreshed.',
    },
  },
} satisfies Record<AppLanguage, NightlyRatesTranslations>;
