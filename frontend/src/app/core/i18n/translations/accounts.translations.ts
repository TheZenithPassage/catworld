import { AppLanguage } from '../app-language';

export interface AccountsTranslations {
  title: string;
  description: string;
  loading: string;
  errorLoading: string;
  retry: string;
  empty: string;
  create: {
    title: string;
    username: string;
    password: string;
    role: string;
    submit: string;
    submitting: string;
    errors: {
      usernameRequired: string;
      passwordRequired: string;
      invalidUsername: string;
      invalidPassword: string;
      duplicateUsername: string;
      createFailed: string;
    };
  };
  table: {
    username: string;
    role: string;
    enabled: string;
    actions: string;
  };
  you: string;
  roles: {
    admin: string;
    staff: string;
  };
  states: {
    enabled: string;
    disabled: string;
  };
  actions: {
    saveRole: string;
    enable: string;
    disable: string;
    updating: string;
  };
  errors: {
    updateFailed: string;
    lastEnabledAdmin: string;
    notFound: string;
    invalidInput: string;
  };
}

export const ACCOUNTS_TRANSLATIONS = {
  es: {
    title: 'Cuentas de acceso',
    description: 'Desde aquí puedes administrar las cuentas y su nivel de acceso.',
    loading: 'Cargando cuentas…',
    errorLoading: 'No se pudieron cargar las cuentas.',
    retry: 'Reintentar',
    empty: 'No hay cuentas disponibles.',
    create: {
      title: 'Nueva cuenta',
      username: 'Nombre de usuario',
      password: 'Contraseña',
      role: 'Nivel de acceso',
      submit: 'Crear cuenta',
      submitting: 'Creando…',
      errors: {
        usernameRequired: 'El nombre de usuario es obligatorio.',
        passwordRequired: 'La contraseña es obligatoria.',
        invalidUsername: 'El nombre de usuario contiene caracteres inválidos o es demasiado largo.',
        invalidPassword: 'La contraseña debe contener al menos un caracter válido.',
        duplicateUsername: 'Ya existe una cuenta con ese nombre.',
        createFailed: 'No se pudo crear la cuenta.',
      },
    },
    table: {
      username: 'Nombre de usuario',
      role: 'Nivel de acceso',
      enabled: 'Estado',
      actions: 'Acciones',
    },
    you: 'Tú',
    roles: {
      admin: 'Administrador',
      staff: 'Estándar',
    },
    states: {
      enabled: 'Habilitado',
      disabled: 'Deshabilitado',
    },
    actions: {
      saveRole: 'Guardar',
      enable: 'Habilitar',
      disable: 'Deshabilitar',
      updating: 'Actualizando…',
    },
    errors: {
      updateFailed: 'No se pudo actualizar la cuenta.',
      lastEnabledAdmin: 'Debe existir al menos una cuenta administradora habilitada.',
      notFound: 'La cuenta ya no existe.',
      invalidInput: 'Los datos enviados no son válidos.',
    },
  },
  en: {
    title: 'Accounts',
    description: 'Here you can manage existing accounts and create new ones.',
    loading: 'Loading accounts…',
    errorLoading: 'Accounts could not be loaded.',
    retry: 'Retry',
    empty: 'No accounts are available.',
    create: {
      title: 'Create account',
      username: 'Username',
      password: 'Password',
      role: 'Role',
      submit: 'Create account',
      submitting: 'Creating…',
      errors: {
        usernameRequired: 'Username is required.',
        passwordRequired: 'Password is required.',
        invalidUsername: 'Username has invalid characters or is too long.',
        invalidPassword: 'Password must contain at least one valid character.',
        duplicateUsername: 'An account with that username already exists.',
        createFailed: 'The account could not be created.',
      },
    },
    table: {
      username: 'Username',
      role: 'Role',
      enabled: 'Status',
      actions: 'Actions',
    },
    you: 'You',
    roles: {
      admin: 'Administrator',
      staff: 'Staff',
    },
    states: {
      enabled: 'Enabled',
      disabled: 'Disabled',
    },
    actions: {
      saveRole: 'Save role',
      enable: 'Enable',
      disable: 'Disable',
      updating: 'Updating…',
    },
    errors: {
      updateFailed: 'The account could not be updated.',
      lastEnabledAdmin: 'At least one enabled administrator account is required.',
      notFound: 'The account no longer exists.',
      invalidInput: 'The submitted data is invalid.',
    },
  },
} satisfies Record<AppLanguage, AccountsTranslations>;
