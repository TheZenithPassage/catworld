import { AppLanguage } from '../app-language';

export interface AuthTranslations {
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
}

export const AUTH_TRANSLATIONS = {
  es: {
    login: {
      logoAlt: 'Logo de CatWorld',
      title: 'Iniciar sesión',
      description: 'Introduce tus credenciales para continuar.',
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
  en: {
    login: {
      logoAlt: 'CatWorld logo',
      title: 'Login',
      description: 'Enter your credentials to continue.',
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
} satisfies Record<AppLanguage, AuthTranslations>;
