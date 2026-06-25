import { AppLanguage } from './app-language';
import {
  APP_SHELL_TRANSLATIONS,
  AppShellTranslations,
} from './translations/app-shell.translations';
import { AUTH_TRANSLATIONS, AuthTranslations } from './translations/auth.translations';
import { CALENDAR_TRANSLATIONS, CalendarTranslations } from './translations/calendar.translations';
import { CATS_TRANSLATIONS, CatsTranslations } from './translations/cats.translations';
import {
  DASHBOARD_TRANSLATIONS,
  DashboardTranslations,
} from './translations/dashboard.translations';
import { OWNERS_TRANSLATIONS, OwnersTranslations } from './translations/owners.translations';
import { STAYS_TRANSLATIONS, StaysTranslations } from './translations/stays.translations';
import { VETS_TRANSLATIONS, VetsTranslations } from './translations/vets.translations';
import { ACCOUNTS_TRANSLATIONS, AccountsTranslations } from './translations/accounts.translations';

export interface AppTranslations {
  app: AppShellTranslations;
  auth: AuthTranslations;
  dashboard: DashboardTranslations;
  calendar: CalendarTranslations;
  cats: CatsTranslations;
  owners: OwnersTranslations;
  stays: StaysTranslations;
  vets: VetsTranslations;
  accounts: AccountsTranslations;
}

export const APP_TRANSLATIONS = {
  es: {
    app: APP_SHELL_TRANSLATIONS.es,
    auth: AUTH_TRANSLATIONS.es,
    dashboard: DASHBOARD_TRANSLATIONS.es,
    calendar: CALENDAR_TRANSLATIONS.es,
    cats: CATS_TRANSLATIONS.es,
    owners: OWNERS_TRANSLATIONS.es,
    stays: STAYS_TRANSLATIONS.es,
    vets: VETS_TRANSLATIONS.es,
    accounts: ACCOUNTS_TRANSLATIONS.es,
  },
  en: {
    app: APP_SHELL_TRANSLATIONS.en,
    auth: AUTH_TRANSLATIONS.en,
    dashboard: DASHBOARD_TRANSLATIONS.en,
    calendar: CALENDAR_TRANSLATIONS.en,
    cats: CATS_TRANSLATIONS.en,
    owners: OWNERS_TRANSLATIONS.en,
    stays: STAYS_TRANSLATIONS.en,
    vets: VETS_TRANSLATIONS.en,
    accounts: ACCOUNTS_TRANSLATIONS.en,
  },
} satisfies Record<AppLanguage, AppTranslations>;
