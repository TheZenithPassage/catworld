import { AppLanguage } from '../app-language';

export interface OwnersTranslations {
  emptyValue: string;
  form: {
    fullName: string;
    primaryPhone: string;
    address: string;
    secondaryPhone: string;
    secondaryPhoneName: string;
    instagram: string;
    facebook: string;
  };
  create: {
    title: string;
    description: string;
    submit: string;
    submitting: string;
    errors: {
      fullNameRequired: string;
      primaryPhoneRequired: string;
      createFailed: string;
    };
  };
  edit: {
    title: string;
    description: string;
    backToOwners: string;
    loading: string;
    submit: string;
    submitting: string;
    errors: {
      ownerIdMissing: string;
      loadFailed: string;
      fullNameRequired: string;
      primaryPhoneRequired: string;
      updateFailed: string;
    };
  };
  overview: {
    title: string;
    description: string;
    create: string;
    loading: string;
    retry: string;
    empty: string;
    searchLabel: string;
    searchPlaceholder: string;
    clearSearch: string;
    emptyFiltered: string;
    errorLoading: string;
    table: {
      name: string;
      primaryPhone: string;
      secondaryPhone: string;
      address: string;
      social: string;
      actions: string;
    };
    social: {
      instagram: string;
      facebook: string;
    };
    edit: string;
  };
}

export const OWNERS_TRANSLATIONS = {
  es: {
    emptyValue: '-',
    form: {
      fullName: 'Nombre completo',
      primaryPhone: 'Teléfono',
      address: 'Dirección',
      secondaryPhone: 'Teléfono secundario',
      secondaryPhoneName: 'Nombre del teléfono secundario',
      instagram: 'Instagram',
      facebook: 'Facebook',
    },
    create: {
      title: 'Crear dueño',
      description: 'Crear un nuevo dueño.',
      submit: 'Crear dueño',
      submitting: 'Creando...',
      errors: {
        fullNameRequired: 'El nombre completo es obligatorio',
        primaryPhoneRequired: 'El teléfono principal es obligatorio',
        createFailed: 'Error al crear el dueño',
      },
    },
    edit: {
      title: 'Editar dueño',
      description: 'Actualizar información de contacto del dueño.',
      backToOwners: 'Volver',
      loading: 'Cargando dueño...',
      submit: 'Guardar cambios',
      submitting: 'Guardando...',
      errors: {
        ownerIdMissing: 'Falta el id del dueño',
        loadFailed: 'Error al cargar el dueño',
        fullNameRequired: 'El nombre completo es obligatorio',
        primaryPhoneRequired: 'El teléfono principal es obligatorio',
        updateFailed: 'Error al actualizar el dueño',
      },
    },
    overview: {
      title: 'Dueños',
      description: 'Desde aquí puedes administrar los dueños registrados y crear nuevos.',
      create: 'Crear dueño',
      loading: 'Cargando dueños...',
      retry: 'Reintentar',
      empty: 'No hay dueños registrados.',
      searchLabel: 'Buscar',
      searchPlaceholder: 'Buscar dueño',
      clearSearch: 'Limpiar',
      emptyFiltered: 'Ningún dueño coincide con la búsqueda.',
      errorLoading: 'Error al cargar dueños',
      table: {
        name: 'Nombre',
        primaryPhone: 'Teléfono principal',
        secondaryPhone: 'Teléfono secundario',
        address: 'Dirección',
        social: 'Social',
        actions: 'Acciones',
      },
      social: {
        instagram: 'Instagram',
        facebook: 'Facebook',
      },
      edit: 'Editar',
    },
  },
  en: {
    emptyValue: '-',
    form: {
      fullName: 'Full name',
      primaryPhone: 'Primary phone',
      address: 'Address',
      secondaryPhone: 'Secondary phone',
      secondaryPhoneName: 'Secondary phone name',
      instagram: 'Instagram',
      facebook: 'Facebook',
    },
    create: {
      title: 'Create owner',
      description: 'Register a new owner.',
      submit: 'Create owner',
      submitting: 'Creating...',
      errors: {
        fullNameRequired: 'Full name is required',
        primaryPhoneRequired: 'Primary phone is required',
        createFailed: 'Error creating owner',
      },
    },
    edit: {
      title: 'Edit owner',
      description: 'Update owner contact information.',
      backToOwners: 'Back to owners',
      loading: 'Loading owner...',
      submit: 'Save changes',
      submitting: 'Saving...',
      errors: {
        ownerIdMissing: 'Owner id is missing',
        loadFailed: 'Error loading owner',
        fullNameRequired: 'Full name is required',
        primaryPhoneRequired: 'Primary phone is required',
        updateFailed: 'Error updating owner',
      },
    },
    overview: {
      title: 'Owners',
      description: 'Here you can manage existing owners and create new ones.',
      create: 'Create owner',
      loading: 'Loading owners...',
      retry: 'Retry',
      empty: 'No owners registered.',
      searchLabel: 'Search',
      searchPlaceholder: 'Search owner',
      clearSearch: 'Clear',
      emptyFiltered: 'No owners match the search.',
      errorLoading: 'Error loading owners',
      table: {
        name: 'Name',
        primaryPhone: 'Primary phone',
        secondaryPhone: 'Secondary phone',
        address: 'Address',
        social: 'Social',
        actions: 'Actions',
      },
      social: {
        instagram: 'Instagram',
        facebook: 'Facebook',
      },
      edit: 'Edit',
    },
  },
} satisfies Record<AppLanguage, OwnersTranslations>;
