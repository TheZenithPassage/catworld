import { AppLanguage } from '../app-language';

export interface AuthTranslations {
  demo: {
    title: string;
    enter: string;
    sharedData: string;
    reloadRequired: string;
  };
  login: {
    logoAlt: string;
    title: string;
    description: string;
    username: string;
    password: string;
    submit: string;
    submitting: string;
    navigating: string;
    errors: {
      usernameRequired: string;
      passwordRequired: string;
      invalidCredentials: string;
      loginFailed: string;
      accountDeletionForbidden: string;
    };
  };
}

export const AUTH_TRANSLATIONS = {
  es: {
    demo: {
      title: 'Demo de CatWorld',
      enter: 'Entrar a la demo',
      sharedData:
        'Los datos de la demo son ficticios, se comparten y se restablecen periódicamente.',
      reloadRequired: 'Se restablecieron los datos de la demo. ¿Querés recargar para continuar?',
    },
    login: {
      logoAlt: 'Logo de CatWorld',
      title: 'Iniciar sesión',
      description: 'Ingresá tus credenciales para continuar.',
      username: 'Usuario',
      password: 'Contraseña',
      submit: 'Entrar',
      submitting: 'Entrando...',
      navigating: 'Abriendo tu espacio de trabajo...',
      errors: {
        usernameRequired: 'El usuario es obligatorio',
        passwordRequired: 'La contraseña es obligatoria',
        invalidCredentials: 'Usuario o contraseña incorrectos',
        loginFailed: 'Error al iniciar sesión',
        accountDeletionForbidden:
          'Tu sesión ya no permite eliminar esa cuenta. Iniciá sesión de nuevo para continuar.',
      },
    },
  },
  en: {
    demo: {
      title: 'CatWorld demo',
      enter: 'Enter demo',
      sharedData: 'Demo data is fictional, shared with other visitors and reset periodically.',
      reloadRequired: 'The demo data has been reset. Reload to continue?',
    },
    login: {
      logoAlt: 'CatWorld logo',
      title: 'Login',
      description: 'Enter your credentials to continue.',
      username: 'Username',
      password: 'Password',
      submit: 'Log in',
      submitting: 'Logging in...',
      navigating: 'Opening your workspace...',
      errors: {
        usernameRequired: 'Username is required',
        passwordRequired: 'Password is required',
        invalidCredentials: 'Invalid username or password',
        loginFailed: 'Error logging in',
        accountDeletionForbidden:
          'Your session no longer permits deleting that account. Log in again to continue.',
      },
    },
  },
} satisfies Record<AppLanguage, AuthTranslations>;
