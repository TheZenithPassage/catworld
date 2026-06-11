import { AppLanguage } from '../app-language';

export interface VetsTranslations {
  emptyValue: string;
  form: {
    name: string;
    address: string;
    phoneNumber: string;
  };
  create: {
    title: string;
    description: string;
    submit: string;
    submitting: string;
    errors: {
      nameRequired: string;
      createFailed: string;
    };
  };
  edit: {
    title: string;
    description: string;
    backToVets: string;
    loading: string;
    submit: string;
    submitting: string;
    errors: {
      vetIdMissing: string;
      loadFailed: string;
      dataNotLoaded: string;
      nameRequired: string;
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
    errorLoading: string;
    searchLabel: string;
    searchPlaceholder: string;
    clearSearch: string;
    emptyFiltered: string;
    table: {
      name: string;
      phoneNumber: string;
      address: string;
      actions: string;
    };
    edit: string;
  };
}

export const VETS_TRANSLATIONS = {
  es: {
    emptyValue: '-',
    form: {
      name: 'Nombre',
      address: 'Dirección',
      phoneNumber: 'Número de teléfono',
    },
    create: {
      title: 'Crear veterinario',
      description: 'Registrar un nuevo veterinario.',
      submit: 'Crear veterinario',
      submitting: 'Creando...',
      errors: {
        nameRequired: 'El nombre es obligatorio',
        createFailed: 'Error al crear el veterinario',
      },
    },
    edit: {
      title: 'Editar veterinario',
      description: 'Actualizar información de contacto del veterinario.',
      backToVets: 'Volver',
      loading: 'Cargando veterinario...',
      submit: 'Guardar cambios',
      submitting: 'Guardando...',
      errors: {
        vetIdMissing: 'Falta el id del veterinario',
        loadFailed: 'Error al cargar el veterinario',
        dataNotLoaded: 'Los datos del veterinario no están cargados',
        nameRequired: 'El nombre es obligatorio',
        updateFailed: 'Error al actualizar el veterinario',
      },
    },
    overview: {
      title: 'Veterinarios',
      description: 'Desde aquí puedes administrar los veterinarios registrados y crear nuevos.',
      create: 'Crear veterinario',
      loading: 'Cargando veterinarios...',
      retry: 'Reintentar',
      empty: 'No hay veterinarios registrados.',
      searchLabel: 'Buscar',
      searchPlaceholder: 'Buscar veterinario',
      clearSearch: 'Limpiar',
      emptyFiltered: 'Ningún veterinario coincide con la búsqueda.',
      errorLoading: 'Error al cargar veterinarios',
      table: {
        name: 'Nombre',
        phoneNumber: 'Número de teléfono',
        address: 'Dirección',
        actions: 'Acciones',
      },
      edit: 'Editar',
    },
  },
  en: {
    emptyValue: '-',
    form: {
      name: 'Name',
      address: 'Address',
      phoneNumber: 'Phone number',
    },
    create: {
      title: 'Create vet',
      description: 'Register a new vet.',
      submit: 'Create vet',
      submitting: 'Creating...',
      errors: {
        nameRequired: 'Name is required',
        createFailed: 'Error creating vet',
      },
    },
    edit: {
      title: 'Edit vet',
      description: 'Update vet contact information.',
      backToVets: 'Back to vets',
      loading: 'Loading vet...',
      submit: 'Save changes',
      submitting: 'Saving...',
      errors: {
        vetIdMissing: 'Vet id is missing',
        loadFailed: 'Error loading vet',
        dataNotLoaded: 'Vet data is not loaded',
        nameRequired: 'Name is required',
        updateFailed: 'Error updating vet',
      },
    },
    overview: {
      title: 'Vets',
      description: 'Here you can manage existing vets and create new ones.',
      create: 'Create vet',
      loading: 'Loading vets...',
      retry: 'Retry',
      empty: 'No vets registered.',
      searchLabel: 'Search',
      searchPlaceholder: 'Search vet',
      clearSearch: 'Clear',
      emptyFiltered: 'No vets match the search.',
      errorLoading: 'Error loading vets',
      table: {
        name: 'Name',
        phoneNumber: 'Phone number',
        address: 'Address',
        actions: 'Actions',
      },
      edit: 'Edit',
    },
  },
} satisfies Record<AppLanguage, VetsTranslations>;
