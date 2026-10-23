import { AppLanguage } from '../app-language';

export interface AppShellTranslations {
  brand: string;
  navigationLabel: string;
  navigationMenuLabel: string;
  nav: {
    dashboard: string;
    stays: string;
    calendar: string;
    cats: string;
    owners: string;
    vets: string;
    accounts: string;
    nightlyRates: string;
    sensitiveActivity: string;
  };
  language: {
    toggleLabel: string;
    switchToEnglish: string;
    switchToSpanish: string;
  };
  logout: string;
  theme: {
    toggleLabel: string;
    switchToLight: string;
    switchToDark: string;
  };
}

export const APP_SHELL_TRANSLATIONS = {
  es: {
    brand: 'CatWorld',
    navigationLabel: 'Navegación principal',
    navigationMenuLabel: 'Abrir navegación',
    nav: {
      dashboard: 'Panel de administración',
      stays: 'Estadías',
      calendar: 'Calendario',
      cats: 'Gatos',
      owners: 'Dueños',
      vets: 'Veterinarios',
      accounts: 'Cuentas',
      nightlyRates: 'Tarifas por noche',
      sensitiveActivity: 'Actividad sensible',
    },
    language: {
      toggleLabel: 'Cambiar idioma',
      switchToEnglish: 'Cambiar a inglés',
      switchToSpanish: 'Cambiar a español',
    },
    logout: 'Cerrar sesión',
    theme: {
      toggleLabel: 'Modo oscuro',
      switchToLight: 'Cambiar a modo claro',
      switchToDark: 'Cambiar a modo oscuro',
    },
  },
  en: {
    brand: 'CatWorld',
    navigationLabel: 'Primary navigation',
    navigationMenuLabel: 'Open navigation',
    nav: {
      dashboard: 'Dashboard',
      stays: 'Stays',
      calendar: 'Calendar',
      cats: 'Cats',
      owners: 'Owners',
      vets: 'Vets',
      accounts: 'Accounts',
      nightlyRates: 'Nightly rates',
      sensitiveActivity: 'Sensitive activity',
    },
    language: {
      toggleLabel: 'Change language',
      switchToEnglish: 'Switch to English',
      switchToSpanish: 'Switch to Spanish',
    },
    logout: 'Log out',
    theme: {
      toggleLabel: 'Dark mode',
      switchToLight: 'Switch to light mode',
      switchToDark: 'Switch to dark mode',
    },
  },
} satisfies Record<AppLanguage, AppShellTranslations>;
