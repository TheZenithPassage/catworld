import { AppLanguage } from '../app-language';

export interface AppShellTranslations {
  brand: string;
  logoAlt: string;
  nav: {
    dashboard: string;
    stays: string;
    calendar: string;
    cats: string;
    owners: string;
    vets: string;
    accounts: string;
  };
  language: {
    toggleLabel: string;
    switchToEnglish: string;
    switchToSpanish: string;
  };
  logout: string;
}

export const APP_SHELL_TRANSLATIONS = {
  es: {
    brand: 'CatWorld',
    logoAlt: 'Logo de CatWorld',
    nav: {
      dashboard: 'Panel de administración',
      stays: 'Estancias',
      calendar: 'Calendario',
      cats: 'Gatos',
      owners: 'Dueños',
      vets: 'Veterinarios',
      accounts: 'Cuentas',
    },
    language: {
      toggleLabel: 'Cambiar idioma',
      switchToEnglish: 'Cambiar a inglés',
      switchToSpanish: 'Cambiar a español',
    },
    logout: 'Cerrar sesión',
  },
  en: {
    brand: 'CatWorld',
    logoAlt: 'CatWorld logo',
    nav: {
      dashboard: 'Dashboard',
      stays: 'Stays',
      calendar: 'Calendar',
      cats: 'Cats',
      owners: 'Owners',
      vets: 'Vets',
      accounts: 'Accounts',
    },
    language: {
      toggleLabel: 'Change language',
      switchToEnglish: 'Switch to English',
      switchToSpanish: 'Switch to Spanish',
    },
    logout: 'Log out',
  },
} satisfies Record<AppLanguage, AppShellTranslations>;
