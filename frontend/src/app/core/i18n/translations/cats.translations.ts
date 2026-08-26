import { AppLanguage } from '../app-language';

export interface CatsTranslations {
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
    photo: string;
    viewPhoto: string;
    photoLoading: string;
    photoMissing: string;
    photoLoadFailed: string;
    photoAlt: (catName: string) => string;
  };
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
  photo: {
    label: string;
    select: string;
    saved: string;
    replace: string;
    removeSaved: string;
    removeSelection: string;
    pendingRemoval: string;
    undoRemoval: string;
    previewUnavailable: string;
    previewAlt: string;
    errors: {
      localFileTooLarge: string;
      localUnsupportedFormat: string;
      fileTooLarge: string;
      unsupportedFormat: string;
      dimensionsTooLarge: string;
      undecodable: string;
      intentConflict: string;
    };
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
    detail: {
      title: 'Detalles del gato',
      loading: 'Cargando gato...',
      loadFailed: 'Error al cargar el gato',
      retry: 'Reintentar',
      edit: 'Editar',
      cancel: 'Cancelar',
      close: 'Cerrar',
      openDetails: 'Ver detalles',
      photo: 'Foto',
      viewPhoto: 'Ver foto',
      photoLoading: 'Cargando foto...',
      photoMissing: 'Este gato no tiene foto.',
      photoLoadFailed: 'Error al cargar la foto.',
      photoAlt: (catName) => `Foto de ${catName}`,
    },
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
    photo: {
      label: 'Foto de perfil',
      select: 'Seleccionar foto',
      saved: 'Este gato tiene una foto guardada.',
      replace: 'Reemplazar foto',
      removeSaved: 'Eliminar foto',
      removeSelection: 'Quitar selección',
      pendingRemoval: 'La foto guardada se eliminará al guardar.',
      undoRemoval: 'Deshacer eliminación',
      previewUnavailable: 'La vista previa no está disponible; el archivo se enviará al guardar.',
      previewAlt: 'Vista previa completa de la foto de perfil seleccionada',
      errors: {
        localFileTooLarge: 'Selecciona una foto de 32 MiB o menos.',
        localUnsupportedFormat: 'Selecciona una foto JPEG, PNG, WebP, HEIC o HEIF.',
        fileTooLarge: 'La foto supera el límite de 32 MiB. Selecciona un archivo más pequeño.',
        unsupportedFormat:
          'El formato no es compatible. Selecciona una foto JPEG, PNG, WebP, HEIC o HEIF.',
        dimensionsTooLarge:
          'Las dimensiones de la foto son demasiado grandes. Selecciona una imagen más pequeña.',
        undecodable: 'No se pudo leer la foto. Selecciona otro archivo de imagen válido.',
        intentConflict:
          'No se puede reemplazar y eliminar la foto a la vez. Revisa la selección e inténtalo de nuevo.',
      },
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
    detail: {
      title: 'Cat details',
      loading: 'Loading cat...',
      loadFailed: 'Error loading cat',
      retry: 'Retry',
      edit: 'Edit',
      cancel: 'Cancel',
      close: 'Close',
      openDetails: 'View details',
      photo: 'Photo',
      viewPhoto: 'View photo',
      photoLoading: 'Loading photo...',
      photoMissing: 'This cat has no photo.',
      photoLoadFailed: 'Error loading photo.',
      photoAlt: (catName) => `Photo of ${catName}`,
    },
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
    photo: {
      label: 'Profile photo',
      select: 'Select photo',
      saved: 'This cat has a saved photo.',
      replace: 'Replace photo',
      removeSaved: 'Remove photo',
      removeSelection: 'Remove selection',
      pendingRemoval: 'The saved photo will be removed when you save.',
      undoRemoval: 'Undo removal',
      previewUnavailable: 'Preview is unavailable; the file will still be uploaded when you save.',
      previewAlt: 'Complete preview of the selected cat profile photo',
      errors: {
        localFileTooLarge: 'Select a photo that is 32 MiB or smaller.',
        localUnsupportedFormat: 'Select a JPEG, PNG, WebP, HEIC, or HEIF photo.',
        fileTooLarge: 'The photo exceeds the 32 MiB limit. Select a smaller file.',
        unsupportedFormat:
          'This format is not supported. Select a JPEG, PNG, WebP, HEIC, or HEIF photo.',
        dimensionsTooLarge: 'The photo dimensions are too large. Select a smaller image.',
        undecodable: 'The photo could not be read. Select another valid image file.',
        intentConflict:
          'The photo cannot be replaced and removed at the same time. Review the selection and try again.',
      },
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
