import { AppLanguage } from '../app-language';

export interface VetsTranslations {
  emptyValue: string;
  detail: {
    title: string;
    loading: string;
    loadFailed: string;
    retry: string;
    edit: string;
    cancel: string;
    close: string;
    openDetails: string;
  };
  form: {
    name: string;
    address: string;
    phoneNumber: string;
    registrationNumber: string;
    notes: string;
  };
  create: {
    title: string;
    description: string;
    cancel: string;
    submit: string;
    submitting: string;
    errors: {
      nameRequired: string;
      registrationNumberTooLong: string;
      createFailed: string;
      notesTooLong: string;
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
      registrationNumberTooLong: string;
      updateFailed: string;
      notesTooLong: string;
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
    detail: {
      title: 'Detalles del veterinario',
      loading: 'Cargando veterinario...',
      loadFailed: 'Error al cargar el veterinario',
      retry: 'Reintentar',
      edit: 'Editar',
      cancel: 'Cancelar',
      close: 'Cerrar',
      openDetails: 'Ver detalles',
    },
    form: {
      name: 'Nombre',
      address: 'Dirección',
      phoneNumber: 'Número de teléfono',
      registrationNumber: 'Número de matrícula profesional',
      notes: 'Notas',
    },
    create: {
      title: 'Crear veterinario',
      description: 'Registrar un nuevo veterinario.',
      cancel: 'Cancelar',
      submit: 'Crear veterinario',
      submitting: 'Creando...',
      errors: {
        nameRequired: 'El nombre es obligatorio',
        registrationNumberTooLong: 'El número de matrícula no puede superar los 100 caracteres',
        createFailed: 'Error al crear el veterinario',
        notesTooLong: 'Las notas no pueden superar los 10.000 caracteres',
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
        registrationNumberTooLong: 'El número de matrícula no puede superar los 100 caracteres',
        updateFailed: 'Error al actualizar el veterinario',
        notesTooLong: 'Las notas no pueden superar los 10.000 caracteres',
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
    detail: {
      title: 'Vet details',
      loading: 'Loading vet...',
      loadFailed: 'Error loading vet',
      retry: 'Retry',
      edit: 'Edit',
      cancel: 'Cancel',
      close: 'Close',
      openDetails: 'View details',
    },
    form: {
      name: 'Name',
      address: 'Address',
      phoneNumber: 'Phone number',
      registrationNumber: 'Professional registration number',
      notes: 'Notes',
    },
    create: {
      title: 'Create vet',
      description: 'Register a new vet.',
      cancel: 'Cancel',
      submit: 'Create vet',
      submitting: 'Creating...',
      errors: {
        nameRequired: 'Name is required',
        registrationNumberTooLong: 'Registration number must not exceed 100 characters',
        createFailed: 'Error creating vet',
        notesTooLong: 'Notes must not exceed 10,000 characters',
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
        registrationNumberTooLong: 'Registration number must not exceed 100 characters',
        updateFailed: 'Error updating vet',
        notesTooLong: 'Notes must not exceed 10,000 characters',
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
