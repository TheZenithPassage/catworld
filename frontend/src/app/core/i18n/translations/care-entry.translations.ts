import { AppLanguage } from '../app-language';

export interface CareEntryTranslations {
  title: string;
  dashboardDescription: string;
  history: string;
}

export const CARE_ENTRY_TRANSLATIONS = {
  es: {
    title: 'Cuidados',
    dashboardDescription: 'Registrá rutinas y notas de los gatos alojados.',
    history: 'Historial de cuidados',
  },
  en: {
    title: 'Care',
    dashboardDescription: 'Log routines and notes for cats staying with you.',
    history: 'Care history',
  },
} satisfies Record<AppLanguage, CareEntryTranslations>;
