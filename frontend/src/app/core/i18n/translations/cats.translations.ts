import { AppLanguage } from '../app-language';

export interface CatsTranslations {
  emptyValue: string;
  form: {
    name: string;
    birthDate: string;
    sex: string;
    selectSex: string;
    male: string;
    female: string;
    owner: string;
    selectOwner: string;
    createOwner: string;
    vet: string;
    noVet: string;
    createVet: string;
    breed: string;
    coat: string;
    color: string;
    foodBrand: string;
    litterBrand: string;
    personality: string;
    lastInternalDewormerName: string;
    lastInternalDewormingDate: string;
    lastExternalDewormerName: string;
    lastExternalDewormingDate: string;
    lastTripleFelineDate: string;
    lastRabiesDate: string;
  };
  create: {
    title: string;
    description: string;
    loadingOwners: string;
    submit: string;
    submitting: string;
    errors: {
      loadFormDataFailed: string;
      nameRequired: string;
      birthDateRequired: string;
      sexRequired: string;
      ownerRequired: string;
      createFailed: string;
    };
  };
  edit: {
    title: string;
    description: string;
    backToCats: string;
    loading: string;
    submit: string;
    submitting: string;
    errors: {
      catIdMissing: string;
      loadFormDataFailed: string;
      dataNotLoaded: string;
      nameRequired: string;
      birthDateRequired: string;
      sexRequired: string;
      ownerRequired: string;
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
      owner: string;
      sex: string;
      birthDate: string;
      appearance: string;
      care: string;
      health: string;
      vet: string;
      actions: string;
    };
    care: {
      food: string;
      litter: string;
      personality: string;
    };
    health: {
      tripleFeline: string;
      rabies: string;
      internalDeworming: string;
      externalDeworming: string;
    };
    edit: string;
  };
}

export const CATS_TRANSLATIONS = {
  es: {
    emptyValue: '-',
    form: {
      name: 'Nombre',
      birthDate: 'Fecha de nacimiento',
      sex: 'Sexo',
      selectSex: 'Selecciona sexo',
      male: 'Macho',
      female: 'Hembra',
      owner: 'Dueño',
      selectOwner: 'Selecciona un dueño',
      createOwner: 'Crear dueño',
      vet: 'Veterinario',
      noVet: 'Sin veterinario',
      createVet: 'Crear veterinario',
      breed: 'Raza',
      coat: 'Pelaje',
      color: 'Color',
      foodBrand: 'Marca de comida',
      litterBrand: 'Marca de arena',
      personality: 'Personalidad',
      lastInternalDewormerName: 'Nombre del último desparasitante interno',
      lastInternalDewormingDate: 'Fecha de la última desparasitación interna',
      lastExternalDewormerName: 'Nombre del último desparasitante externo',
      lastExternalDewormingDate: 'Fecha de la última desparasitación externa',
      lastTripleFelineDate: 'Fecha de la última triple felina',
      lastRabiesDate: 'Fecha de la última rabia',
    },
    create: {
      title: 'Crear gato',
      description: 'Registrar un nuevo gato.',
      loadingOwners: 'Cargando dueños...',
      submit: 'Crear gato',
      submitting: 'Creando...',
      errors: {
        loadFormDataFailed: 'Error al cargar los datos del formulario',
        nameRequired: 'El nombre es obligatorio',
        birthDateRequired: 'La fecha de nacimiento es obligatoria',
        sexRequired: 'El sexo es obligatorio',
        ownerRequired: 'El dueño es obligatorio',
        createFailed: 'Error al crear el gato',
      },
    },
    edit: {
      title: 'Editar gato',
      description: 'Actualizar información del gato.',
      backToCats: 'Volver',
      loading: 'Cargando gato...',
      submit: 'Guardar cambios',
      submitting: 'Guardando...',
      errors: {
        catIdMissing: 'Falta el id del gato',
        loadFormDataFailed: 'Error al cargar los datos del formulario del gato',
        dataNotLoaded: 'Los datos del gato no están cargados',
        nameRequired: 'El nombre es obligatorio',
        birthDateRequired: 'La fecha de nacimiento es obligatoria',
        sexRequired: 'El sexo es obligatorio',
        ownerRequired: 'El dueño es obligatorio',
        updateFailed: 'Error al actualizar el gato',
      },
    },
    overview: {
      title: 'Gatos',
      description: 'Desde aquí puedes administrar los gatos registrados y crear nuevos.',
      create: 'Crear gato',
      loading: 'Cargando gatos...',
      retry: 'Reintentar',
      empty: 'No hay gatos registrados.',
      searchLabel: 'Buscar',
      searchPlaceholder: 'Buscar por gato o dueño',
      clearSearch: 'Limpiar',
      emptyFiltered: 'Ningún gato coincide con la búsqueda.',
      errorLoading: 'Error al cargar gatos',
      table: {
        name: 'Nombre',
        owner: 'Dueño',
        sex: 'Sexo',
        birthDate: 'Fecha de nacimiento',
        appearance: 'Apariencia',
        care: 'Cuidados',
        health: 'Salud',
        vet: 'Veterinario',
        actions: 'Acciones',
      },
      care: {
        food: 'Comida',
        litter: 'Arena',
        personality: 'Personalidad',
      },
      health: {
        tripleFeline: 'Triple felina',
        rabies: 'Rabia',
        internalDeworming: 'Desparasitación interna',
        externalDeworming: 'Desparasitación externa',
      },
      edit: 'Editar',
    },
  },
  en: {
    emptyValue: '-',
    form: {
      name: 'Name',
      birthDate: 'Birth date',
      sex: 'Sex',
      selectSex: 'Select sex',
      male: 'Male',
      female: 'Female',
      owner: 'Owner',
      selectOwner: 'Select an owner',
      createOwner: 'Create owner',
      vet: 'Vet',
      noVet: 'No vet',
      createVet: 'Create vet',
      breed: 'Breed',
      coat: 'Coat',
      color: 'Color',
      foodBrand: 'Food brand',
      litterBrand: 'Litter brand',
      personality: 'Personality',
      lastInternalDewormerName: 'Last internal dewormer name',
      lastInternalDewormingDate: 'Last internal deworming date',
      lastExternalDewormerName: 'Last external dewormer name',
      lastExternalDewormingDate: 'Last external deworming date',
      lastTripleFelineDate: 'Last triple feline date',
      lastRabiesDate: 'Last rabies date',
    },
    create: {
      title: 'Create cat',
      description: 'Register a new cat.',
      loadingOwners: 'Loading owners...',
      submit: 'Create cat',
      submitting: 'Creating...',
      errors: {
        loadFormDataFailed: 'Error loading form data',
        nameRequired: 'Name is required',
        birthDateRequired: 'Birth date is required',
        sexRequired: 'Sex is required',
        ownerRequired: 'Owner is required',
        createFailed: 'Error creating cat',
      },
    },
    edit: {
      title: 'Edit cat',
      description: 'Update cat information.',
      backToCats: 'Back to cats',
      loading: 'Loading cat...',
      submit: 'Save changes',
      submitting: 'Saving...',
      errors: {
        catIdMissing: 'Cat id is missing',
        loadFormDataFailed: 'Error loading cat form data',
        dataNotLoaded: 'Cat data is not loaded',
        nameRequired: 'Name is required',
        birthDateRequired: 'Birth date is required',
        sexRequired: 'Sex is required',
        ownerRequired: 'Owner is required',
        updateFailed: 'Error updating cat',
      },
    },
    overview: {
      title: 'Cats',
      description: 'From here you can manage registered cats and create new ones.',
      create: 'Create cat',
      loading: 'Loading cats...',
      retry: 'Retry',
      empty: 'No cats registered.',
      searchLabel: 'Search',
      searchPlaceholder: 'Search by cat or owner',
      clearSearch: 'Clear',
      emptyFiltered: 'No cats match the search.',
      errorLoading: 'Error loading cats',
      table: {
        name: 'Name',
        owner: 'Owner',
        sex: 'Sex',
        birthDate: 'Birth date',
        appearance: 'Appearance',
        care: 'Care',
        health: 'Health',
        vet: 'Vet',
        actions: 'Actions',
      },
      care: {
        food: 'Food',
        litter: 'Litter',
        personality: 'Personality',
      },
      health: {
        tripleFeline: 'Triple feline',
        rabies: 'Rabies',
        internalDeworming: 'Internal deworming',
        externalDeworming: 'External deworming',
      },
      edit: 'Edit',
    },
  },
} satisfies Record<AppLanguage, CatsTranslations>;
