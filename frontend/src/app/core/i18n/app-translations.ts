import { AppLanguage } from './app-language';

export interface AppTranslations {
  app: {
    logoAlt: string;
    nav: {
      dashboard: string;
      stays: string;
      calendar: string;
      cats: string;
      owners: string;
      vets: string;
    };
    language: {
      toggleLabel: string;
      switchToEnglish: string;
      switchToSpanish: string;
    };
    logout: string;
  };

  auth: {
  login: {
    logoAlt: string;
    title: string;
    description: string;
    username: string;
    password: string;
    submit: string;
    submitting: string;
    errors: {
      usernameRequired: string;
      passwordRequired: string;
      invalidCredentials: string;
      loginFailed: string;
    };
  };

};
}

export const APP_TRANSLATIONS = {
  es: {
    app: {
      logoAlt: 'Logo de CatWorld',
      nav: {
        dashboard: 'Panel',
        stays: 'Estancias',
        calendar: 'Calendario',
        cats: 'Gatos',
        owners: 'Dueños',
        vets: 'Veterinarios',
      },
      language: {
        toggleLabel: 'Cambiar idioma',
        switchToEnglish: 'Cambiar a inglés',
        switchToSpanish: 'Cambiar a español',
      },
      logout: 'Cerrar sesión',
    },
    auth: {
      login: {
        logoAlt: 'Logo de CatWorld',
        title: 'Iniciar sesión',
        description: 'Introduce tus credenciales de CatWorld para continuar.',
        username: 'Usuario',
        password: 'Contraseña',
        submit: 'Entrar',
        submitting: 'Entrando...',
        errors: {
          usernameRequired: 'El usuario es obligatorio',
          passwordRequired: 'La contraseña es obligatoria',
          invalidCredentials: 'Usuario o contraseña incorrectos',
          loginFailed: 'Error al iniciar sesión',
        },
      },
    },
  },
  en: {
    app: {
      logoAlt: 'CatWorld logo',
      nav: {
        dashboard: 'Dashboard',
        stays: 'Stays',
        calendar: 'Calendar',
        cats: 'Cats',
        owners: 'Owners',
        vets: 'Vets',
      },
      language: {
        toggleLabel: 'Change language',
        switchToEnglish: 'Switch to English',
        switchToSpanish: 'Switch to Spanish',
      },
      logout: 'Log out',
    },
    auth: {
      login: {
        logoAlt: 'CatWorld logo',
        title: 'Login',
        description: 'Enter your CatWorld credentials to continue.',
        username: 'Username',
        password: 'Password',
        submit: 'Log in',
        submitting: 'Logging in...',
        errors: {
          usernameRequired: 'Username is required',
          passwordRequired: 'Password is required',
          invalidCredentials: 'Invalid username or password',
          loginFailed: 'Error logging in',
        },
      },
    },
  },
} satisfies Record<AppLanguage, AppTranslations>;