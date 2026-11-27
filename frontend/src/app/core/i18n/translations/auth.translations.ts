import { AppLanguage } from '../app-language';

export interface AuthTranslations {
  demo: {
    title: string;
    enter: string;
    sharedData: string;
    inventedCredentials: string;
    nextScheduledCheck: string;
    resetNow: string;
    confirmReset: string;
    resetting: string;
    resetStatus: {
      CLEAN: string;
      QUEUED: string;
      COOLDOWN: string;
      LIMIT_REACHED: string;
    };
    reconnecting: string;
    statusUnavailable: string;
    retry: string;
    resetFailed: string;
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
        'Esta es la demo de CatWorld. Podés explorar la aplicación y hacer cambios con datos ficticios. Los cambios se comparten con otros visitantes y se restablecen periódicamente.',
      inventedCredentials: 'Para entrar con una cuenta de prueba, usá credenciales inventadas.',
      nextScheduledCheck: 'Próximo intento de reinicio',
      resetNow: 'Reiniciar ahora',
      confirmReset: 'El reinicio borra los cambios de todos los visitantes. ¿Querés continuar?',
      resetting: 'Solicitando reinicio…',
      resetStatus: {
        CLEAN: 'La demo ya está en su estado inicial.',
        QUEUED: 'Reinicio solicitado. Podés entrar cuando termine.',
        COOLDOWN: 'Hay que esperar un momento antes de solicitar otro reinicio.',
        LIMIT_REACHED:
          'Se alcanzó el límite de reinicios de hoy. Contactá a quien te compartió la demo si necesitás otro',
      },
      reconnecting: 'Reconectando con la demo…',
      statusUnavailable: 'No se pudo consultar el estado de la demo.',
      retry: 'Reintentar',
      resetFailed: 'No se pudo solicitar el reinicio. Intentá de nuevo en un momento.',
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
      sharedData:
        'This is the CatWorld demo. You can explore the app and make changes using fictional data. Changes are shared with other visitors and reset periodically.',
      inventedCredentials: 'Use made-up credentials to sign in with a test account.',
      nextScheduledCheck: 'Next scheduled reset attempt',
      resetNow: 'Reset now',
      confirmReset: 'Resetting the demo erases changes made by all visitors. Continue?',
      resetting: 'Requesting reset…',
      resetStatus: {
        CLEAN: 'The demo is already in its initial state.',
        QUEUED: 'Reset requested. You can sign in when it finishes.',
        COOLDOWN: 'Wait a moment before requesting another reset.',
        LIMIT_REACHED:
          'Today’s reset limit has been reached. Contact the person who shared the demo if you need another reset.',
      },
      reconnecting: 'Reconnecting to the demo…',
      statusUnavailable: 'The demo status could not be loaded.',
      retry: 'Retry',
      resetFailed: 'The reset could not be requested. Try again in a moment.',
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
