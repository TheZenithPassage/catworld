import { AppLanguage } from '../app-language';

export interface StaysTranslations {
  emptyValue: string;
  status: {
    reserved: string;
    'checked-in': string;
    'checked-out': string;
    cancelled: string;
  };
  filters: {
    searchAriaLabel: string;
    cat: string;
    searchCat: string;
    clear: string;
    noCatsMatch: string;
    owner: string;
    searchOwnerOrCats: string;
    noOwnersMatch: string;
  };
  overview: {
    title: string;
    description: string;
    create: string;
    statusFiltersAriaLabel: string;
    loading: string;
    retry: string;
    empty: string;
    emptyFiltered: string;
    errorLoading: string;
    errorCancelling: string;
    table: {
      state: string;
      start: string;
      end: string;
      cats: string;
      owner: string;
      notes: string;
      actions: string;
    };
    edit: string;
    cancel: string;
    cancelling: string;
    alreadyCancelled: string;
    alreadyCheckedOut: string;
    cancelConfirmPrefix: string;
    cancelConfirmSuffix: string;
    catSingular: string;
    catPlural: string;
  };
  create: {
    title: string;
    description: string;
    loading: string;
    owner: string;
    selectOwner: string;
    createOwner: string;
    cats: string;
    noCatsForOwner: string;
    createCat: string;
    startDateTime: string;
    endDateTime: string;
    notes: string;
    submit: string;
    submitting: string;
    errors: {
      loadFormDataFailed: string;
      selectAtLeastOneCat: string;
      datesRequired: string;
      endAfterStart: string;
      createFailed: string;
    };
  };
  edit: {
    title: string;
    description: string;
    backToStays: string;
    loading: string;
    owner: string;
    cats: string;
    startDateTime: string;
    endDateTime: string;
    notes: string;
    submit: string;
    submitting: string;
    errors: {
      stayIdMissing: string;
      closedCannotBeModified: string;
      loadFailed: string;
      dataNotLoaded: string;
      datesRequired: string;
      endAfterStart: string;
      updateFailed: string;
    };
  };
}

export const STAYS_TRANSLATIONS = {
  es: {
    emptyValue: '-',
    status: {
      reserved: 'Reservada',
      'checked-in': 'En curso',
      'checked-out': 'Finalizada',
      cancelled: 'Cancelada',
    },
    filters: {
      searchAriaLabel: 'Filtros de búsqueda de estancias',
      cat: 'Gato',
      searchCat: 'Buscar gato',
      clear: 'Limpiar',
      noCatsMatch: 'Ningún gato coincide con esta búsqueda.',
      owner: 'Dueño',
      searchOwnerOrCats: 'Buscar dueño o uno de sus gatos',
      noOwnersMatch: 'Ningún dueño coincide con esta búsqueda.',
    },
    overview: {
      title: 'Estancias',
      description: 'Desde aquí puedes administrar las estancias activas y crear nuevas.',
      create: 'Crear estancia',
      statusFiltersAriaLabel: 'Filtros de estado de estancias',
      loading: 'Cargando estancias...',
      retry: 'Reintentar',
      empty: 'No hay estancias registradas.',
      emptyFiltered: 'Ninguna estancia coincide con los filtros seleccionados.',
      errorLoading: 'Error al cargar estancias',
      errorCancelling: 'Error al cancelar la estancia',
      table: {
        state: 'Estado',
        start: 'Inicio',
        end: 'Fin',
        cats: 'Gatos',
        owner: 'Dueño',
        notes: 'Notas',
        actions: 'Acciones',
      },
      edit: 'Editar',
      cancel: 'Cancelar',
      cancelling: 'Cancelando...',
      alreadyCancelled: 'Cancelada',
      alreadyCheckedOut: 'Finalizada',
      cancelConfirmPrefix: '¿Cancelar estancia para ',
      cancelConfirmSuffix: '?',
      catSingular: 'gato',
      catPlural: 'gatos',
    },
    create: {
      title: 'Crear estancia',
      description: 'Registrar una nueva estancia.',
      loading: 'Cargando datos del formulario...',
      owner: 'Dueño',
      selectOwner: 'Selecciona un dueño',
      createOwner: 'Crear dueño',
      cats: 'Gatos',
      noCatsForOwner: 'No se encontraron gatos para este dueño.',
      createCat: 'Crear gato',
      startDateTime: 'Fecha/hora de inicio',
      endDateTime: 'Fecha/hora de fin',
      notes: 'Notas',
      submit: 'Crear estancia',
      submitting: 'Creando...',
      errors: {
        loadFormDataFailed: 'Error al cargar los datos del formulario',
        selectAtLeastOneCat: 'Selecciona al menos un gato',
        datesRequired: 'La fecha de inicio y fin son obligatorias',
        endAfterStart: 'La fecha de fin debe ser posterior a la fecha de inicio',
        createFailed: 'Error al crear la estancia',
      },
    },
    edit: {
      title: 'Editar estancia',
      description: 'Actualizar fechas y notas de la estancia.',
      backToStays: 'Volver',
      loading: 'Cargando estancia...',
      owner: 'Dueño',
      cats: 'Gatos',
      startDateTime: 'Fecha/hora de inicio',
      endDateTime: 'Fecha/hora de fin',
      notes: 'Notas',
      submit: 'Guardar cambios',
      submitting: 'Guardando...',
      errors: {
        stayIdMissing: 'Falta el id de la estancia',
        closedCannotBeModified: 'Las estancias cerradas no se pueden modificar',
        loadFailed: 'Error al cargar la estancia',
        dataNotLoaded: 'Los datos de la estancia no están cargados',
        datesRequired: 'La fecha de inicio y fin son obligatorias',
        endAfterStart: 'La fecha de fin debe ser posterior a la fecha de inicio',
        updateFailed: 'Error al actualizar la estancia',
      },
    },
  },
  en: {
    emptyValue: '-',
    status: {
      reserved: 'Reserved',
      'checked-in': 'Checked-in',
      'checked-out': 'Checked-out',
      cancelled: 'Cancelled',
    },
    filters: {
      searchAriaLabel: 'Stay search filters',
      cat: 'Cat',
      searchCat: 'Search cat',
      clear: 'Clear',
      noCatsMatch: 'No cats match this search.',
      owner: 'Owner',
      searchOwnerOrCats: 'Search owner or one of their cats',
      noOwnersMatch: 'No owners match this search.',
    },
    overview: {
      title: 'Stays',
      description: 'Here you can manage active stays and create new ones.',
      create: 'Create stay',
      statusFiltersAriaLabel: 'Stay status filters',
      loading: 'Loading stays...',
      retry: 'Retry',
      empty: 'No stays registered.',
      emptyFiltered: 'No stays match the selected filters.',
      errorLoading: 'Error loading stays',
      errorCancelling: 'Error cancelling stay',
      table: {
        state: 'State',
        start: 'Start',
        end: 'End',
        cats: 'Cats',
        owner: 'Owner',
        notes: 'Notes',
        actions: 'Actions',
      },
      edit: 'Edit',
      cancel: 'Cancel',
      cancelling: 'Cancelling...',
      alreadyCancelled: 'Already cancelled',
      alreadyCheckedOut: 'Already checked-out',
      cancelConfirmPrefix: 'Cancel stay for ',
      cancelConfirmSuffix: '?',
      catSingular: 'cat',
      catPlural: 'cats',
    },
    create: {
      title: 'Create stay',
      description: 'Register a new stay.',
      loading: 'Loading form data...',
      owner: 'Owner',
      selectOwner: 'Select an owner',
      createOwner: 'Create owner',
      cats: 'Cats',
      noCatsForOwner: 'No cats found for this owner.',
      createCat: 'Create cat',
      startDateTime: 'Start date/time',
      endDateTime: 'End date/time',
      notes: 'Notes',
      submit: 'Create stay',
      submitting: 'Creating...',
      errors: {
        loadFormDataFailed: 'Error loading form data',
        selectAtLeastOneCat: 'Select at least one cat',
        datesRequired: 'Start and end date are required',
        endAfterStart: 'End date must be after start date',
        createFailed: 'Error creating stay',
      },
    },
    edit: {
      title: 'Edit stay',
      description: 'Update stay dates and notes.',
      backToStays: 'Back to stays',
      loading: 'Loading stay...',
      owner: 'Owner',
      cats: 'Cats',
      startDateTime: 'Start date/time',
      endDateTime: 'End date/time',
      notes: 'Notes',
      submit: 'Save changes',
      submitting: 'Saving...',
      errors: {
        stayIdMissing: 'Stay id is missing',
        closedCannotBeModified: 'Closed stays cannot be modified',
        loadFailed: 'Error loading stay',
        dataNotLoaded: 'Stay data is not loaded',
        datesRequired: 'Start and end date are required',
        endAfterStart: 'End date must be after start date',
        updateFailed: 'Error updating stay',
      },
    },
  },
} satisfies Record<AppLanguage, StaysTranslations>;
